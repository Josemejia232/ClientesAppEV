import type { Client } from '../types'

export function exportToCSV(clients: Client[]): void {
  const headers = [
    'ID', 'Identificación', 'Tipo ID', 'Nombre', 'Nombre Comercial',
    'Contacto', 'Dirección', 'Ciudad', 'Departamento', 'País',
    'Teléfono 1', 'Teléfono 2', 'Email', 'Contacto Facturación',
    'Email Facturación', 'Año Apertura', 'Tipo Persona', 'Estado',
    'Vendedor', 'Categoría', 'Cupo Crédito', 'Observaciones',
    'Fecha Registro', 'Último Contacto', 'Próximo Contacto'
  ]

  const rows = clients.map(c => [
    c.id, c.identificacion, c.tipo_identificacion, c.nombre, c.nombre_comercial,
    c.nombre_contacto, c.direccion, c.ciudad, c.departamento, c.pais,
    c.telefono1, c.telefono2, c.email, c.contacto_facturacion,
    c.email_facturacion, c.anio_apertura, c.tipo_persona, c.estado,
    c.vendedor, c.categoria, c.cupo_credito, c.observaciones,
    c.fecha_registro, c.ultimo_contacto, c.proximo_contacto
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => {
      const str = String(cell ?? '')
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str
    }).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  })
}
