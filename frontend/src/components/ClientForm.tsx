import { useState, useEffect } from 'react'
import type { ClientFormData } from '../types'

interface Props {
  initial?: Partial<ClientFormData>
  onSave: (data: ClientFormData) => Promise<void>
  onCancel: () => void
}

const emptyForm: ClientFormData = {
  identificacion: '',
  tipo_identificacion: 'NIT',
  nombre: '',
  nombre_comercial: '',
  nombre_contacto: '',
  direccion: '',
  ciudad: '',
  departamento: '',
  pais: 'Colombia',
  telefono1: '',
  telefono2: '',
  email: '',
  contacto_facturacion: '',
  email_facturacion: '',
  anio_apertura: null,
  tipo_persona: 'Natural',
  estado: 'Activo',
  vendedor: '',
  categoria: '',
  cupo_credito: 0,
  observaciones: '',
  fecha_registro: '',
  ultimo_contacto: null,
  proximo_contacto: null,
}

export default function ClientForm({ initial, onSave, onCancel }: Props) {
  const [form, setForm] = useState<ClientFormData>({ ...emptyForm, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) setForm({ ...emptyForm, ...initial })
  }, [initial])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'cupo_credito' || name === 'anio_apertura'
        ? value === '' ? null : Number(value)
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.identificacion.trim() || !form.nombre.trim()) {
      setError('Identificación y Nombre son obligatorios')
      return
    }

    setSaving(true)
    try {
      await onSave(form)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Identificación *</label>
            <input name="identificacion" value={form.identificacion} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Tipo Identificación</label>
            <select name="tipo_identificacion" value={form.tipo_identificacion} onChange={handleChange} className={inputClass}>
              <option>NIT</option>
              <option>CC</option>
              <option>CE</option>
              <option>Pasaporte</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Nombre Comercial</label>
            <input name="nombre_comercial" value={form.nombre_comercial} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nombre Contacto</label>
            <input name="nombre_contacto" value={form.nombre_contacto} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Tipo Persona</label>
            <select name="tipo_persona" value={form.tipo_persona} onChange={handleChange} className={inputClass}>
              <option>Natural</option>
              <option>Jurídica</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Dirección</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <label className={labelClass}>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>País</label>
            <input name="pais" value={form.pais} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Ciudad</label>
            <input name="ciudad" value={form.ciudad} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Departamento</label>
            <input name="departamento" value={form.departamento} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Contacto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Teléfono 1</label>
            <input name="telefono1" value={form.telefono1} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Teléfono 2</label>
            <input name="telefono2" value={form.telefono2} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Contacto Facturación</label>
            <input name="contacto_facturacion" value={form.contacto_facturacion} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Facturación</label>
            <input name="email_facturacion" type="email" value={form.email_facturacion} onChange={handleChange} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Información Comercial</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange} className={inputClass}>
              <option>Activo</option>
              <option>Inactivo</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Vendedor</label>
            <input name="vendedor" value={form.vendedor} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select name="categoria" value={form.categoria} onChange={handleChange} className={inputClass}>
              <option value="">Seleccionar...</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Cupo Crédito</label>
            <input name="cupo_credito" type="number" value={form.cupo_credito} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Año Apertura</label>
            <input name="anio_apertura" type="number" value={form.anio_apertura ?? ''} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Fecha Registro</label>
            <input name="fecha_registro" type="date" value={form.fecha_registro} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Último Contacto</label>
            <input name="ultimo_contacto" type="date" value={form.ultimo_contacto ?? ''} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Próximo Contacto</label>
            <input name="proximo_contacto" type="date" value={form.proximo_contacto ?? ''} onChange={handleChange} className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>Observaciones</label>
          <textarea name="observaciones" value={form.observaciones} onChange={handleChange} rows={3} className={inputClass} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? 'Guardando...' : initial ? 'Actualizar Cliente' : 'Crear Cliente'}
        </button>
      </div>
    </form>
  )
}
