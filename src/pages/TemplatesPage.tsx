import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import ModulePageShell from '@/pages/modules/ModulePageShell'
import { templatesApi } from '@/services/api'
import EmptyState from '@/components/shared/EmptyState'
import { ArrowDown, ArrowUp, Eye, LayoutTemplate, Pencil, Plus, Star, Trash2 } from 'lucide-react'

type TemplateDocType = 'constancia' | 'reconocimiento' | 'diploma'
type TemplateBlockType = 'text' | 'spacer' | 'qr'

interface TemplateRecord {
  id: string
  name: string
  document_type: TemplateDocType
  schema_version: string
  content_json: Record<string, unknown>
  is_active: boolean
  updated_at?: string
}

interface TemplateStyle {
  font?: string
  size?: number
  color?: string
  align?: 'left' | 'center' | 'right'
}

interface TemplateBlock {
  type: TemplateBlockType
  style?: string
  value?: string | number
  width?: number
  height?: number
}

interface TemplateContent {
  page: {
    size: string
    margins: { top: number; right: number; bottom: number; left: number }
    background: { type: string; color: string }
  }
  styles: Record<string, TemplateStyle>
  blocks: TemplateBlock[]
}

const DEFAULT_TEMPLATE_CONTENT: TemplateContent = {
  page: {
    size: 'A4_LANDSCAPE',
    margins: { top: 42, right: 42, bottom: 42, left: 42 },
    background: { type: 'solid', color: '#F5F0E8' },
  },
  styles: {
    title: { font: 'Times-Bold', size: 36, color: '#C9A84C', align: 'center' },
    subtitle: { font: 'Times-Italic', size: 14, color: '#1E3A5F', align: 'center' },
    body: { font: 'Times-Roman', size: 13, color: '#1E3A5F', align: 'center' },
    name: { font: 'Times-Bold', size: 28, color: '#1E3A5F', align: 'center' },
    small: { font: 'Helvetica', size: 9, color: '#666666', align: 'center' },
  },
  blocks: [
    { type: 'text', style: 'subtitle', value: '{{institution_upper}}' },
    { type: 'text', style: 'title', value: '{{doc_type_label}}' },
    { type: 'spacer', value: 12 },
    { type: 'text', style: 'body', value: 'Se otorga el presente a:' },
    { type: 'text', style: 'name', value: '{{recipient_name}}' },
    { type: 'text', style: 'body', value: 'por su distinguida participacion como {{role_label}} en:' },
    { type: 'text', style: 'name', value: '{{event_title}}' },
    { type: 'text', style: 'body', value: 'celebrado el {{event_date}}' },
    { type: 'qr', value: '{{verification_url}}', width: 72, height: 72 },
    { type: 'text', style: 'small', value: 'Verificar en: {{verification_url}}' },
  ],
}

interface EditorState {
  open: boolean
  templateId?: string
  name: string
  document_type: TemplateDocType
  schema_version: string
  is_active: boolean
  content_json: TemplateContent
}

const defaultEditorState: EditorState = {
  open: false,
  name: '',
  document_type: 'constancia',
  schema_version: '1.0',
  is_active: true,
  content_json: DEFAULT_TEMPLATE_CONTENT,
}

function normalizeTemplateContent(raw: any): TemplateContent {
  if (!raw || typeof raw !== 'object') return DEFAULT_TEMPLATE_CONTENT

  return {
    page: {
      size: raw.page?.size || DEFAULT_TEMPLATE_CONTENT.page.size,
      margins: {
        top: raw.page?.margins?.top ?? DEFAULT_TEMPLATE_CONTENT.page.margins.top,
        right: raw.page?.margins?.right ?? DEFAULT_TEMPLATE_CONTENT.page.margins.right,
        bottom: raw.page?.margins?.bottom ?? DEFAULT_TEMPLATE_CONTENT.page.margins.bottom,
        left: raw.page?.margins?.left ?? DEFAULT_TEMPLATE_CONTENT.page.margins.left,
      },
      background: {
        type: raw.page?.background?.type || 'solid',
        color: raw.page?.background?.color || DEFAULT_TEMPLATE_CONTENT.page.background.color,
      },
    },
    styles: raw.styles && typeof raw.styles === 'object' ? raw.styles : DEFAULT_TEMPLATE_CONTENT.styles,
    blocks: Array.isArray(raw.blocks) && raw.blocks.length > 0 ? raw.blocks : DEFAULT_TEMPLATE_CONTENT.blocks,
  }
}

