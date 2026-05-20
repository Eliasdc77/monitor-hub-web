import { useEffect, useState } from 'react'
import { adminApi } from '../services/api'
import { useToast } from '../store/ToastContext'
import type { User } from '../types'

export default function Admin() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({ total_users: 0, total_monitors: 0, total_bookings: 0, total_offers: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getUsers().then(r => setUsers(r.users)),
      adminApi.getStats().then(r => setStats(r.stats))
    ]).catch(err => {
      toast('error', 'Error', err.message || 'Error cargando datos de administrador')
    }).finally(() => setLoading(false))
  }, [])

  const handleRoleChange = async (userId: number, newRole: 'estudiante' | 'monitor' | 'admin') => {
    try {
      await adminApi.updateRole(userId, newRole)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, rol: newRole } : u))
      toast('success', 'Rol actualizado correctamente')
    } catch (err: any) {
      toast('error', 'Error', err.message || 'No se pudo actualizar el rol')
    }
  }

  if (loading) return <div className="spinner-center"><span className="spinner spinner-lg" /></div>

  return (
    <div className="animate-fadeup">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.75rem' }}>Panel de Administración</h1>
        <p className="text-muted">Gestión de usuarios y monitoreo general de actividad.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="card">
          <div className="card-body">
            <h3 className="text-muted text-sm">Total Usuarios</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_users}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="text-muted text-sm">Monitores</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_monitors}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="text-muted text-sm">Tutorías Agendadas</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_bookings}</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="text-muted text-sm">Ofertas Publicadas</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total_offers}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Gestión de Usuarios</h3>
        </div>
        <div className="card-body" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '12px 8px' }}>Nombre</th>
                <th style={{ padding: '12px 8px' }}>Email</th>
                <th style={{ padding: '12px 8px' }}>Programa</th>
                <th style={{ padding: '12px 8px' }}>Rol</th>
                <th style={{ padding: '12px 8px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 8px' }}>{u.nombre}</td>
                  <td style={{ padding: '12px 8px' }}>{u.email}</td>
                  <td style={{ padding: '12px 8px' }}>{u.programa}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span className={`badge ${u.rol === 'admin' ? 'badge-primary' : u.rol === 'monitor' ? 'badge-success' : 'badge-neutral'}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <select
                      className="form-control"
                      value={u.rol}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as 'estudiante' | 'monitor' | 'admin')}
                      style={{ padding: '4px 8px', width: 'auto', minWidth: '120px' }}
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="monitor">Monitor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
