import type {
  DataSourceAdapter,
  DataSourceConfig,
  ConnectionTestResult,
} from '@/adapters/DataSourceAdapter'
import { QUERIES } from '@/adapters/prometheusQueries'
import {
  DataSourceError,
  type HomelabSnapshot,
  type ContainerInfo,
  type SystemMetric,
  type ServiceStatus,
} from '@/types'

export interface PrometheusAdapterConfig extends DataSourceConfig {
  kind: 'prometheus'
  timeoutMs?: number
}

// --- Shape de respuesta de la API de Prometheus ---------------------------

interface PrometheusVectorResult {
  metric: Record<string, string>
  value: [number, string]
}

interface PrometheusQueryResponse {
  status: 'success' | 'error'
  data?: {
    resultType: string
    result: PrometheusVectorResult[]
  }
  error?: string
}

// --- Adapter ---------------------------------------------------------------

export class PrometheusAdapter implements DataSourceAdapter {
  readonly kind = 'prometheus' as const
  readonly displayName = 'Prometheus'

  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(config: PrometheusAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.timeoutMs = config.timeoutMs ?? 5000
  }

  // Prometheus no tiene login: cualquier config con URL válida "autentica" sola.
  // El store la va a tratar como autenticada apenas se conecta.

  async fetchSnapshot(): Promise<HomelabSnapshot> {
    const [hostCpu, hostMemory, hostDisk, containerCpu, containerMemory, targetsUp] =
      await Promise.all([
        this.query(QUERIES.hostCpuPercent),
        this.query(QUERIES.hostMemoryPercent),
        this.query(QUERIES.hostDiskPercent),
        this.query(QUERIES.containerCpuPercent),
        this.query(QUERIES.containerMemoryBytes),
        this.query(QUERIES.targetsUp),
      ])

    return {
      metrics: buildHostMetrics(hostCpu, hostMemory, hostDisk),
      containers: buildContainers(containerCpu, containerMemory),
      services: buildServices(targetsUp),
      fetchedAt: new Date().toISOString(),
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now()
    try {
      // "vector(1)" es una consulta constante: sirve para probar que
      // Prometheus responde, sin depender de que haya exporters configurados.
      await this.query('vector(1)')
      return {
        ok: true,
        message: 'Conectado a Prometheus correctamente.',
        latencyMs: Math.round(performance.now() - start),
      }
    } catch (err) {
      return {
        ok: false,
        message: err instanceof DataSourceError ? err.message : 'No se pudo conectar a Prometheus.',
      }
    }
  }

  /** Ejecuta una query PromQL contra /api/v1/query y devuelve los resultados "crudos" */
  private async query(promql: string): Promise<PrometheusVectorResult[]> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const url = `${this.baseUrl}/api/v1/query?query=${encodeURIComponent(promql)}`
      const res = await fetch(url, { signal: controller.signal })

      if (!res.ok) {
        throw new DataSourceError(`Prometheus respondió ${res.status} para la query: ${promql}`)
      }

      const body = (await res.json()) as PrometheusQueryResponse
      if (body.status !== 'success' || !body.data) {
        throw new DataSourceError(`Prometheus devolvió un error para la query: ${body.error ?? promql}`)
      }

      return body.data.result
    } catch (err) {
      if (err instanceof DataSourceError) throw err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new DataSourceError(`Prometheus no respondió en ${this.timeoutMs}ms`, err)
      }
      throw new DataSourceError('No se pudo contactar a Prometheus', err)
    } finally {
      clearTimeout(timeout)
    }
  }
}

// --- Builders: resultado de PromQL -> tipos de dominio de ServerPulse -----

function scalarValue(result: PrometheusVectorResult[]): number | undefined {
  const raw = result[0]?.value[1]
  return raw !== undefined ? parseFloat(raw) : undefined
}

function buildHostMetrics(
  cpu: PrometheusVectorResult[],
  memory: PrometheusVectorResult[],
  disk: PrometheusVectorResult[],
): SystemMetric[] {
  const metrics: SystemMetric[] = []

  const cpuValue = scalarValue(cpu)
  if (cpuValue !== undefined) metrics.push({ id: 'cpu', label: 'CPU', value: cpuValue, unit: 'percent', max: 100 })

  const memValue = scalarValue(memory)
  if (memValue !== undefined) metrics.push({ id: 'memory', label: 'Memoria', value: memValue, unit: 'percent', max: 100 })

  const diskValue = scalarValue(disk)
  if (diskValue !== undefined) metrics.push({ id: 'disk', label: 'Disco', value: diskValue, unit: 'percent', max: 100 })

  return metrics
}

function buildContainers(
  cpuResults: PrometheusVectorResult[],
  memoryResults: PrometheusVectorResult[],
): ContainerInfo[] {
  const memoryByName = new Map<string, number>()
  for (const r of memoryResults) {
    const name = r.metric.name
    if (name) memoryByName.set(name, parseFloat(r.value[1]))
  }

  // La lista de contenedores sale de la query de CPU: si cAdvisor está
  // reportando CPU de un contenedor, es porque está corriendo ahora mismo.
  return cpuResults
    .filter((r) => r.metric.name)
    .map((r) => {
      const name = r.metric.name
      const memoryBytes = memoryByName.get(name)
      return {
        id: name,
        name,
        image: r.metric.image ?? 'desconocida',
        status: 'running',
        cpuPercent: parseFloat(r.value[1]),
        memoryMb: memoryBytes !== undefined ? Math.round(memoryBytes / 1024 / 1024) : undefined,
      } satisfies ContainerInfo
    })
}

function buildServices(targetsUp: PrometheusVectorResult[]): ServiceStatus[] {
  return targetsUp.map((r) => {
    const label = r.metric.job ?? r.metric.instance ?? 'desconocido'
    return {
      id: `${r.metric.job ?? ''}-${r.metric.instance ?? ''}`,
      name: label,
      health: r.value[1] === '1' ? 'healthy' : 'down',
    } satisfies ServiceStatus
  })
}