export default function TemplatesPage() {
  const qc = useQueryClient()
  const [editor, setEditor] = useState<EditorState>(defaultEditorState)
  const [showPreview, setShowPreview] = useState(true)

  const { data, isLoading } = useQuery<TemplateRecord[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await templatesApi.list()
      return Array.isArray(data) ? data : []
    },
  })

  const templates = data || []

  const createMutation = useMutation({
    mutationFn: (payload: object) => templatesApi.create(payload),
    onSuccess: async () => {
      toast.success('Plantilla creada')
      setEditor(defaultEditorState)
      await qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || err.message || 'Error al crear plantilla'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: object }) => templatesApi.update(id, payload),
    onSuccess: async () => {
      toast.success('Plantilla actualizada')
      setEditor(defaultEditorState)
      await qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || err.message || 'Error al actualizar plantilla'),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => templatesApi.activate(id),
    onSuccess: async () => {
      toast.success('Plantilla activada')
      await qc.invalidateQueries({ queryKey: ['templates'] })
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || err.message || 'Error al activar plantilla'),
  })

  const kpis = useMemo(
    () => [
      { label: 'Total plantillas', value: templates.length },
      { label: 'Activas', value: templates.filter((t) => t.is_active).length },
      { label: 'Constancias', value: templates.filter((t) => t.document_type === 'constancia').length },
      { label: 'Reconocimientos', value: templates.filter((t) => t.document_type === 'reconocimiento').length },
    ],
    [templates]
  )

  const openCreate = () => {
    setEditor({ ...defaultEditorState, open: true })
  }

  const openEdit = (template: TemplateRecord) => {
    setEditor({
      open: true,
      templateId: template.id,
      name: template.name,
      document_type: template.document_type,
      schema_version: template.schema_version || '1.0',
      is_active: template.is_active,
      content_json: normalizeTemplateContent(template.content_json),
    })
  }

  const updateBlock = (index: number, patch: Partial<TemplateBlock>) => {
    setEditor((prev) => {
      const blocks = [...prev.content_json.blocks]
      blocks[index] = { ...blocks[index], ...patch }
      return { ...prev, content_json: { ...prev.content_json, blocks } }
    })
  }

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    setEditor((prev) => {
      const blocks = [...prev.content_json.blocks]
      const target = direction === 'up' ? index - 1 : index + 1
      if (target < 0 || target >= blocks.length) return prev
      const temp = blocks[index]
      blocks[index] = blocks[target]
      blocks[target] = temp
      return { ...prev, content_json: { ...prev.content_json, blocks } }
    })
  }

  const removeBlock = (index: number) => {
    setEditor((prev) => {
      const blocks = prev.content_json.blocks.filter((_, idx) => idx !== index)
      return { ...prev, content_json: { ...prev.content_json, blocks } }
    })
  }

  const addBlock = (type: TemplateBlockType) => {
    const newBlock: TemplateBlock =
      type === 'text'
        ? { type: 'text', style: 'body', value: 'Nuevo texto' }
        : type === 'spacer'
          ? { type: 'spacer', value: 12 }
          : { type: 'qr', value: '{{verification_url}}', width: 72, height: 72 }

    setEditor((prev) => ({
      ...prev,
      content_json: {
        ...prev.content_json,
        blocks: [...prev.content_json.blocks, newBlock],
      },
    }))
  }

  const onSaveTemplate = () => {
    if (!editor.name.trim()) {
      toast.error('El nombre de la plantilla es obligatorio')
      return
    }

    const payload = {
      name: editor.name.trim(),
      document_type: editor.document_type,
      schema_version: editor.schema_version || '1.0',
      content_json: editor.content_json,
      is_active: editor.is_active,
    }

    if (editor.templateId) {
      updateMutation.mutate({ id: editor.templateId, payload })
      return
    }

    createMutation.mutate(payload)
  }

  return (
    <ModulePageShell
      title="Plantillas Visuales"
      subtitle="Gestion de disenos institucionales para constancias, reconocimientos y diplomas."
      kpis={kpis}
      quickActions={[
        {
          label: 'Nueva plantilla',
          description: 'Crear una plantilla base con editor visual por bloques.',
          onClick: openCreate,
        },
      ]}
    >
      <div className="card mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Plantillas registradas</h3>
          <p className="text-sm text-slate-500">Edita bloques visuales y activa la plantilla vigente por tipo de documento.</p>
        </div>
        <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
          <Plus size={16} />
          Agregar nueva plantilla
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Cargando plantillas...</p>}

      {!isLoading && templates.length === 0 && (
        <EmptyState
          icon={LayoutTemplate}
          title="Sin plantillas"
          description="No hay plantillas disponibles en base de datos para mostrar en esta vista."
          action={
            <button type="button" className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
              <Plus size={16} />
              Crear primera plantilla
            </button>
          }
        />
      )}

      {templates.length > 0 && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Version</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {templates.map((tpl) => (
                  <tr key={tpl.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{tpl.name}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{tpl.document_type}</td>
                    <td className="px-4 py-3 text-slate-600">{tpl.schema_version || '1.0'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tpl.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {tpl.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs" onClick={() => openEdit(tpl)}>
                          <Pencil size={13} /> Editar
                        </button>
                        {!tpl.is_active && (
                          <button
                            type="button"
                            className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                            onClick={() => activateMutation.mutate(tpl.id)}
                            disabled={activateMutation.isPending}
                          >
                            <Star size={13} /> Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editor.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h3 className="font-serif text-lg font-bold text-primary-700">
                {editor.templateId ? 'Editar plantilla' : 'Nueva plantilla'}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs"
                >
                  <Eye size={13} /> {showPreview ? 'Ocultar preview' : 'Mostrar preview'}
                </button>
                <button type="button" onClick={() => setEditor(defaultEditorState)} className="rounded p-1 hover:bg-slate-100">
                  Cerrar
                </button>
              </div>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Nombre</label>
                    <input
                      className="input"
                      value={editor.name}
                      onChange={(e) => setEditor((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Plantilla base constancia"
                    />
                  </div>
                  <div>
                    <label className="label">Tipo de documento</label>
                    <select
                      className="input"
                      value={editor.document_type}
                      onChange={(e) => setEditor((prev) => ({ ...prev, document_type: e.target.value as TemplateDocType }))}
                    >
                      <option value="constancia">Constancia</option>
                      <option value="reconocimiento">Reconocimiento</option>
                      <option value="diploma">Diploma</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">Version de esquema</label>
                    <input
                      className="input"
                      value={editor.schema_version}
                      onChange={(e) => setEditor((prev) => ({ ...prev, schema_version: e.target.value }))}
                      placeholder="1.0"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={editor.is_active}
                        onChange={(e) => setEditor((prev) => ({ ...prev, is_active: e.target.checked }))}
                      />
                      Marcar como activa
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-700">Bloques visuales</h4>
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => addBlock('text')}>+ Texto</button>
                      <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => addBlock('spacer')}>+ Espacio</button>
                      <button type="button" className="btn-secondary px-2 py-1 text-xs" onClick={() => addBlock('qr')}>+ QR</button>
                    </div>
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {editor.content_json.blocks.map((block, index) => (
                      <div key={`${block.type}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                            Bloque {index + 1} - {block.type}
                          </span>
                          <div className="flex gap-1">
                            <button type="button" className="btn-secondary px-1.5 py-1 text-xs" onClick={() => moveBlock(index, 'up')}>
                              <ArrowUp size={12} />
                            </button>
                            <button type="button" className="btn-secondary px-1.5 py-1 text-xs" onClick={() => moveBlock(index, 'down')}>
                              <ArrowDown size={12} />
                            </button>
                            <button type="button" className="btn-secondary px-1.5 py-1 text-xs text-rose-600" onClick={() => removeBlock(index)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2">
                          <div>
                            <label className="label">Tipo</label>
                            <select
                              className="input"
                              value={block.type}
                              onChange={(e) => updateBlock(index, { type: e.target.value as TemplateBlockType })}
                            >
                              <option value="text">Texto</option>
                              <option value="spacer">Espacio</option>
                              <option value="qr">QR</option>
                            </select>
                          </div>

                          {block.type === 'text' && (
                            <div>
                              <label className="label">Estilo</label>
                              <select
                                className="input"
                                value={block.style || 'body'}
                                onChange={(e) => updateBlock(index, { style: e.target.value })}
                              >
                                {Object.keys(editor.content_json.styles).map((styleName) => (
                                  <option key={styleName} value={styleName}>{styleName}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {block.type === 'spacer' && (
                            <div>
                              <label className="label">Altura</label>
                              <input
                                type="number"
                                className="input"
                                value={Number(block.value || 12)}
                                min={0}
                                onChange={(e) => updateBlock(index, { value: Number(e.target.value) })}
                              />
                            </div>
                          )}

                          {block.type === 'qr' && (
                            <>
                              <div>
                                <label className="label">Ancho</label>
                                <input
                                  type="number"
                                  className="input"
                                  value={Number(block.width || 72)}
                                  min={24}
                                  onChange={(e) => updateBlock(index, { width: Number(e.target.value) })}
                                />
                              </div>
                              <div>
                                <label className="label">Alto</label>
                                <input
                                  type="number"
                                  className="input"
                                  value={Number(block.height || 72)}
                                  min={24}
                                  onChange={(e) => updateBlock(index, { height: Number(e.target.value) })}
                                />
                              </div>
                            </>
                          )}

                          <div className="md:col-span-2">
                            <label className="label">Contenido</label>
                            <input
                              className="input"
                              value={String(block.value || '')}
                              onChange={(e) => updateBlock(index, { value: e.target.value })}
                              placeholder={block.type === 'qr' ? '{{verification_url}}' : 'Texto del bloque'}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {showPreview && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 text-sm font-semibold text-slate-700">Vista previa</h4>
                  <div className="min-h-[540px] rounded-xl bg-white p-6" style={{ backgroundColor: editor.content_json.page.background.color }}>
                    {editor.content_json.blocks.map((block, index) => {
                      if (block.type === 'spacer') {
                        return <div key={`preview-${index}`} style={{ height: Number(block.value || 12) }} />
                      }

                      if (block.type === 'qr') {
                        return (
                          <div key={`preview-${index}`} className="my-2 flex justify-center">
                            <div
                              className="flex items-center justify-center rounded border border-dashed border-slate-400 text-[10px] text-slate-500"
                              style={{ width: Number(block.width || 72), height: Number(block.height || 72) }}
                            >
                              QR
                            </div>
                          </div>
                        )
                      }

                      const style = editor.content_json.styles[block.style || 'body'] || {}
                      const alignClass =
                        style.align === 'left'
                          ? 'text-left'
                          : style.align === 'right'
                            ? 'text-right'
                            : 'text-center'

                      return (
                        <p
                          key={`preview-${index}`}
                          className={`my-1 ${alignClass}`}
                          style={{
                            color: style.color || '#1E3A5F',
                            fontSize: style.size ? `${style.size}px` : '13px',
                            fontFamily: style.font?.includes('Times') ? 'serif' : 'sans-serif',
                            fontWeight: style.font?.includes('Bold') ? 700 : 400,
                            fontStyle: style.font?.includes('Italic') ? 'italic' : 'normal',
                          }}
                        >
                          {String(block.value || '')}
                        </p>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button type="button" className="btn-secondary" onClick={() => setEditor(defaultEditorState)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={onSaveTemplate}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModulePageShell>
  )
}
