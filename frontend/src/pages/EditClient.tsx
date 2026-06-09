import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ClientForm from '../components/ClientForm'
import { fetchClient, updateClient } from '../api/client'
import type { ClientFormData } from '../types'

export default function EditClient() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [initial, setInitial] = useState<ClientFormData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetchClient(parseInt(id))
      .then(client => {
        setInitial({
          identificacion: client.identificacion,
          tipo_identificacion: client.tipo_identificacion,
          nombre: client.nombre,
          nombre_comercial: client.nombre_comercial,
          nombre_contacto: client.nombre_contacto,
          direccion: client.direccion,
          ciudad: client.ciudad,
          departamento: client.departamento,
          pais: client.pais,
          telefono1: client.telefono1,
          telefono2: client.telefono2,
          email: client.email,
          contacto_facturacion: client.contacto_facturacion,
          email_facturacion: client.email_facturacion,
          anio_apertura: client.anio_apertura,
          tipo_persona: client.tipo_persona,
          estado: client.estado,
          vendedor: client.vendedor,
          categoria: client.categoria,
          cupo_credito: client.cupo_credito,
          observaciones: client.observaciones,
          fecha_registro: client.fecha_registro?.slice(0, 10) || '',
          ultimo_contacto: client.ultimo_contacto?.slice(0, 10) || null,
          proximo_contacto: client.proximo_contacto?.slice(0, 10) || null,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (data: ClientFormData) => {
    if (!id) return
    await updateClient(parseInt(id), data)
    navigate(`/clientes/${id}`)
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando datos del cliente...</div>
  if (!initial) return <div className="text-center py-12 text-red-500">Cliente no encontrado</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Editar Cliente</h1>
      <ClientForm initial={initial} onSave={handleSave} onCancel={() => navigate(`/clientes/${id}`)} />
    </div>
  )
}
