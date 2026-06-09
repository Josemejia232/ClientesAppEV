import type { Client, ClientsResponse, DashboardStats, Nota, ClientFormData, Programacion } from '../types'

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Error en la solicitud')
  }
  return res.json()
}

export async function fetchClients(params: {
  search?: string
  estado?: string
  categoria?: string
  vendedor?: string
  ciudad?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: string
}): Promise<ClientsResponse> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  return request(`/clients?${searchParams.toString()}`)
}

export async function fetchClient(id: number): Promise<Client> {
  return request(`/clients/${id}`)
}

export async function createClient(data: ClientFormData): Promise<Client> {
  return request('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateClient(id: number, data: Partial<ClientFormData>): Promise<Client> {
  return request(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteClient(id: number): Promise<void> {
  return request(`/clients/${id}`, { method: 'DELETE' })
}

export async function fetchStats(): Promise<DashboardStats> {
  return request('/clients/stats')
}

export async function fetchVendedores(): Promise<string[]> {
  return request('/clients/vendedores')
}

export async function fetchCategorias(): Promise<string[]> {
  return request('/clients/categorias')
}

export async function fetchNotas(clientId: number): Promise<Nota[]> {
  return request(`/notes/client/${clientId}`)
}

export async function createNota(data: { client_id: number; contenido: string; tipo: string; created_by: string }): Promise<Nota> {
  return request('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteNota(id: number): Promise<void> {
  return request(`/notes/${id}`, { method: 'DELETE' })
}

export async function fetchProgramaciones(params: {
  estado?: string
  tipo?: string
  prioridad?: string
  client_id?: number
  desde?: string
  hasta?: string
  page?: number
  limit?: number
}): Promise<{ data: Programacion[]; pagination: any }> {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.set(key, String(value))
    }
  })
  return request(`/programaciones?${searchParams.toString()}`)
}

export async function fetchProximasProgramaciones(): Promise<Programacion[]> {
  return request('/programaciones/proximas')
}

export async function createProgramacion(data: {
  client_id: number
  titulo: string
  descripcion?: string
  tipo?: string
  fecha_programada: string
  hora_programada?: string
  duracion_estimada?: number
  prioridad?: string
  created_by?: string
}): Promise<Programacion> {
  return request('/programaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateProgramacion(id: number, data: Partial<{
  titulo: string
  descripcion: string
  tipo: string
  fecha_programada: string
  hora_programada: string
  duracion_estimada: number
  estado: string
  prioridad: string
}>): Promise<Programacion> {
  return request(`/programaciones/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteProgramacion(id: number): Promise<void> {
  return request(`/programaciones/${id}`, { method: 'DELETE' })
}
