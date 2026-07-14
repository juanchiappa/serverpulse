import { create } from 'zustand'
import { createDataSource } from '@/adapters/createDataSource'
import type { DataSourceAdapter, DataSourceConfig } from '@/adapters/DataSourceAdapter'
import { DataSourceError, type HomelabSnapshot } from '@/types'

interface DataSourceState {
  adapter: DataSourceAdapter | null
  isAuthenticated: boolean
  snapshot: HomelabSnapshot | null
  isLoading: boolean
  error: string | null

  connect: (config: DataSourceConfig) => void
  connectAdapter: (adapter: DataSourceAdapter) => void
  login: (username: string, password: string) => Promise<void>
  refreshSnapshot: () => Promise<void>
  disconnect: () => void
}

export const useDataSourceStore = create<DataSourceState>((set, get) => ({
  adapter: null,
  isAuthenticated: false,
  snapshot: null,
  isLoading: false,
  error: null,

  connect: (config) => {
    const adapter = createDataSource(config)
    set({ adapter, isAuthenticated: false, snapshot: null, error: null })
  },
   connectAdapter: (adapter) => {
    set({ adapter, isAuthenticated: false, snapshot: null, error: null })
  },

  login: async (username, password) => {
    const { adapter } = get()
    if (!adapter) {
      set({ error: 'No hay ninguna fuente de datos configurada todavía.' })
      return
    }
    if (!('login' in adapter) || typeof adapter.login !== 'function') {
      set({ isAuthenticated: true }) // no requiere login, lo damos por autenticado
      return
    }

    set({ isLoading: true, error: null })
    try {
      await (adapter as unknown as { login: (u: string, p: string) => Promise<void> }).login(
        username,
        password,
      )
      set({ isAuthenticated: true, isLoading: false })
    } catch (err) {
      const message = err instanceof DataSourceError ? err.message : 'No se pudo iniciar sesión.'
      set({ isAuthenticated: false, isLoading: false, error: message })
    }
  },

  refreshSnapshot: async () => {
    const { adapter, isAuthenticated } = get()
    if (!adapter || !isAuthenticated) return

    set({ isLoading: true })
    try {
      const snapshot = await adapter.fetchSnapshot()
      set({ snapshot, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof DataSourceError ? err.message : 'Error al traer datos.'
      set({ isLoading: false, error: message })
    }
  },

  disconnect: () => {
    get().adapter?.dispose?.()
    set({ adapter: null, isAuthenticated: false, snapshot: null, error: null })
  },
}))