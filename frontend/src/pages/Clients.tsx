import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import { fetchClients, deleteClient } from '../api/client'
import { exportToCSV } from '../utils/export'
import type { Client } from '../types'

const PAGE_SIZE = 20

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('')
  const [categoria, setCategoria] = useState('')
  const [selectedClients, setSelectedClients] = useState<Set<number>>(new Set())
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const searchRef = useRef(search)
  const estadoRef = useRef(estado)
  const categoriaRef = useRef(categoria)
  searchRef.current = search
  estadoRef.current = estado
  categoriaRef.current = categoria

  useEffect(() => {
    setClients([])
    setPage(1)
    setHasMore(true)
    setSelectedClients(new Set())
    setInitialLoading(true)
    fetchClients({ search, page: 1, limit: PAGE_SIZE, estado, categoria, sortBy: 'created_at', sortOrder: 'desc' })
      .then(res => {
        setClients(res.data)
        setHasMore(res.pagination.page < res.pagination.totalPages)
      })
      .catch(console.error)
      .finally(() => setInitialLoading(false))
  }, [search, estado, categoria])

  useEffect(() => {
    if (page <= 1) return
    setLoadingMore(true)
    fetchClients({
      search: searchRef.current,
      page,
      limit: PAGE_SIZE,
      estado: estadoRef.current,
      categoria: categoriaRef.current,
      sortBy: 'created_at',
      sortOrder: 'desc'
    })
      .then(res => {
        setClients(prev => [...prev, ...res.data])
        setHasMore(res.pagination.page < res.pagination.totalPages)
      })
      .catch(console.error)
      .finally(() => setLoadingMore(false))
  }, [page])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !initialLoading) {
        setPage(prev => prev + 1)
      }
    }, { rootMargin: '200px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, initialLoading])

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return
    try {
      await deleteClient(id)
      setClients(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleExport = () => {
    const data = selectedClients.size > 0
      ? clients.filter(c => selectedClients.has(c.id))
      : clients
    exportToCSV(data)
  }

  const toggleSelect = (id: number) => {
    setSelectedClients(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedClients.size === clients.length) {
      setSelectedClients(new Set())
    } else {
      setSelectedClients(new Set(clients.map(c => c.id)))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            Exportar {selectedClients.size > 0 ? `(${selectedClients.size})` : ''}
          </button>
          <Link to="/clientes/nuevo" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            + Nuevo Cliente
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar onSearch={setSearch} placeholder="Buscar por nombre, ID, teléfono, email..." />
        </div>
        <select value={estado} onChange={e => setEstado(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <select value={categoria} onChange={e => setCategoria(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">Todas las categorías</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input type="checkbox" checked={clients.length > 0 && selectedClients.size === clients.length} onChange={selectAll} className="rounded" />
                </th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">ID</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Nombre</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Identificación</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Teléfono</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 hidden lg:table-cell">Ciudad</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Estado</th>
                <th className="px-3 py-3 text-left font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <input type="checkbox" checked={selectedClients.has(client.id)} onChange={() => toggleSelect(client.id)} className="rounded" />
                  </td>
                  <td className="px-3 py-3 text-gray-500">{client.id}</td>
                  <td className="px-3 py-3">
                    <Link to={`/clientes/${client.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      {client.nombre}
                    </Link>
                    {client.nombre_comercial && (
                      <p className="text-xs text-gray-400">{client.nombre_comercial}</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600 hidden md:table-cell">{client.identificacion}</td>
                  <td className="px-3 py-3 text-gray-600 hidden lg:table-cell">{client.telefono1 || '—'}</td>
                  <td className="px-3 py-3 text-gray-600 hidden lg:table-cell">{client.ciudad || '—'}</td>
                  <td className="px-3 py-3 hidden sm:table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      client.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {client.estado}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <Link to={`/clientes/${client.id}`} className="text-blue-600 hover:text-blue-800" title="Ver detalle">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </Link>
                      <Link to={`/clientes/${client.id}/editar`} className="text-yellow-600 hover:text-yellow-800" title="Editar">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button onClick={() => handleDelete(client.id)} className="text-red-600 hover:text-red-800" title="Eliminar">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {initialLoading && (
          <div className="flex items-center justify-center py-12 text-gray-500 gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Cargando clientes...
          </div>
        )}

        {!initialLoading && clients.length === 0 && (
          <div className="text-center py-12 text-gray-400">No se encontraron clientes</div>
        )}

        {!initialLoading && clients.length > 0 && (
          <div ref={sentinelRef} className="flex items-center justify-center py-6">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cargando más...
              </div>
            )}
            {!hasMore && (
              <p className="text-sm text-gray-400">Todos los clientes cargados ({clients.length} en total)</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
