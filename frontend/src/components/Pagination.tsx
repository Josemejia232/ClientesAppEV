interface Props {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, total, onPageChange }: Props) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages: number[] = []
    const start = Math.max(1, page - 2)
    const end = Math.min(totalPages, page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-gray-600">
        Mostrando página {page} de {totalPages} ({total} registros)
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-100"
        >
          Anterior
        </button>
        {getPages().map(p => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 rounded border text-sm ${
              p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-100"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
