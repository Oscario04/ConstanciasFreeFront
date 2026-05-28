import { Search } from 'lucide-react'
import { useMemo, useState } from 'react'

export interface DataTableColumn<T> {
  key: string
  title: string
  render: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  rowKey: (row: T) => string
  searchableBy?: (row: T) => string
  pageSize?: number
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchableBy,
  pageSize = 10,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim() || !searchableBy) return data
    const lower = search.trim().toLowerCase()
    return data.filter((item) => searchableBy(item).toLowerCase().includes(lower))
  }, [data, search, searchableBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const currentData = filtered.slice(start, start + pageSize)

  return (
    <div className="card overflow-hidden p-0">
      {searchableBy && (
        <div className="border-b border-slate-200 p-4">
          <label className="relative block">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Buscar..."
            />
          </label>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((col) => (
                <th className="px-4 py-3 text-left font-medium" key={col.key}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentData.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-slate-400" colSpan={columns.length}>
                  No se encontraron resultados.
                </td>
              </tr>
            )}
            {currentData.map((row) => (
              <tr className="hover:bg-slate-50" key={rowKey(row)}>
                {columns.map((col) => (
                  <td className="px-4 py-3" key={col.key}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>
          Mostrando {currentData.length} de {filtered.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary px-2 py-1 text-xs"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Anterior
          </button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <button
            className="btn-secondary px-2 py-1 text-xs"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
