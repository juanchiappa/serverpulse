import type { HomelabSnapshot } from '@/types'

export type DataSourceKind = 'homecore' | 'prometheus' | 'docker-socket'

export interface DataSourceConfig {
  kind: DataSourceKind
  baseUrl: string
  apiKey?: string
  username?: string
  password?: string
}

export interface DataSourceAdapter {
  readonly kind: DataSourceKind
  readonly displayName: string
  fetchSnapshot(): Promise<HomelabSnapshot>
  testConnection(): Promise<ConnectionTestResult>
  dispose?(): void
}

export interface ConnectionTestResult {
  ok: boolean
  message: string
  latencyMs?: number
}

export type DataSourceFactory = (config: DataSourceConfig) => DataSourceAdapter