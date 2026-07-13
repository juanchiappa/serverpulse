export type ContainerStatus = 'running' | 'paused' | 'restarting' | 'stopped' | 'error'

export interface ContainerInfo {
  id: string
  name: string
  image: string
  status: ContainerStatus
  cpuPercent?: number
  memoryMb?: number
  startedAt?: string
}

export type MetricUnit = 'percent' | 'mb' | 'gb' | 'count'

export interface SystemMetric {
  id: string
  label: string
  value: number
  unit: MetricUnit
  max?: number
}

export type ServiceHealth = 'healthy' | 'down' | 'unknown'

export interface ServiceStatus {
  id: string
  name: string
  health: ServiceHealth
  detail?: string
}

export interface HomelabSnapshot {
  containers: ContainerInfo[]
  metrics: SystemMetric[]
  services: ServiceStatus[]
  fetchedAt: string
}

export class DataSourceError extends Error {
  readonly cause?: unknown

  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'DataSourceError'
    this.cause = cause
  }
}