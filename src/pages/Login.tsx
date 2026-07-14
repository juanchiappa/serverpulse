import { useState, type FormEvent } from 'react'
import { useDataSourceStore } from '@/store/dataSourceStore'
import { MockAdapter } from '@/adapters/MockAdapter'

export function Login() {
  const [baseUrl, setBaseUrl] = useState('http://localhost:5000')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const connect = useDataSourceStore((s) => s.connect)
  const connectAdapter = useDataSourceStore((s) => s.connectAdapter)
  const login = useDataSourceStore((s) => s.login)
  const isLoading = useDataSourceStore((s) => s.isLoading)
  const error = useDataSourceStore((s) => s.error)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    connect({ kind: 'homecore', baseUrl })
    await login(username, password)
  }

  async function handleMockLogin() {
    connectAdapter(new MockAdapter())
    await login('mock', 'mock')
  }

  return (
    <div className="min-h-screen bg-base-950 flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-base-700 bg-base-900 p-6 flex flex-col gap-4"
      >
        <h1 className="font-bold text-lg text-slate-100 text-center">
          Server<span className="text-accent-glow">Pulse</span>
        </h1>

        <Field label="URL de HomeCore API" value={baseUrl} onChange={setBaseUrl} />
        <Field label="Usuario" value={username} onChange={setUsername} />
        <Field label="Contraseña" value={password} onChange={setPassword} type="password" />

        {error && <p className="text-xs text-status-error">{error}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-accent hover:bg-accent-dim transition-colors py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isLoading ? 'Conectando...' : 'Conectar'}
        </button>

        <button
          type="button"
          onClick={handleMockLogin}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
        >
          Usar datos de prueba (sin backend real)
        </button>
      </form>
    </div>
  )
}

interface FieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}

function Field({ label, value, onChange, type = 'text' }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md bg-base-800 border border-base-700 px-3 py-2 text-sm text-slate-100 outline-none focus:border-accent"
      />
    </label>
  )
}