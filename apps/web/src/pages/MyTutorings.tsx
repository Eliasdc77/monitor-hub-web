import { useEffect, useState } from 'react'
import { bookingsApi } from '../services/api'
import { useToast } from '../store/ToastContext'
import { useAuth } from '../store/AuthContext'
import type { Booking } from '../types'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente:  'badge-warning',
  confirmada: 'badge-primary',
  completada: 'badge-success',
  cancelada:  'badge-error',
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmada: 'Confirmada',
  completada: 'Completada',
  cancelada:  'Cancelada',
}

type Filter = 'todas' | 'pendiente' | 'confirmada' | 'completada' | 'cancelada'

export default function MyTutorings() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('todas')
  const [cancelling, setCancelling] = useState<number | null>(null)

  useEffect(() => {
    console.log('MyTutorings - User:', user?.nombre, 'Role:', user?.rol)
    const isTutor = user?.rol === 'monitor'
    console.log('MyTutorings - Is tutor:', isTutor)
    const apiCall = isTutor ? bookingsApi.incoming() : bookingsApi.mine()
    console.log('MyTutorings - Making API call:', isTutor ? 'incoming' : 'mine')
    apiCall.then(r => {
      console.log('MyTutorings - API response:', r)
      setBookings(r.bookings)
    }).catch(err => {
      console.error('MyTutorings - API error:', err)
    }).finally(() => setLoading(false))
  }, [user])

  const handleCancel = async (id: number) => {
    if (!confirm('¿Seguro que quieres cancelar esta tutoría?')) return
    setCancelling(id)
    try {
      const { booking: updated } = await bookingsApi.updateEstado(id, 'cancelada')
      setBookings(prev => prev.map(b => b.id === updated.id ? updated : b))
      toast('info', 'Tutoría cancelada')
    } catch {
      toast('error', 'No se pudo cancelar')
    } finally {
      setCancelling(null)
    }
  }

  const filtered = filter === 'todas' ? bookings : bookings.filter(b => b.estado === filter)

  if (loading) return <div className="spinner-center"><span className="spinner spinner-lg" /></div>

  return (
    <div className="animate-fadeup">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem' }}>Mis tutorías</h1>
        <p className="text-muted">Historial y estado de todas tus sesiones agendadas.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['todas', 'pendiente', 'confirmada', 'completada', 'cancelada'] as Filter[]).map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
            id={`filter-${f}`}
            onClick={() => setFilter(f)}
          >
            {f === 'todas' ? 'Todas' : ESTADO_LABEL[f]}
            <span className="badge badge-neutral" style={{ marginLeft: 4, fontSize: '0.7rem' }}>
              {f === 'todas' ? bookings.length : bookings.filter(b => b.estado === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">Sin tutorías {filter !== 'todas' ? `"${ESTADO_LABEL[filter]}"` : ''}</div>
          <p className="empty-state-text">
            {filter === 'todas' ? 'Agenda tu primera tutoría en la sección "Agendar".' : 'No hay registros en este estado.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(b => (
            <div key={b.id} className="card animate-fadeup">
              <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 'var(--radius-md)',
                  background: 'var(--color-primary-light)',
                  display: 'grid', placeItems: 'center',
                  fontSize: '1.25rem', flexShrink: 0,
                }}>
                  📚
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4, alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem' }}>{b.offer?.materia ?? 'Tutoría'}</h4>
                    <span className={`badge ${ESTADO_BADGE[b.estado]}`}>{ESTADO_LABEL[b.estado]}</span>
                  </div>
                  {b.offer?.tutor && (
                    <p className="text-sm text-muted">Con {b.offer.tutor.nombre}</p>
                  )}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
                    <span className="text-sm" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      📅 {formatDate(b.fecha)}
                    </span>
                    <span className="text-sm" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      ⏰ {b.hora}
                    </span>
                    <span className="text-sm" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      🖥 {b.modalidad}
                    </span>
                  </div>
                  {b.notas && (
                    <p className="text-sm" style={{ marginTop: 6, color: 'var(--color-muted)', fontStyle: 'italic' }}>
                      💬 {b.notas}
                    </p>
                  )}
                </div>

                {(b.estado === 'pendiente' || b.estado === 'confirmada') && (
                  <button
                    className="btn btn-danger btn-sm"
                    id={`cancel-booking-${b.id}`}
                    onClick={() => handleCancel(b.id)}
                    disabled={cancelling === b.id}
                  >
                    {cancelling === b.id ? <span className="spinner" /> : 'Cancelar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
