import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { offersApi, bookingsApi } from '../services/api'
import { useToast } from '../store/ToastContext'
import type { Offer } from '../types'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const TODAY = new Date().toISOString().split('T')[0]

export default function Schedule() {
  const [searchParams] = useSearchParams()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [offers, setOffers] = useState<Offer[]>([])
  const [search, setSearch] = useState('')
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [form, setForm] = useState({ fecha: '', hora: '14:00', modalidad: 'Virtual', notas: '' })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    offersApi.list().then(r => {
      setOffers(r.offers)
      const preId = Number(searchParams.get('offer'))
      if (preId) {
        const pre = r.offers.find(o => o.id === preId)
        if (pre) setSelectedOffer(pre)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [searchParams])

  const filtered = offers.filter(o =>
    !search ||
    o.materia.toLowerCase().includes(search.toLowerCase()) ||
    (o.tutor?.nombre ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOffer) return
    if (!form.fecha || !form.hora || !form.modalidad) { toast('error', 'Faltan datos', 'Completa fecha, hora y modalidad.'); return }
    console.log('Schedule - Form data being sent:', {
      offer_id: selectedOffer.id,
      fecha: form.fecha,
      hora: form.hora,
      modalidad: form.modalidad,
      notas: form.notas || undefined,
    })
    setSubmitting(true)
    try {
      await bookingsApi.create({
        offer_id: selectedOffer.id,
        fecha: form.fecha,
        hora: form.hora,
        modalidad: form.modalidad as 'Virtual' | 'Presencial',
        notas: form.notas || undefined,
      })
      toast('success', '¡Tutoría agendada!', `${selectedOffer.materia} con ${selectedOffer.tutor?.nombre}`)
      navigate('/my-tutorings')
    } catch (err) {
      toast('error', 'Error', err instanceof Error ? err.message : 'No se pudo agendar.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="spinner-center"><span className="spinner spinner-lg" /></div>

  const availableModalities = selectedOffer?.modalidad === 'Ambas'
    ? ['Virtual', 'Presencial']
    : [selectedOffer?.modalidad ?? 'Virtual']

  return (
    <div className="animate-fadeup">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem' }}>Agendar tutoría</h1>
        <p className="text-muted">Selecciona un tutor del marketplace y define la fecha y modalidad.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedOffer ? '1fr 380px' : '1fr', gap: 24, alignItems: 'start' }}>
        {/* Offer list */}
        <div>
          <div className="search-bar mb-4">
            <input
              id="schedule-search"
              type="search"
              className="form-control"
              placeholder="Buscar por materia o tutor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-title">Sin resultados</div>
              <p className="empty-state-text">Intenta con otro término de búsqueda.</p>
            </div>
          ) : (
            <div className="grid-auto">
              {filtered.map(offer => (
                <article
                  key={offer.id}
                  className="card"
                  style={{
                    cursor: 'pointer',
                    border: selectedOffer?.id === offer.id ? '2px solid var(--color-primary)' : undefined,
                    boxShadow: selectedOffer?.id === offer.id ? 'var(--shadow-glow), var(--shadow-md)' : undefined,
                  }}
                  onClick={() => {
                    setSelectedOffer(offer)
                    if (offer.modalidad !== 'Ambas') setForm(f => ({ ...f, modalidad: offer.modalidad as string }))
                  }}
                >
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <div
                        className="tutor-avatar"
                        style={{ background: `hsl(${(offer.id * 47) % 360},40%,88%)`, color: `hsl(${(offer.id * 47) % 360},60%,35%)` }}
                      >
                        {offer.tutor ? getInitials(offer.tutor.nombre) : '?'}
                      </div>
                      <div>
                        <p className="font-semibold">{offer.tutor?.nombre ?? 'Tutor'}</p>
                        <p className="text-sm text-muted">{offer.tutor?.programa}</p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span className="badge badge-primary">{offer.materia}</span>
                      {offer.nivel && <span className="badge badge-neutral">{offer.nivel}</span>}
                      <span className="badge badge-neutral">{offer.modalidad}</span>
                    </div>

                    {offer.descripcion && (
                      <p className="text-sm" style={{ color: 'var(--color-ink-2)', lineHeight: 1.4, marginBottom: 8 }}>
                        {offer.descripcion.slice(0, 90)}{offer.descripcion.length > 90 ? '…' : ''}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {formatPrice(offer.tarifa)}/h
                      </span>
                      <button
                        className="btn btn-primary btn-sm"
                        id={`schedule-select-${offer.id}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedOffer(offer) }}
                      >
                        {selectedOffer?.id === offer.id ? '✓ Seleccionado' : 'Seleccionar'}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Booking form */}
        {selectedOffer && (
          <div className="card" style={{ position: 'sticky', top: 96 }}>
            <div className="card-header">
              <h3 style={{ fontSize: '1rem' }}>Confirmar reserva</h3>
              <p className="text-sm text-muted">{selectedOffer.materia} con {selectedOffer.tutor?.nombre}</p>
            </div>
            <div className="card-body">
              <form id="booking-form" onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="book-fecha">Fecha</label>
                  <input
                    id="book-fecha"
                    type="date"
                    className="form-control"
                    min={TODAY}
                    value={form.fecha}
                    onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-hora">Hora</label>
                    <input
                      id="book-hora"
                      type="time"
                      className="form-control"
                      value={form.hora}
                      onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="book-modalidad">Modalidad</label>
                    <select
                      id="book-modalidad"
                      className="form-control"
                      value={form.modalidad}
                      onChange={e => setForm(f => ({ ...f, modalidad: e.target.value }))}
                    >
                      {availableModalities.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="book-notas">Notas (opcional)</label>
                  <input
                    id="book-notas"
                    type="text"
                    className="form-control"
                    placeholder="Temas a reforzar, dudas específicas..."
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                  />
                </div>

                <div style={{ padding: '12px 14px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>
                    {formatPrice(selectedOffer.tarifa)}/hora
                  </strong>
                  <span className="text-muted"> — {selectedOffer.modalidad}</span>
                </div>

                <button
                  id="booking-submit-btn"
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={submitting}
                >
                  {submitting ? <span className="spinner" /> : 'Confirmar tutoría'}
                </button>
                <button type="button" className="btn btn-ghost btn-full btn-sm" onClick={() => setSelectedOffer(null)}>
                  Cancelar
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
