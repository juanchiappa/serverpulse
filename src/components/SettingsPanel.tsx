import { useState } from 'react'
import { useDataSourceStore } from '@/store/dataSourceStore'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const adapter = useDataSourceStore((s) => s.adapter)
  const disconnect = useDataSourceStore((s) => s.disconnect)
  const [confirming, setConfirming] = useState(false)

  function handleChangeSource() {
    disconnect() 
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-end z-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs h-full bg-base-900 border-l border-base-700 p-5 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-100">Configuración</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <span className="text-slate-500">Fuente de datos activa</span>
          <span className="text-slate-200 font-medium">{adapter?.displayName ?? '—'}</span>
        </div>

        <hr className="border-base-700" />

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="text-sm text-left text-slate-300 hover:text-slate-100 transition-colors"
          >
            Cambiar fuente de datos
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-400">
              Esto va a cerrar la sesión actual y volver a la pantalla de conexión. ¿Confirmás?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleChangeSource}
                className="flex-1 rounded-md bg-status-error/20 text-status-error hover:bg-status-error/30 transition-colors py-1.5 text-xs font-semibold"
              >
                Sí, cambiar
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-md bg-base-800 text-slate-300 hover:bg-base-700 transition-colors py-1.5 text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}