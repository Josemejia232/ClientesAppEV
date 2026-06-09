import { useNavigate } from 'react-router-dom'
import ClientForm from '../components/ClientForm'
import { createClient } from '../api/client'
import type { ClientFormData } from '../types'

export default function NewClient() {
  const navigate = useNavigate()

  const handleSave = async (data: ClientFormData) => {
    const client = await createClient(data)
    navigate(`/clientes/${client.id}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Nuevo Cliente</h1>
      <ClientForm onSave={handleSave} onCancel={() => navigate('/clientes')} />
    </div>
  )
}
