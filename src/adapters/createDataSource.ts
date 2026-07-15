import type { DataSourceAdapter, DataSourceConfig } from '@/adapters/DataSourceAdapter'
import { HomeCoreAdapter, type HomeCoreAdapterConfig } from '@/adapters/HomeCoreAdapter'
import { PrometheusAdapter, type PrometheusAdapterConfig } from '@/adapters/PrometheusAdapter'
import { DataSourceError } from '@/types'

export function createDataSource(config: DataSourceConfig): DataSourceAdapter {
  switch (config.kind) {
    case 'homecore':
      return new HomeCoreAdapter(config as HomeCoreAdapterConfig)
    case 'prometheus':
      return new PrometheusAdapter(config as PrometheusAdapterConfig)
    case 'docker-socket':
      throw new DataSourceError('DockerSocketAdapter todavía no está implementado (Fase 3).')
    default:
      throw new DataSourceError(`Data source desconocido: ${(config as DataSourceConfig).kind}`)
  }
}