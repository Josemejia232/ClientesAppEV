import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts'
import { fetchStats, fetchProximasProgramaciones } from '../api/client'
import { formatDate } from '../utils/export'
import type { DashboardStats, Programacion } from '../types'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
const TIPO_EMOJI: Record<string, string> = { Llamada: '📞', Visita: '🏢', Email: '📧', Reunión: '🤝', Otro: '📌' }
const TIPO_COLOR: Record<string, string> = { Llamada: '#3B82F6', Visita: '#10B981', Email: '#8B5CF6', Reunión: '#F59E0B', Otro: '#6B7280' }

function Gantt({ items }: { items: Programacion[] }) {
  const today = new Date()
  const days: string[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    days.push(d.toISOString().slice(0, 10))
  }

  const dayLabel = (d: string) => {
    const dt = new Date(d + 'T12:00:00')
    return dt.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' })
  }

  const isToday = (d: string) => d === today.toISOString().slice(0, 10)

  const itemsByDate: Record<string, Programacion[]> = {}
  for (const item of items) {
    const d = item.fecha_programada
    if (!itemsByDate[d]) itemsByDate[d] = []
    itemsByDate[d].push(item)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="flex border-b border-gray-200">
          <div className="w-48 shrink-0 px-2 py-2 text-xs font-medium text-gray-500">Actividad</div>
          {days.map(d => (
            <div key={d} className={`flex-1 text-center px-1 py-2 text-xs font-medium border-l border-gray-100 ${isToday(d) ? 'bg-blue-50 text-blue-700' : 'text-gray-500'}`}>
              {dayLabel(d)}
            </div>
          ))}
        </div>
        <div className="divide-y divide-gray-100">
          {items.length === 0 && (
            <div className="text-sm text-gray-400 py-8 text-center">No hay actividades programadas</div>
          )}
          {items.map(item => {
            const startIdx = days.indexOf(item.fecha_programada)
            if (startIdx === -1) return null
            return (
              <div key={item.id} className="flex items-center hover:bg-gray-50 min-h-[44px]">
                <div className="w-48 shrink-0 px-2 py-1.5 text-sm truncate border-r border-gray-100">
                  <span className="mr-1">{TIPO_EMOJI[item.tipo] || '📌'}</span>
                  <span className="text-gray-800 font-medium">{item.titulo}</span>
                  <div className="text-xs text-gray-400 truncate">{item.cliente_nombre}</div>
                </div>
                <div className="flex-1 flex relative" style={{ minHeight: 44 }}>
                  {days.map((d, i) => (
                    <div key={d} className={`flex-1 border-l border-gray-50 ${isToday(d) ? 'bg-blue-50/40' : ''}`}>
                      {i === startIdx && (
                        <div
                          className="mx-0.5 my-1 px-1.5 py-1 rounded text-xs text-white truncate leading-tight"
                          style={{ backgroundColor: TIPO_COLOR[item.tipo] || '#6B7280' }}
                          title={`${item.titulo} - ${item.cliente_nombre} - ${item.hora_programada?.slice(0, 5)}hs`}
                        >
                          {item.hora_programada?.slice(0, 5)} {item.titulo}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [proximas, setProximas] = useState<Programacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchProximasProgramaciones(),
    ])
      .then(([s, p]) => {
        setStats(s)
        setProximas(p)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-gray-500">Cargando estadísticas...</div>
  if (!stats) return <div className="text-center py-12 text-red-500">Error al cargar estadísticas</div>

  const pieData = [
    { name: 'Activos', value: stats.activos },
    { name: 'Inactivos', value: stats.inactivos },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Total Clientes</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalClientes}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-3xl font-bold text-green-600">{stats.activos}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500">Inactivos</p>
          <p className="text-3xl font-bold text-red-600">{stats.inactivos}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Clientes por Estado</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Apertura por Año</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.aperturaPorAnio}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="anio_apertura" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fontSize: '12px', fill: '#374151', fontWeight: 500 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 overflow-hidden">
        <h2 className="font-semibold text-gray-800 mb-4">Cronograma — Próximos 14 días</h2>
        <Gantt items={proximas} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Clientes por Ciudad</h2>
          <div className="space-y-2">
            {stats.ciudades.map((c, i) => (
              <div key={c.ciudad} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-24 truncate">{c.ciudad}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(c.count / stats.totalClientes) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-10 text-right">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Clientes por Vendedor</h2>
          <div className="space-y-2">
            {stats.vendedores.map((v, i) => (
              <div key={v.vendedor} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-32 truncate">{v.vendedor}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div className="bg-green-500 h-3 rounded-full" style={{ width: `${(v.count / stats.totalClientes) * 100}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-700 w-10 text-right">{v.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Clientes con seguimiento atrasado</h2>
          <div className="divide-y">
            {stats.clientesAtrasados.map(c => (
              <Link key={c.id} to={`/clientes/${c.id}`} className="flex items-center justify-between py-2 hover:bg-gray-50 px-2 rounded">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                  <p className="text-xs text-gray-500">{c.identificacion}</p>
                </div>
                <span className="text-xs font-medium text-red-600">
                  {Math.round(c.dias_atraso)} días de retraso
                </span>
              </Link>
            ))}
            {stats.clientesAtrasados.length === 0 && (
              <p className="text-sm text-gray-400 py-2">Todos los clientes están al día ✓</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Próximas Actividades</h2>
            <Link to="/cronograma" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {proximas.map(p => (
              <Link key={p.id} to={`/cronograma`} className="flex items-center gap-2 py-2 hover:bg-gray-50 px-2 rounded">
                <span>{TIPO_EMOJI[p.tipo] || '📌'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.titulo}</p>
                  <p className="text-xs text-gray-400 truncate">{p.cliente_nombre}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-blue-600">{formatDate(p.fecha_programada)}</p>
                  <p className="text-xs text-gray-400">{p.hora_programada?.slice(0, 5)}hs</p>
                </div>
              </Link>
            ))}
            {proximas.length === 0 && (
              <p className="text-sm text-gray-400 py-2">No hay actividades programadas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
