import { useState } from 'react'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'
import { authApi } from '../services/api'

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const ROL_LABEL: Record<string, string> = {
  estudiante: '🎓 Estudiante',
  monitor:    '📚 Monitor',
  admin:      '⚙️ Administrador',
}

const SEMESTRES = Array.from({ length: 12 }, (_, i) => i + 1)

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: user?.nombre ?? '',
    programa: user?.programa ?? '',
    bio: user?.bio ?? '',
    semestre: user?.semestre ?? '',
  })

  if (!user) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await authApi.updateMe({
        nombre: form.nombre || undefined,
        programa: form.programa || undefined,
        bio: form.bio || undefined,
        semestre: form.semestre ? Number(form.semestre) : undefined,
      })
      await refreshUser()
      setEditing(false)
      toast('success', 'Perfil actualizado')
    } catch (err) {
      toast('error', 'Error', err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fadeup" style={{ maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem' }}>Mi perfil</h1>
        <p className="text-muted">Gestiona tu información personal y académica.</p>
      </div>

      {/* Profile card */}
      <div className="card mb-6">
        <div className="card-body">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div
              className="tutor-avatar"
              style={{
                width: 72, height: 72, fontSize: '1.6rem',
                background: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                flexShrink: 0,
              }}
            >
              {user.avatar_url
                ? <img src={user.avatar_url} alt={user.nombre} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : getInitials(user.nombre)
              }
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.35rem', marginBottom: 2 }}>{user.nombre}</h2>
              <p className="text-muted">{user.programa}{user.semestre ? ` — Semestre ${user.semestre}` : ''}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-primary">{ROL_LABEL[user.rol] ?? user.rol}</span>
                <span className="badge badge-neutral">📧 {user.email}</span>
                {user.calificacion_promedio > 0 && (
                  <span className="badge badge-accent">⭐ {user.calificacion_promedio.toFixed(1)}</span>
                )}
                {user.total_sesiones > 0 && (
                  <span className="badge badge-success">{user.total_sesiones} sesiones</span>
                )}
              </div>
              {user.bio && (
                <p className="text-sm" style={{ marginTop: 10, color: 'var(--color-ink-2)', lineHeight: 1.5 }}>
                  {user.bio}
                </p>
              )}
            </div>

            <button
              className="btn btn-outline btn-sm"
              id="profile-edit-btn"
              onClick={() => {
                setEditing(!editing)
                setForm({ nombre: user.nombre, programa: user.programa, bio: user.bio ?? '', semestre: user.semestre ?? '' })
              }}
            >
              {editing ? 'Cancelar' : '✏️ Editar'}
            </button>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="card animate-fadeup">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem' }}>Editar información</h3>
          </div>
          <div className="card-body">
            <form id="profile-form" onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-nombre">Nombre completo</label>
                  <input id="profile-nombre" name="nombre" type="text" className="form-control" value={form.nombre} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-semestre">Semestre</label>
                  <select id="profile-semestre" name="semestre" className="form-control" value={form.semestre} onChange={handleChange}>
                    <option value="">Sin especificar</option>
                    {SEMESTRES.map(s => <option key={s} value={s}>{s}°</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-programa">Programa académico</label>
                <input id="profile-programa" name="programa" type="text" className="form-control" value={form.programa} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profile-bio">Bio (opcional)</label>
                <textarea
                  id="profile-bio"
                  name="bio"
                  className="form-control"
                  rows={3}
                  placeholder="Cuéntanos sobre ti, tu experiencia académica..."
                  value={form.bio}
                  onChange={handleChange}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button id="profile-save-btn" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Guardar cambios'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account info */}
      <div className="card mt-6">
        <div className="card-header">
          <h3 style={{ fontSize: '1rem' }}>Información de cuenta</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Correo', value: user.email },
              { label: 'Rol', value: ROL_LABEL[user.rol] ?? user.rol },
              { label: 'Sesiones completadas', value: String(user.total_sesiones) },
              { label: 'Calificación promedio', value: user.calificacion_promedio > 0 ? `${user.calificacion_promedio.toFixed(2)} ⭐` : 'Sin calificaciones' },
              { label: 'Miembro desde', value: new Date(user.created_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }) },
              { label: 'Estado', value: user.activo ? '✅ Activo' : '⛔ Inactivo' },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 0', borderBottom: '1px solid var(--color-border)' }}>
                <p className="text-sm text-muted">{item.label}</p>
                <p className="font-semibold" style={{ fontSize: '0.9rem', marginTop: 2 }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
