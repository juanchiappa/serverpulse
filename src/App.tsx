function App() {
  return (
    <div className="min-h-screen bg-base-950 text-slate-200">
      <header className="border-b border-base-700 px-6 py-4 flex items-center gap-3">
        <span className="h-2.5 w-2.5 rounded-full bg-status-running" />
        <h1 className="font-bold tracking-wide text-slate-100">
          Server<span className="text-accent-glow">Pulse</span>
        </h1>
      </header>

      <main className="px-6 py-10 max-w-3xl mx-auto text-center">
        <p className="text-slate-400 text-sm">
          Template default de Vite limpio. Listo para empezar a construir el dashboard.
        </p>
      </main>
    </div>
  )
}

export default App