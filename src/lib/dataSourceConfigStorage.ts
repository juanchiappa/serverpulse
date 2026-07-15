import type { DataSourceConfig } from '@/adapters/DataSourceAdapter'

const STORAGE_KEY = 'serverpulse:datasource-config'

export type PersistedDataSourceConfig = Pick<DataSourceConfig, 'kind' | 'baseUrl' | 'username'>

export function loadDataSourceConfig(): PersistedDataSourceConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedDataSourceConfig
  } catch {
    return null
  }
}

export function saveDataSourceConfig(config: PersistedDataSourceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
  }
}

export function clearDataSourceConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
  }
}