import { useDataSourceStore } from '@/store/dataSourceStore'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

function App() {
  const isAuthenticated = useDataSourceStore((s) => s.isAuthenticated)

  return isAuthenticated ? <Dashboard /> : <Login />
}

export default App