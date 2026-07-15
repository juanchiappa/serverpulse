import { useState } from 'react'
import { useDataSourceStore } from '@/store/dataSourceStore'
import { usePolling } from '@/hooks/usePolling'
import { ContainerCard } from '@/components/ContainerCard'
import { MetricGauge } from '@/components/MetricGauge'
import { SettingsPanel } from '@/components/SettingsPanel'

export function Dashboard() {
  const snapshot = useDataSourceStore((s) => s.snapshot)
  const isLoading = useDataSourceStore((s) => s.isLoading)
  const error = useDataSourceStore((s) => s.error)
  const refreshSnapshot = useDataSourceStore((s) => s.refreshSnapshot)

  const [settingsOpen, setSettingsOpen] = useState(false)

  usePolling(refreshSnapshot, 10_000)

  return (
    <div className="min-h-screen bg-base-950">
      <header className="border-b border-base-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`h-2.5 w-2.5 rounded-full ${isLoading ? 'bg-status-warning' : 'bg-status-running'}`}
          />
          <h1 className="font-bold tracking-wide text-slate-100">
            Server<span className="text-accent-glow">Pulse</span>
          </h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
          aria-label="Configuración"
          title="Configuración"
        >
          ⚙
        </button>
      </header>

      <main className="px-6 py-8 max-w-6xl mx-auto flex flex-col gap-8">
        {error && (
          <p className="text-sm text-status-error bg-base-900 border border-status-error/30 rounded-md px-4 py-2">
            {error}
          </p>
        )}

        {snapshot ? (
          <>
            <section className="flex flex-wrap gap-4">
              {snapshot.metrics.map((metric) => (
                <MetricGauge key={metric.id} metric={metric} />
              ))}
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {snapshot.containers.map((container) => (
                <ContainerCard key={container.id} container={container} />
              ))}
            </section>
          </>
        ) : (
          <p className="text-sm text-slate-500 text-center py-12">
            {isLoading ? 'Cargando datos...' : 'Esperando el primer snapshot...'}
          </p>
        )}
      </main>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}