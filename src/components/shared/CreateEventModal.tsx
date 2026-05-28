import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { eventsApi, eventTypesApi } from '@/services/api'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'

interface Props { onClose: () => void }

type DurationUnit = 'hours' | 'days' | 'weeks' | 'months'
type ScheduleMode = 'fixed' | 'flexible' | 'self_paced'
type DailyTimeRange = { start: string; end: string }

function getApiErrorMessage(error: any) {
  const detail = error?.response?.data?.detail

  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    const parsed = detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (!item || typeof item !== 'object') return ''
        const loc = Array.isArray(item.loc) ? item.loc.join('.') : ''
        const msg = typeof item.msg === 'string' ? item.msg : ''
        return [loc, msg].filter(Boolean).join(': ')
      })
      .filter(Boolean)

    if (parsed.length > 0) {
      return parsed.join(' | ')
    }
  }

  if (detail && typeof detail === 'object') {
    return JSON.stringify(detail)
  }

  return error?.message || 'Error al crear evento'
}

function calculateEndDate(startDate: Date, value: number, unit: DurationUnit) {
  const date = new Date(startDate)
  switch (unit) {
    case 'hours':
      date.setHours(date.getHours() + value)
      break
    case 'days':
      date.setDate(date.getDate() + value)
      break
    case 'weeks':
      date.setDate(date.getDate() + value * 7)
      break
    case 'months':
      date.setMonth(date.getMonth() + value)
      break
  }
  return date
}

function toIsoDateTime(date: string, time?: string) {
  if (!time) return new Date(date).toISOString()
  return new Date(`${date}T${time}`).toISOString()
}

function formatFixedScheduleText(startDate: string, endDate: string, startTime: string, endTime: string) {
  const startDateLabel = startDate || 'sin fecha inicio'
  const endDateLabel = endDate || 'sin fecha fin'
  const startTimeLabel = startTime || '--:--'
  const endTimeLabel = endTime || '--:--'
  return `Horario fijo: ${startDateLabel} ${startTimeLabel} - ${endDateLabel} ${endTimeLabel}`
}

