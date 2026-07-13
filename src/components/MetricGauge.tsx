import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import type { SystemMetric } from '@/types'

interface MetricGaugeProps {
  metric: SystemMetric
}

function colorFor(percent: number): string {
  if (percent >= 90) return '#ff4d4f' // status-error
  if (percent >= 70) return '#f5c518' // status-warning
  return '#22e584' // status-running
}

export function MetricGauge({ metric }: MetricGaugeProps) {
  const max = metric.max ?? 100
  const percent = Math.min((metric.value / max) * 100, 100)
  const color = colorFor(percent)

  const data = [{ name: metric.label, value: percent, fill: color }]

  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-base-700 bg-base-900 p-4">
      <div className="relative h-28 w-28">
        <RadialBarChart
          width={112}
          height={112}
          cx="50%"
          cy="50%"
          innerRadius="70%"
          outerRadius="100%"
          barSize={10}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" background={{ fill: '#232323' }} cornerRadius={5} />
        </RadialBarChart>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-100">{percent.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-xs text-slate-400">{metric.label}</span>
    </div>
  )
}