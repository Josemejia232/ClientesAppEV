import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchClient, fetchNotas, createNota, deleteNota, deleteClient, fetchProgramaciones, createProgramacion } from '../api/client'
import { formatCurrency, formatDate } from '../utils/export'
import type { Client, Nota, Programacion } from '../types'

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [notas, setNotas] = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [programaciones, setProgramaciones] = useState<Programacion[]>([])
  const [showProgForm, setShowProgForm] = useState(false)
  const [progTitulo, setProgTitulo] = useState('')
  const [progFecha, setProgFecha] = useState('')
  const [progHora, setProgHora] = useState('09:00')
  const [progTipo, setProgTipo] = useState('Llamada')
  const [newNota, setNewNota] = useState('')
  const [newTipo, setNewTipo] = useState('Otro')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    const clientId = parseInt(id)
    Promise.all([
      fetchClient(clientId),
      fetchNotas(clientId),
      fetchProgramaciones({ client_id: clientId, limit: 10 }),
    ])
      .then(([c, n, p]) => {
        setClient(c)
        setNotas(n)
        setProgramaciones(p.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleAddNota = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNota.trim() || !client) return
    setSaving(true)
    try {
      const nota = await createNota({ client_id: client.id, contenido: newNota, tipo: newTipo, created_by: 'Usuario' })
      setNotas(prev => [nota, ...prev])
      setNewNota('')
      setNewTipo('Otro')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteNota = async (notaId: number) => {
    if (!confirm('¿Eliminar esta nota?')) return
    try {
      await deleteNota(notaId)
      setNotas(prev => prev.filter(n => n.id !== notaId))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteClient = async () => {
    if (!client || !confirm('¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.')) return
    try {
      await deleteClient(client.id)
      navigate('/clientes')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando cliente...</div>
  if (!client) return <div className="text-center py-12 text-red-500">Cliente no encontrado</div>

  const DetailRow = ({ label, value }: { label: string; value: string | number | null }) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-800 col-span-2">{value ?? '—'}</span>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/clientes" className="text-blue-600 hover:text-blue-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{client.nombre}</h1>
            <p className="text-sm text-gray-500">{client.identificacion}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/clientes/${client.id}/editar`} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600">
            Editar
          </Link>
          <button onClick={handleDeleteClient} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Información General</h2>
          <DetailRow label="Tipo ID" value={client.tipo_identificacion} />
          <DetailRow label="Nombre Comercial" value={client.nombre_comercial} />
          <DetailRow label="Contacto" value={client.nombre_contacto} />
          <DetailRow label="Tipo Persona" value={client.tipo_persona} />
          <DetailRow label="Estado" value={client.estado} />
          <DetailRow label="Categoría" value={client.categoria} />
          <DetailRow label="Vendedor" value={client.vendedor} />
          <DetailRow label="Año Apertura" value={client.anio_apertura} />
          <DetailRow label="Cupo Crédito" value={client.cupo_credito ? formatCurrency(client.cupo_credito) : '—'} />
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Contacto y Dirección</h2>
          <DetailRow label="Dirección" value={client.direccion} />
          <DetailRow label="Ciudad" value={client.ciudad} />
          <DetailRow label="Departamento" value={client.departamento} />
          <DetailRow label="País" value={client.pais} />
          <DetailRow label="Teléfono 1" value={client.telefono1} />
          <DetailRow label="Teléfono 2" value={client.telefono2} />
          <DetailRow label="Email" value={client.email} />
          <DetailRow label="Contacto Fact." value={client.contacto_facturacion} />
          <DetailRow label="Email Fact." value={client.email_facturacion} />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Fechas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Fecha Registro</p>
            <p className="text-sm font-medium">{formatDate(client.fecha_registro)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Último Contacto</p>
            <p className="text-sm font-medium">{formatDate(client.ultimo_contacto)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Próximo Contacto</p>
            <p className="text-sm font-medium">{formatDate(client.proximo_contacto)}</p>
          </div>
        </div>
      </div>

      {client.observaciones && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-2">Observaciones</h2>
          <p className="text-sm text-gray-700">{client.observaciones}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Actividades Programadas</h2>
          <button onClick={() => setShowProgForm(!showProgForm)} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            {showProgForm ? 'Cancelar' : 'Programar'}
          </button>
        </div>

        {showProgForm && (
          <form onSubmit={async e => {
            e.preventDefault()
            if (!progTitulo || !progFecha) return
            await createProgramacion({
              client_id: client.id,
              titulo: progTitulo,
              tipo: progTipo,
              fecha_programada: progFecha,
              hora_programada: progHora,
            })
            setShowProgForm(false)
            setProgTitulo('')
            setProgFecha('')
            setProgHora('09:00')
            setProgTipo('Llamada')
            const p = await fetchProgramaciones({ client_id: client.id, limit: 10 })
            setProgramaciones(p.data)
          }} className="mb-4 flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
            <input value={progTitulo} onChange={e => setProgTitulo(e.target.value)} placeholder="Título" className="border rounded px-2 py-1.5 text-sm flex-1 min-w-[200px]" required />
            <select value={progTipo} onChange={e => setProgTipo(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
              <option>Llamada</option><option>Visita</option><option>Email</option><option>Reunión</option>
            </select>
            <input value={progFecha} onChange={e => setProgFecha(e.target.value)} type="date" className="border rounded px-2 py-1.5 text-sm" required />
            <input value={progHora} onChange={e => setProgHora(e.target.value)} type="time" className="border rounded px-2 py-1.5 text-sm" />
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Guardar</button>
          </form>
        )}

        {programaciones.length > 0 && (
          <div className="mb-6 space-y-2">
            {programaciones.map(p => {
              const tel = (client.telefono1 || '').replace(/\D/g, '')
              const msg = encodeURIComponent(`Hola ${client.nombre_contacto || client.nombre}, te contacto por: ${p.titulo} (${p.fecha_programada} ${p.hora_programada?.slice(0, 5)}hs).`)
              const waHref = tel ? `https://wa.me/${tel}?text=${msg}` : '#'
              return (
                <div key={p.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    p.estado === 'Pendiente' ? 'bg-blue-100 text-blue-700' :
                    p.estado === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                  }`}>{p.estado}</span>
                  <span className="font-medium text-gray-800">{p.titulo}</span>
                  <span className="text-gray-400">{p.fecha_programada} {p.hora_programada?.slice(0, 5)}hs</span>
                  <div className="ml-auto flex items-center gap-3">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                        tel
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none'
                      }`}
                      title={tel ? `Enviar WhatsApp a ${tel}` : 'Cliente sin teléfono'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.607zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                      </svg>
                      WhatsApp
                    </a>
                    <Link to="/cronograma" className="text-blue-600 hover:underline text-xs">Ver en cronograma</Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <h2 className="font-semibold text-gray-800 mb-4">Seguimiento / Notas</h2>

        <form onSubmit={handleAddNota} className="mb-6 space-y-3">
          <div className="flex gap-2">
            <select value={newTipo} onChange={e => setNewTipo(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>Llamada</option>
              <option>Visita</option>
              <option>Email</option>
              <option>Reunión</option>
              <option>Otro</option>
            </select>
            <input
              type="text"
              value={newNota}
              onChange={e => setNewNota(e.target.value)}
              placeholder="Escribe una nota de seguimiento..."
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button type="submit" disabled={saving || !newNota.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {notas.length === 0 && (
            <p className="text-sm text-gray-400">No hay notas de seguimiento</p>
          )}
          {notas.map(nota => (
            <div key={nota.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                nota.tipo === 'Llamada' ? 'bg-blue-100 text-blue-700' :
                nota.tipo === 'Visita' ? 'bg-green-100 text-green-700' :
                nota.tipo === 'Email' ? 'bg-purple-100 text-purple-700' :
                nota.tipo === 'Reunión' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-200 text-gray-700'
              }`}>
                {nota.tipo}
              </span>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{nota.contenido}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(nota.fecha)} por {nota.created_by}
                </p>
              </div>
              <button onClick={() => handleDeleteNota(nota.id)} className="text-gray-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
