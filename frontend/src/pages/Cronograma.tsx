import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchProgramaciones, updateProgramacion, deleteProgramacion, createProgramacion, fetchClients } from '../api/client'
import type { Programacion, Client } from '../types'

const PRIO_BADGE: Record<string, string> = {
  Alta: 'bg-red-100 text-red-700',
  Media: 'bg-yellow-100 text-yellow-700',
  Baja: 'bg-green-100 text-green-700',
}

const TIPO_ICO: Record<string, string> = {
  Llamada: '📞', Visita: '🏢', Email: '📧', Reunión: '🤝', Otro: '📌',
}

export default function Cronograma() {
  const [items, setItems] = useState<Programacion[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'pendientes' | 'completadas' | 'todas'>('pendientes')
  const [showForm, setShowForm] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    client_id: '', titulo: '', tipo: 'Llamada',
    fecha_programada: '', hora_programada: '09:00',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const estado = tab === 'pendientes' ? 'Pendiente' : tab === 'completadas' ? 'Completada' : undefined
      const res = await fetchProgramaciones({ estado, limit: 100 })
      setItems(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }, [tab])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    fetchClients({ limit: 200 }).then(r => setClients(r.data)).catch(console.error)
  }, [])

  const toggleEstado = async (item: Programacion) => {
    const nuevo = item.estado === 'Completada' ? 'Pendiente' : 'Completada'
    await updateProgramacion(item.id, { estado: nuevo })
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta tarea?')) return
    await deleteProgramacion(id)
    load()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_id || !form.titulo || !form.fecha_programada) return
    await createProgramacion({
      client_id: parseInt(form.client_id), titulo: form.titulo,
      tipo: form.tipo, fecha_programada: form.fecha_programada,
      hora_programada: form.hora_programada,
    })
    setForm({ client_id: '', titulo: '', tipo: 'Llamada', fecha_programada: '', hora_programada: '09:00' })
    setShowForm(false)
    load()
  }

  const pendientes = items.filter(i => i.estado === 'Pendiente')
  const completadas = items.filter(i => i.estado === 'Completada')
  const displayItems = tab === 'pendientes' ? pendientes : tab === 'completadas' ? completadas : items

  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Pendientes</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          {showForm ? 'Cancelar' : '+ Nueva tarea'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-2 items-end">
          <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm min-w-[180px]" required>
            <option value="">Cliente...</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="¿Qué hay que hacer?" className="border rounded-lg px-3 py-2 text-sm min-w-[200px] flex-1" required />
          <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} className="border rounded-lg px-3 py-2 text-sm">
            <option>Llamada</option><option>Visita</option><option>Email</option><option>Reunión</option><option>Otro</option>
          </select>
          <input value={form.fecha_programada} onChange={e => setForm(f => ({ ...f, fecha_programada: e.target.value }))} type="date" className="border rounded-lg px-3 py-2 text-sm" required />
          <input value={form.hora_programada} onChange={e => setForm(f => ({ ...f, hora_programada: e.target.value }))} type="time" className="border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Crear</button>
        </form>
      )}

      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {(['pendientes', 'completadas', 'todas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}>
            {t === 'pendientes' ? `Pendientes (${pendientes.length})` :
             t === 'completadas' ? `Completadas (${completadas.length})` : 'Todas'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Cargando...</div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {tab === 'pendientes' ? 'No hay tareas pendientes 🎉' : 'No hay tareas completadas'}
        </div>
      ) : (
        <div className="space-y-1">
          {displayItems.map(item => {
            const esHoy = item.fecha_programada === todayStr
            const esPasada = item.fecha_programada < todayStr
            return (
              <div key={item.id} className={`flex items-center gap-3 px-4 py-3 bg-white rounded-lg shadow-sm border transition-colors ${
                item.estado === 'Completada' ? 'opacity-60' : ''
              }`}>
                <button onClick={() => toggleEstado(item)} className="shrink-0 w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors ${
                  item.estado === 'Completada' ? 'bg-green-500 border-green-500' : ''
                }">
                  {item.estado === 'Completada' && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="shrink-0 text-lg">{TIPO_ICO[item.tipo] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium text-sm truncate ${item.estado === 'Completada' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {item.titulo}
                    </span>
                    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIO_BADGE[item.prioridad] || 'bg-gray-100'}`}>
                      {item.prioridad}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <Link to={`/clientes/${item.client_id}`} className="text-blue-600 hover:underline truncate">
                      {item.cliente_nombre}
                    </Link>
                    <span>·</span>
                    <span className={esPasada && item.estado === 'Pendiente' ? 'text-red-500 font-medium' : ''}>
                      {esHoy ? 'Hoy' : item.fecha_programada} {item.hora_programada?.slice(0, 5)}hs
                    </span>
                    {esPasada && item.estado === 'Pendiente' && <span className="text-red-500">(atrasada)</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(item.id)} className="shrink-0 text-gray-300 hover:text-red-500 transition-colors" title="Eliminar">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
