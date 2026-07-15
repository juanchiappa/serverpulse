// Queries de PromQL usadas por PrometheusAdapter.
// Asumen node_exporter (métricas de host) y cAdvisor (métricas por
// contenedor) — son las convenciones más comunes en setups de homelab,
// pero si tu instalación usa otros nombres de métrica, este es el único
// archivo que hay que tocar.

export const QUERIES = {
  hostCpuPercent: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)',

  hostMemoryPercent:
    '(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100',

  hostDiskPercent:
    '(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100',

  containerCpuPercent:
    'sum by (name) (rate(container_cpu_usage_seconds_total{name!=""}[1m])) * 100',

  containerMemoryBytes: 'container_memory_usage_bytes{name!=""}',

  targetsUp: 'up',
} as const