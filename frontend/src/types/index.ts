export interface Client {
  id: number
  identificacion: string
  tipo_identificacion: string
  nombre: string
  nombre_comercial: string
  nombre_contacto: string
  direccion: string
  ciudad: string
  departamento: string
  pais: string
  telefono1: string
  telefono2: string
  email: string
  contacto_facturacion: string
  email_facturacion: string
  anio_apertura: number | null
  tipo_persona: string
  estado: string
  vendedor: string
  categoria: string
  cupo_credito: number
  observaciones: string
  fecha_registro: string
  ultimo_contacto: string | null
  proximo_contacto: string | null
  created_at: string
  updated_at: string
}

export interface Nota {
  id: number
  client_id: number
  contenido: string
  tipo: string
  fecha: string
  created_by: string
  created_at: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ClientsResponse {
  data: Client[]
  pagination: Pagination
}

export interface Programacion {
  id: number
  client_id: number
  titulo: string
  descripcion: string
  tipo: string
  fecha_programada: string
  hora_programada: string
  duracion_estimada: number
  estado: string
  prioridad: string
  created_by: string
  created_at: string
  updated_at: string
  cliente_nombre?: string
  cliente_identificacion?: string
  cliente_telefono?: string
  nombre_contacto?: string
}

export interface DashboardStats {
  totalClientes: number
  activos: number
  inactivos: number
  categorias: { categoria: string; count: number }[]
  ciudades: { ciudad: string; count: number }[]
  vendedores: { vendedor: string; count: number }[]
  aperturaPorAnio: { anio_apertura: number; count: number }[]
  clientesAtrasados: { id: number; nombre: string; identificacion: string; proximo_contacto: string | null; ultimo_contacto: string | null; dias_atraso: number }[]
  proximosContactos: { id: number; nombre: string; proximo_contacto: string }[]
}

export interface ClientFormData {
  identificacion: string
  tipo_identificacion: string
  nombre: string
  nombre_comercial: string
  nombre_contacto: string
  direccion: string
  ciudad: string
  departamento: string
  pais: string
  telefono1: string
  telefono2: string
  email: string
  contacto_facturacion: string
  email_facturacion: string
  anio_apertura: number | null
  tipo_persona: string
  estado: string
  vendedor: string
  categoria: string
  cupo_credito: number
  observaciones: string
  fecha_registro: string
  ultimo_contacto: string | null
  proximo_contacto: string | null
}
