import type { DataSourceConfig } from '@/adapters/DataSourceAdapter'

const STORAGE_KEY = 'serverpulse:datasource-config'

/** Config persistible: SIN password ni token. Solo lo necesario para
 *  reconstruir el formulario la próxima vez que se abra la app. */
export type PersistedDataSourceConfig = Pick<DataSourceConfig, 'kind' | 'baseUrl' | 'username'>

export function loadDataSourceConfig(): PersistedDataSourceConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedDataSourceConfig
  } catch {
    // Si el JSON está corrupto o localStorage no está disponible, seguimos sin config guardada.
    return null
  }
}

export function saveDataSourceConfig(config: PersistedDataSourceConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  } catch {
    // localStorage puede fallar (modo incógnito con storage bloqueado, cuota llena, etc.)
    // No es crítico: la app sigue funcionando, solo no persiste la preferencia.
  }
}

export function clearDataSourceConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Idem: no crítico si falla.
  }
}