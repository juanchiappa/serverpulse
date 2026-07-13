import type { DataSourceAdapter, DataSourceConfig } from '@/adapters/DataSourceAdapter'
import { HomeCoreAdapter, type HomeCoreAdapterConfig } from '@/adapters/HomeCoreAdapter'
import { DataSourceError } from '@/types'

export function createDataSource(config: DataSourceConfig): DataSourceAdapter {
  switch (config.kind) {
    case 'homecore':
      return new HomeCoreAdapter(config as HomeCoreAdapterConfig)
    case 'prometheus':
      throw new DataSourceError('PrometheusAdapter todavía no está implementado (Fase 3).')
    case 'docker-socket':
      throw new DataSourceError('DockerSocketAdapter todavía no está implementado (Fase 3).')
    default:
      throw new DataSourceError(`Data source desconocido: ${(config as DataSourceConfig).kind}`)
  }
}