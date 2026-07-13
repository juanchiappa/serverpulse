import type { ContainerInfo, ContainerStatus } from '@/types'

interface ContainerCardProps {
  container: ContainerInfo
}

const STATUS_COLOR: Record<ContainerStatus, string> = {
  running: 'bg-status-running',
  paused: 'bg-status-warning',
  restarting: 'bg-status-warning',
  stopped: 'bg-status-error',
  error: 'bg-status-error',
}

const STATUS_LABEL: Record<ContainerStatus, string> = {
  running: 'Corriendo',
  paused: 'Pausado',
  restarting: 'Reiniciando',
  stopped: 'Detenido',
  error: 'Error',
}

export function ContainerCard({ container }: ContainerCardProps) {
  const { name, image, status, cpuPercent, memoryMb } = container

  return (
    <div className="rounded-lg border border-base-700 bg-base-900 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-100 truncate">{name}</h3>
        <span className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <span className={`h-2 w-2 rounded-full ${STATUS_COLOR[status]}`} />
          {STATUS_LABEL[status]}
        </span>
      </div>

      <p className="text-xs text-slate-500 truncate font-mono">{image}</p>

      {status === 'running' && (
        <div className="flex flex-col gap-2 pt-1">
          <CpuBar percent={cpuPercent} />
          <RamLabel megabytes={memoryMb} />
        </div>
      )}
    </div>
  )
}

function CpuBar({ percent }: { percent?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-8 shrink-0">CPU</span>
      <div className="flex-1 h-1.5 rounded-full bg-base-700 overflow-hidden">
        <div
          className="h-full bg-accent"
          style={{ width: `${Math.min(percent ?? 0, 100)}%` }}
        />
      </div>
      <span className="text-slate-400 w-10 text-right">
        {percent !== undefined ? `${percent.toFixed(0)}%` : '—'}
      </span>
    </div>
  )
}

function RamLabel({ megabytes }: { megabytes?: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-500 w-8 shrink-0">RAM</span>
      <span className="text-slate-400">{megabytes !== undefined ? `${megabytes} MB` : '—'}</span>
    </div>
  )
}