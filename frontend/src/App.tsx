import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import NewClient from './pages/NewClient'
import EditClient from './pages/EditClient'
import Cronograma from './pages/Cronograma'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/cronograma" element={<Cronograma />} />
        <Route path="/clientes" element={<Clients />} />
        <Route path="/clientes/nuevo" element={<NewClient />} />
        <Route path="/clientes/:id" element={<ClientDetail />} />
        <Route path="/clientes/:id/editar" element={<EditClient />} />
      </Route>
    </Routes>
  )
}
