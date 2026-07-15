import type { DataSourceAdapter, ConnectionTestResult } from '@/adapters/DataSourceAdapter'
import type { HomelabSnapshot, ContainerInfo, ServiceStatus } from '@/types'

export class MockAdapter implements DataSourceAdapter {
  readonly kind = 'homecore' as const // reusa el tipo por comodidad, no aparece en la UI real
  readonly displayName = 'Mock (datos de prueba)'

  async login(_username: string, _password: string): Promise<void> {
    await delay(300)
  }

  async fetchSnapshot(): Promise<HomelabSnapshot> {
    await delay(200)
    return {
      containers: MOCK_CONTAINERS.map(withJitter),
      metrics: [
        { id: 'cpu', label: 'CPU', value: randomAround(35, 15), unit: 'percent', max: 100 },
        { id: 'memory', label: 'Memoria', value: randomAround(60, 10), unit: 'percent', max: 100 },
        { id: 'disk', label: 'Disco', value: randomAround(72, 5), unit: 'percent', max: 100 },
      ],
      services: MOCK_SERVICES,
      fetchedAt: new Date().toISOString(),
    }
  }

  async testConnection(): Promise<ConnectionTestResult> {
    await delay(200)
    return { ok: true, message: 'Mock siempre conecta bien.', latencyMs: 5 }
  }
}

// --- Datos base -----------------------------------------------------------

const MOCK_CONTAINERS: ContainerInfo[] = [
  { id: '1', name: 'jellyfin', image: 'jellyfin/jellyfin:latest', status: 'running', cpuPercent: 12, memoryMb: 340 },
  { id: '2', name: 'qbittorrent', image: 'linuxserver/qbittorrent', status: 'running', cpuPercent: 8, memoryMb: 180 },
  { id: '3', name: 'casaos', image: 'casaos/casaos', status: 'running', cpuPercent: 4, memoryMb: 95 },
  { id: '4', name: 'tailscale', image: 'tailscale/tailscale', status: 'running', cpuPercent: 1, memoryMb: 40 },
  { id: '5', name: 'old-backup-job', image: 'debian:bookworm', status: 'stopped' },
]

const MOCK_SERVICES: ServiceStatus[] = [
  { id: 'jellyfin-http', name: 'Jellyfin (HTTP)', health: 'healthy' },
  { id: 'qbittorrent-http', name: 'qBittorrent (HTTP)', health: 'healthy' },
]

// --- Helpers de simulación -------------------------------------------------

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function randomAround(base: number, spread: number): number {
  return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * spread))
}

function withJitter(container: ContainerInfo): ContainerInfo {
  if (container.status !== 'running') return container
  return {
    ...container,
    cpuPercent: randomAround(container.cpuPercent ?? 10, 8),
    memoryMb: container.memoryMb ? Math.round(container.memoryMb + (Math.random() - 0.5) * 20) : undefined,
  }
}