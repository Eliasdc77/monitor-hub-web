import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { offersApi, bookingsApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import type { Booking, Offer } from '../types'

function formatPrice(tarifa: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(tarifa)
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' })
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente:  'badge-warning',
  confirmada: 'badge-primary',
  completada: 'badge-success',
  cancelada:  'badge-error',
}

export default function Dashboard() {
  const { user } = useAuth()
  const [offers, setOffers] = useState<Offer[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      offersApi.list(),
      bookingsApi.mine(),
    ]).then(([o, b]) => {
      setOffers(o.offers)
      setBookings(b.bookings)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-center"><span className="spinner spinner-lg" /></div>

  const recentBookings = bookings.slice(0, 5)
  const recentOffers = offers.slice(0, 6)

  return (
    <div className="animate-fadeup">
      {/* ── Welcome Banner ────────────────────── */}
      <div className="welcome-banner">
        <h1>Bienvenido, {user?.nombre.split(' ')[0]} 👋</h1>
        <p>Desde aquí puedes revisar tu actividad, agendar sesiones y gestionar tu perfil.</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
          <Link to="/schedule">
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
              + Agendar tutoría
            </button>
          </Link>
          {(user?.rol === 'monitor' || user?.rol === 'admin') && (
            <Link to="/publish">
              <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.12)', color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                + Publicar oferta
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────── */}
      <div className="grid-4 mb-6">
        {[
          { icon: '📅', label: 'Mis reservas', value: bookings.length, color: 'var(--color-primary-light)', iconColor: 'var(--color-primary)' },
          { icon: '✅', label: 'Completadas', value: bookings.filter(b => b.estado === 'completada').length, color: 'var(--color-success-bg)', iconColor: 'var(--color-success)' },
          { icon: '📚', label: 'Tutores disponibles', value: offers.length, color: 'var(--color-accent-light)', iconColor: 'var(--color-accent)' },
          { icon: '⏳', label: 'Pendientes', value: bookings.filter(b => b.estado === 'pendiente').length, color: 'var(--color-warning-bg)', iconColor: 'var(--color-warning)' },
        ].map((s, i) => (
          <div key={i} className={`stat-card delay-${i+1} animate-fadeup`}>
            <div className="stat-icon" style={{ background: s.color, color: s.iconColor }}>
              {s.icon}
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Recent bookings ───────────────────── */}
      <div className="mb-6">
        <div className="section-header">
          <div>
            <h2 className="section-title">Mis tutorías recientes</h2>
          </div>
          <Link to="/my-tutorings">
            <button className="btn btn-ghost btn-sm">Ver todas →</button>
          </Link>
        </div>

        <div className="card">
          {recentBookings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📅</div>
              <div className="empty-state-title">Sin reservas todavía</div>
              <p className="empty-state-text">Agenda tu primera tutoría y aparecerá aquí.</p>
            </div>
          ) : (
            recentBookings.map(b => (
              <div key={b.id} className="booking-item">
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-light)',
                  display: 'grid', placeItems: 'center',
                  fontSize: '1.1rem', flexShrink: 0,
                }}>📚</div>
                <div className="booking-info">
                  <p className="font-semibold" style={{ fontSize: '0.92rem' }}>
                    {b.offer?.materia ?? 'Tutoría'} — {b.offer?.tutor?.nombre}
                  </p>
                  <div className="booking-meta">
                    <span className="booking-meta-item">📅 {formatDate(b.fecha)}</span>
                    <span className="booking-meta-item">⏰ {b.hora}</span>
                    <span className="booking-meta-item">🖥 {b.modalidad}</span>
                  </div>
                </div>
                <span className={`badge ${ESTADO_BADGE[b.estado]}`}>{b.estado}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Recent offers ─────────────────────── */}
      <div>
        <div className="section-header">
          <div>
            <h2 className="section-title">Últimas ofertas disponibles</h2>
          </div>
          <Link to="/schedule">
            <button className="btn btn-ghost btn-sm">Agendar →</button>
          </Link>
        </div>

        <div className="grid-3">
          {recentOffers.map((o, i) => (
            <div key={o.id} className={`card delay-${i+1} animate-fadeup`}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="badge badge-primary">{o.materia}</span>
                  <span className="badge badge-neutral">{o.modalidad}</span>
                </div>
                <h4>{o.tutor?.nombre ?? 'Tutor'}</h4>
                <p className="text-sm text-muted">{o.tutor?.programa}</p>
                {o.descripcion && (
                  <p className="text-sm" style={{ marginTop: 6, color: 'var(--color-ink-2)', lineHeight: 1.4 }}>
                    {o.descripcion.slice(0, 80)}{o.descripcion.length > 80 ? '...' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {formatPrice(o.tarifa)}/h
                  </span>
                  <Link to={`/schedule?offer=${o.id}`}>
                    <button className="btn btn-primary btn-sm" id={`dashboard-book-${o.id}`}>Reservar</button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
