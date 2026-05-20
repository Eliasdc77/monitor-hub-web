import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <NavLink to="/" className="navbar-brand" aria-label="Ir al inicio">
        <span className="navbar-brand-monitor">Monitor</span>
        <span className="navbar-brand-hub">HUB</span>
      </NavLink>

      <div className="navbar-nav">
        {!user ? (
          <>
            <NavLink to="/login" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Ingresar
            </NavLink>
            <NavLink to="/register">
              <button className="btn btn-primary btn-sm" id="nav-register-btn">Registrarme</button>
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Panel
            </NavLink>
            <NavLink to="/schedule" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Agendar
            </NavLink>
            <NavLink to="/my-tutorings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              Mis tutorías
            </NavLink>
            {(user.rol === 'monitor' || user.rol === 'admin') && (
              <NavLink to="/publish" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Publicar
              </NavLink>
            )}
            {user.rol === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                Admin
              </NavLink>
            )}
            <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span
                className="tutor-avatar"
                style={{ width: 34, height: 34, fontSize: '0.78rem', cursor: 'pointer' }}
                title={user.nombre}
              >
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.nombre} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  : getInitials(user.nombre)
                }
              </span>
            </NavLink>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleLogout}
              id="nav-logout-btn"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