function getDateRange(startDate: string, endDate: string) {
  if (!startDate) return []

  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${(endDate || startDate)}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []

  const normalizedStart = start <= end ? start : end
  const normalizedEnd = start <= end ? end : start

  const dates: string[] = []
  const cursor = new Date(normalizedStart)
  while (cursor <= normalizedEnd) {
    dates.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

function buildFixedScheduleNotes(
  dates: string[],
  dailyTimeRanges: Record<string, DailyTimeRange>,
  fallbackStart: string,
  fallbackEnd: string
) {
  if (dates.length <= 1) {
    return formatFixedScheduleText(dates[0] || '', dates[0] || '', fallbackStart, fallbackEnd)
  }

  const lines = dates.map((date) => {
    const dayRange = dailyTimeRanges[date]
    const start = dayRange?.start || fallbackStart || '--:--'
    const end = dayRange?.end || fallbackEnd || '--:--'
    return `${date}: ${start} - ${end}`
  })

  return `Horario fijo por dia:\n${lines.join('\n')}`
}

export default function CreateEventModal({ onClose }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', description: '', event_type: '',
    start_date: '', end_date: '', venue: '', capacity: 1, retention_years: 5,
    has_fixed_time: false,
    start_time: '', end_time: '',
    daily_time_ranges: {} as Record<string, DailyTimeRange>,
    duration_value: 0, duration_unit: 'hours' as DurationUnit,
    schedule_mode: 'fixed' as ScheduleMode,
    schedule_notes: '',
  })
  const OTHER_EVENT_TYPE_VALUE = '__other__'
  const [newEventType, setNewEventType] = useState('')

  const { data: eventTypesData, isLoading: isLoadingEventTypes } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const { data } = await eventTypesApi.list()
      return data
    },
  })

  const eventTypes: string[] = Array.isArray(eventTypesData)
    ? eventTypesData
        .map((item: any) => item?.name || item?.type || item?.value || '')
        .filter((value: string) => !!value)
    : []

  const selectedDates = useMemo(() => getDateRange(form.start_date, form.end_date || form.start_date), [form.start_date, form.end_date])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({
      ...f,
      [field]: e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.type === 'number'
          ? Number(e.target.value)
          : e.target.value,
    }))

  const onToggleFixedTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked
    setForm((prev) => ({
      ...prev,
      has_fixed_time: checked,
      schedule_mode: checked ? 'fixed' : prev.schedule_mode === 'fixed' ? 'flexible' : prev.schedule_mode,
      daily_time_ranges: checked ? prev.daily_time_ranges : {},
    }))
  }

  const updateFixedScheduleFromField = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      }

      if (prev.has_fixed_time) {
        next.schedule_notes = next.schedule_notes
      }

      return next
    })
  }

  const updateDailyTime = (date: string, part: 'start' | 'end', value: string) => {
    setForm((prev) => ({
      ...prev,
      daily_time_ranges: {
        ...prev.daily_time_ranges,
        [date]: {
          start: prev.daily_time_ranges[date]?.start || prev.start_time || '',
          end: prev.daily_time_ranges[date]?.end || prev.end_time || '',
          [part]: value,
        },
      },
    }))
  }

  useEffect(() => {
    if (!form.has_fixed_time) return

    const fixedNotes = buildFixedScheduleNotes(
      selectedDates,
      form.daily_time_ranges,
      form.start_time,
      form.end_time
    )

    setForm((prev) => {
      if (prev.schedule_notes === fixedNotes) return prev
      return { ...prev, schedule_notes: fixedNotes }
    })
  }, [form.has_fixed_time, form.start_time, form.end_time, form.daily_time_ranges, selectedDates])

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.start_date) {
        throw new Error('La fecha de inicio es obligatoria.')
      }

      if (!form.event_type.trim()) {
        throw new Error('Selecciona o crea un tipo de evento.')
      }

      if (form.capacity < 1) {
        throw new Error('El cupo debe ser mayor a 0.')
      }

      let finalEventType = form.event_type
      if (form.event_type === OTHER_EVENT_TYPE_VALUE) {
        const cleanedType = newEventType.trim()
        if (!cleanedType) {
          throw new Error('Escribe el nuevo tipo de evento.')
        }

        await eventTypesApi.create({ name: cleanedType })
        await qc.invalidateQueries({ queryKey: ['event-types'] })
        finalEventType = cleanedType
      }

      const firstDate = selectedDates[0] || form.start_date
      const lastDate = selectedDates[selectedDates.length - 1] || form.end_date || form.start_date
      const firstDayRange = form.daily_time_ranges[firstDate]
      const lastDayRange = form.daily_time_ranges[lastDate]

      const startDateIso = toIsoDateTime(
        firstDate,
        form.has_fixed_time ? (selectedDates.length > 1 ? firstDayRange?.start || form.start_time : form.start_time) : undefined
      )
      const startDate = new Date(startDateIso)
      let endDateIso = form.end_date
        ? toIsoDateTime(
            lastDate,
            form.has_fixed_time
              ? (selectedDates.length > 1 ? lastDayRange?.end || form.end_time || form.start_time : form.end_time || form.start_time)
              : undefined
          )
        : ''

      if (!endDateIso && form.duration_value > 0) {
        endDateIso = calculateEndDate(startDate, form.duration_value, form.duration_unit).toISOString()
      }

      if (!endDateIso) {
        throw new Error('Define fecha fin o una duracion estimada.')
      }

      if (new Date(endDateIso).getTime() < new Date(startDateIso).getTime()) {
        throw new Error('La fecha/hora fin no puede ser menor que la de inicio.')
      }

      // Keep payload compatible with current FastAPI schema.
      const payload = {
        title: form.title,
        description:
          form.schedule_mode !== 'fixed' || form.schedule_notes.trim()
            ? `${form.description}\n\n[modalidad_horario:${form.schedule_mode}]${form.schedule_notes.trim() ? `\n[horarios:${form.schedule_notes.trim()}]` : ''}`
            : form.description,
        event_type: finalEventType,
        start_date: startDateIso,
        end_date: endDateIso,
        venue: form.venue,
        capacity: form.capacity,
        retention_years: form.retention_years,
      }

      return eventsApi.create(payload)
    },
    onSuccess: () => {
      toast.success('Evento creado')
      setNewEventType('')
      onClose()
    },
    onError: (err: any) => toast.error(getApiErrorMessage(err)),
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-serif text-lg font-bold text-primary-700">Nuevo evento</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X size={18} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate() }} className="p-5 space-y-4">
          <div>
            <label className="label">Título</label>
            <input className="input" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={set('description')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tipo</label>
              <select
                className="input"
                value={form.event_type}
                onChange={(e) => {
                  set('event_type')(e)
                  if (e.target.value !== OTHER_EVENT_TYPE_VALUE) {
                    setNewEventType('')
                  }
                }}
                required
              >
                <option value="">Selecciona un tipo</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                <option value={OTHER_EVENT_TYPE_VALUE}>Otro</option>
              </select>
              {isLoadingEventTypes && <p className="mt-1 text-xs text-slate-500">Cargando tipos...</p>}
            </div>
            <div>
              <label className="label">Cupo</label>
              <input type="number" className="input" value={form.capacity} onChange={set('capacity')} min={0} />
            </div>
          </div>

          {form.event_type === OTHER_EVENT_TYPE_VALUE && (
            <div>
              <label className="label">Nuevo tipo de evento</label>
              <input
                className="input"
                value={newEventType}
                onChange={(e) => setNewEventType(e.target.value)}
                placeholder="Ej. masterclass, bootcamp, curso asincrono"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Se guardará automáticamente al crear el evento.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Inicio (fecha)</label>
              <input type="date" className="input" value={form.start_date} onChange={updateFixedScheduleFromField('start_date')} required />
            </div>
            <div>
              <label className="label">Fin (fecha)</label>
              <input type="date" className="input" value={form.end_date} onChange={updateFixedScheduleFromField('end_date')} />
            </div>
          </div>

          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.has_fixed_time} onChange={onToggleFixedTime} />
            Definir horario fijo del evento
          </label>

          {form.has_fixed_time && (
            <>
              {selectedDates.length <= 1 ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Hora inicio</label>
                    <input type="time" className="input" value={form.start_time} onChange={updateFixedScheduleFromField('start_time')} />
                  </div>
                  <div>
                    <label className="label">Hora fin</label>
                    <input type="time" className="input" value={form.end_time} onChange={updateFixedScheduleFromField('end_time')} />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-3 text-sm font-medium text-slate-700">Horarios fijos por dia</p>
                  <div className="space-y-2">
                    {selectedDates.map((date) => {
                      const dayRange = form.daily_time_ranges[date]
                      return (
                        <div key={date} className="grid grid-cols-1 gap-2 rounded-lg bg-slate-50 p-2 md:grid-cols-3 md:items-center">
                          <span className="text-sm font-medium text-slate-700">{date}</span>
                          <input
                            type="time"
                            className="input"
                            value={dayRange?.start || ''}
                            onChange={(e) => updateDailyTime(date, 'start', e.target.value)}
                            placeholder="Inicio"
                          />
                          <input
                            type="time"
                            className="input"
                            value={dayRange?.end || ''}
                            onChange={(e) => updateDailyTime(date, 'end', e.target.value)}
                            placeholder="Fin"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Duracion estimada</label>
              <input
                type="number"
                className="input"
                value={form.duration_value}
                onChange={set('duration_value')}
                min={0}
                placeholder="Ej. 12"
              />
            </div>
            <div>
              <label className="label">Unidad</label>
              <select className="input" value={form.duration_unit} onChange={set('duration_unit')}>
                <option value="hours">Horas</option>
                <option value="days">Dias</option>
                <option value="weeks">Semanas</option>
                <option value="months">Meses</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Modalidad de horario</label>
            <select
              className="input"
              value={form.schedule_mode}
              onChange={set('schedule_mode')}
              disabled={form.has_fixed_time}
            >
              {form.has_fixed_time ? (
                <option value="fixed">Horario fijo</option>
              ) : (
                <>
                  <option value="flexible">Horario flexible</option>
                  <option value="self_paced">Autogestionado (tipo Udemy)</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="label">Horarios / Sesiones (libre)</label>
            <textarea
              className="input min-h-[80px]"
              value={form.schedule_notes}
              onChange={set('schedule_notes')}
              placeholder="Ej. Sesion 1: Lun y Mie 18:00-20:00 | Sesion 2: Sab 10:00-13:00"
            />
          </div>
          <div>
            <label className="label">Sede / Lugar</label>
            <input className="input" value={form.venue} onChange={set('venue')} placeholder="Nombre del lugar o enlace" />
          </div>
          <div>
            <label className="label">Retención de documentos (años)</label>
            <input type="number" className="input" value={form.retention_years} onChange={set('retention_years')} min={1} max={10} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary">
              {mutation.isPending ? 'Creando...' : 'Crear evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}