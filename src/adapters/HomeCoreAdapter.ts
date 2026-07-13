import type {
  DataSourceAdapter,
  DataSourceConfig,
  ConnectionTestResult,
} from '@/adapters/DataSourceAdapter'
import {
  DataSourceError,
  type HomelabSnapshot,
  type ContainerInfo,
  type ContainerStatus,
  type SystemMetric,
  type ServiceStatus,
} from '@/types'

export interface HomeCoreAdapterConfig extends DataSourceConfig {
  kind: 'homecore'
  timeoutMs?: number
}


interface HomeCoreLoginResponse {
  token: string
  expiresAt: string
}

interface HomeCoreContainerDto {
  id: string
  name: string
  image: string
  state: string   
  status: string  
  created: string
}

interface HomeCoreContainerStatsDto {
  containerId: string
  containerName: string
  cpuPercent: number
  memoryUsageBytes: number
  memoryLimitBytes: number
  memoryPercent: number
}

interface HomeCoreServiceStatusDto {
  name: string
  isHealthy: boolean
  detail?: string
}

interface HomeCoreSystemMetricsDto {
  cpuPercent: number
  memoryUsedBytes: number
  memoryTotalBytes: number
  memoryPercent: number
  diskUsedBytes: number
  diskTotalBytes: number
  diskPercent: number
}


export class HomeCoreAdapter implements DataSourceAdapter {
  readonly kind = 'homecore' as const
  readonly displayName = 'HomeCore API'

  private readonly baseUrl: string
  private readonly timeoutMs: number

  private token: string | null = null
  private tokenExpiresAt: number | null = null

  constructor(config: HomeCoreAdapterConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.timeoutMs = config.timeoutMs ?? 5000
  }

  async login(username: string, password: string): Promise<void> {
    const res = await this.rawRequest('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    if (res.status === 401) {
      throw new DataSourceError('Usuario o contraseña inválidos.')
    }
    if (!res.ok) {
      throw new DataSourceError(`HomeCore API respondió ${res.status} al hacer login.`)
    }

    const data = (await res.json()) as HomeCoreLoginResponse
    this.token = data.token
    this.tokenExpiresAt = new Date(data.expiresAt).getTime()
  }

  get isAuthenticated(): boolean {
    return this.token !== null && (this.tokenExpiresAt ?? 0) > Date.now()
  }

  async fetchSnapshot(): Promise<HomelabSnapshot> {
    this.assertAuthenticated()

    const containerDtos = await this.request<HomeCoreContainerDto[]>('/api/containers?all=true')

    const running = containerDtos.filter((c) => c.state.toLowerCase() === 'running')

    const statsSettled = await Promise.allSettled(
      running.map((c) => this.request<HomeCoreContainerStatsDto>(`/api/containers/${c.id}/stats`)),
    )
    const statsById = new Map<string, HomeCoreContainerStatsDto>()
    statsSettled.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        statsById.set(running[i].id, result.value)
      }
    })

    const [services, systemMetrics] = await Promise.all([
      this.request<HomeCoreServiceStatusDto[]>('/api/services'),
      this.request<HomeCoreSystemMetricsDto>('/api/system/metrics'),
    ])

    return {
      containers: containerDtos.map((dto) => mapContainer(dto, statsById.get(dto.id))),
      metrics: mapSystemMetrics(systemMetrics),
      services: services.map(mapService),
      fetchedAt: new Date().toISOString(),
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    const start = performance.now()
    try {
      this.assertAuthenticated()
      await this.request('/api/system/metrics')
      return {
        ok: true,
        message: 'Conectado a HomeCore API correctamente.',
        latencyMs: Math.round(performance.now() - start),
      }
    } catch (err) {
      return {
        ok: false,
        message: err instanceof DataSourceError ? err.message : 'No se pudo conectar a HomeCore API.',
      }
    }
  }

  private assertAuthenticated() {
    if (!this.isAuthenticated) {
      throw new DataSourceError('No hay sesión activa contra HomeCore API. Hay que hacer login primero.')
    }
  }

  private async request<T>(path: string): Promise<T> {
    const res = await this.rawRequest(path, {
      headers: { Authorization: `Bearer ${this.token}` },
    })

    if (!res.ok) {
      throw new DataSourceError(`HomeCore API respondió ${res.status} en ${path}`)
    }
    return (await res.json()) as T
  }

  private async rawRequest(path: string, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      return await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller.signal })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new DataSourceError(`HomeCore API no respondió en ${this.timeoutMs}ms (${path})`, err)
      }
      throw new DataSourceError(`No se pudo contactar a HomeCore API en ${path}`, err)
    } finally {
      clearTimeout(timeout)
    }
  }
}


function mapContainer(dto: HomeCoreContainerDto, stats?: HomeCoreContainerStatsDto): ContainerInfo {
  return {
    id: dto.id,
    name: dto.name,
    image: dto.image,
    status: mapContainerStatus(dto.state),
    cpuPercent: stats?.cpuPercent,
    memoryMb: stats ? Math.round(stats.memoryUsageBytes / 1024 / 1024) : undefined,
    startedAt: dto.created,
  }
}

function mapContainerStatus(state: string): ContainerStatus {
  switch (state.toLowerCase()) {
    case 'running':
      return 'running'
    case 'paused':
      return 'paused'
    case 'restarting':
      return 'restarting'
    case 'exited':
    case 'dead':
      return 'stopped'
    default:
      return 'error'
  }
}

function mapSystemMetrics(dto: HomeCoreSystemMetricsDto): SystemMetric[] {
  return [
    { id: 'cpu', label: 'CPU', value: dto.cpuPercent, unit: 'percent', max: 100 },
    { id: 'memory', label: 'Memoria', value: dto.memoryPercent, unit: 'percent', max: 100 },
    { id: 'disk', label: 'Disco', value: dto.diskPercent, unit: 'percent', max: 100 },
  ]
}

function mapService(dto: HomeCoreServiceStatusDto): ServiceStatus {
  return {
    id: dto.name,
    name: dto.name,
    health: dto.isHealthy ? 'healthy' : 'down',
    detail: dto.detail,
  }
}