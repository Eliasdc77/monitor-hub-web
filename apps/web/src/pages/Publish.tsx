import { useEffect, useState } from 'react'
import { offersApi } from '../services/api'
import { useToast } from '../store/ToastContext'
import type { CreateOfferInput, Offer } from '../types'

function formatPrice(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
}

const MATERIAS = [
  'Cálculo Integral', 'Cálculo Diferencial', 'Álgebra Lineal',
  'Compiladores', 'Estructuras de Datos', 'Bases de Datos',
  'Programación Orientada a Objetos', 'Sistemas Operativos',
  'Redes de Computadores', 'Física Mecánica', 'Física Electromagnetismo',
  'Química General', 'Estadística', 'Contabilidad', 'Economía',
  'Inglés', 'Otra',
]

const NIVELES = ['Básico', 'Intermedio', 'Avanzado']

export default function Publish() {
  const { toast } = useToast()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CreateOfferInput & { tarifaStr: string }>({
    materia: '', tarifa: 0, tarifaStr: '', modalidad: 'Virtual', descripcion: '', nivel: '',
  })

  useEffect(() => {
    offersApi.mine().then(r => setOffers(r.offers)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(f => ({
      ...f,
      [name]: name === 'tarifaStr' ? value : value,
      ...(name === 'tarifaStr' ? { tarifa: Number(value.replace(/\D/g, '')) || 0 } : {}),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.materia || !form.tarifa || !form.modalidad) {
      toast('error', 'Campos incompletos', 'Completa materia, tarifa y modalidad.'); return
    }
    setSubmitting(true)
    try {
      const { offer } = await offersApi.create({
        materia: form.materia,
        tarifa: form.tarifa,
        modalidad: form.modalidad,
        descripcion: form.descripcion || undefined,
        nivel: form.nivel || undefined,
      })
      setOffers(prev => [offer, ...prev])
      setForm({ materia: '', tarifa: 0, tarifaStr: '', modalidad: 'Virtual', descripcion: '', nivel: '' })
      toast('success', '¡Oferta publicada!', `${offer.materia} ya es visible para los estudiantes.`)
    } catch (err) {
      toast('error', 'Error', err instanceof Error ? err.message : 'No se pudo publicar.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('¿Desactivar esta oferta? Dejará de aparecer en el marketplace.')) return
    try {
      await offersApi.deactivate(id)
      setOffers(prev => prev.filter(o => o.id !== id))
      toast('info', 'Oferta desactivada')
    } catch {
      toast('error', 'No se pudo desactivar')
    }
  }

  return (
    <div className="animate-fadeup">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem' }}>Publicar oferta de tutoría</h1>
        <p className="text-muted">Crea y gestiona tus ofertas disponibles en el marketplace.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>
        {/* Form */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Nueva oferta</h3>
          </div>
          <div className="card-body">
            <form id="publish-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="pub-materia">Materia</label>
                  <select id="pub-materia" name="materia" className="form-control" value={form.materia} onChange={handleChange} required>
                    <option value="">Selecciona</option>
                    {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pub-nivel">Nivel</label>
                  <select id="pub-nivel" name="nivel" className="form-control" value={form.nivel} onChange={handleChange}>
                    <option value="">Sin especificar</option>
                    {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="pub-tarifa">Tarifa (COP/hora)</label>
                  <input
                    id="pub-tarifa"
                    name="tarifaStr"
                    type="number"
                    className="form-control"
                    placeholder="Ej: 15000"
                    min={0}
                    value={form.tarifaStr}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="pub-modalidad">Modalidad</label>
                  <select id="pub-modalidad" name="modalidad" className="form-control" value={form.modalidad} onChange={handleChange} required>
                    <option value="Virtual">Virtual</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Ambas">Ambas</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pub-desc">Descripción (opcional)</label>
                <textarea
                  id="pub-desc"
                  name="descripcion"
                  className="form-control"
                  rows={3}
                  placeholder="Describe brevemente tu experiencia y metodología..."
                  value={form.descripcion}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {form.tarifa > 0 && (
                <div style={{ padding: '10px 14px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <strong style={{ color: 'var(--color-primary)' }}>{formatPrice(form.tarifa)}/hora</strong>
                  {' — '}{form.modalidad}
                </div>
              )}

              <button
                id="publish-submit-btn"
                type="submit"
                className="btn btn-primary btn-full"
                disabled={submitting}
              >
                {submitting ? <span className="spinner" /> : '🚀 Publicar oferta'}
              </button>
            </form>
          </div>
        </div>

        {/* My offers */}
        <div>
          <h3 className="section-title" style={{ marginBottom: 14 }}>Mis ofertas activas</h3>
          {loading ? (
            <div className="spinner-center"><span className="spinner" /></div>
          ) : offers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div className="empty-state-title">Sin ofertas publicadas</div>
              <p className="empty-state-text">Crea tu primera oferta usando el formulario.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {offers.map(o => (
                <div key={o.id} className="card">
                  <div className="card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span className="badge badge-primary">{o.materia}</span>
                        {o.nivel && <span className="badge badge-neutral">{o.nivel}</span>}
                        <span className="badge badge-neutral">{o.modalidad}</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                        {formatPrice(o.tarifa)}/h
                      </p>
                      {o.descripcion && (
                        <p className="text-sm text-muted" style={{ marginTop: 4 }}>
                          {o.descripcion.slice(0, 70)}{o.descripcion.length > 70 ? '…' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      id={`deactivate-offer-${o.id}`}
                      onClick={() => handleDeactivate(o.id)}
                      style={{ color: 'var(--color-error)' }}
                    >
                      Retirar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
