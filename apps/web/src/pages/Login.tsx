import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../store/AuthContext'
import { useToast } from '../store/ToastContext'

export default function Login() {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const errorParam = params.get('error')

    if (errorParam) {
      setError(decodeURIComponent(errorParam))
      return
    }

    if (!token) return

    setIsLoading(true)
    setError('')
    localStorage.setItem('mhub_token', token)

    authApi.me()
      .then(({ user }) => {
        if (!user) throw new Error('No se pudo validar la sesion.')
        login(user, token)
        toast('success', 'Bienvenido', user.nombre)
        navigate('/dashboard', { replace: true })
      })
      .catch((err) => {
        localStorage.removeItem('mhub_token')
        setError(err instanceof Error ? err.message : 'Error al iniciar sesion con Google.')
        navigate('/login', { replace: true })
      })
      .finally(() => setIsLoading(false))
  }, [login, navigate, toast])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Completa todos los campos.'); return }
    setIsLoading(true)
    setError('')
    try {
      const res = await authApi.login({ email: form.email, password: form.password })
      login(res.user, res.token)
      toast('success', '¡Bienvenido de vuelta!', res.user.nombre)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fadeup">
        <Link to="/" className="auth-logo">
          <span style={{ color: 'var(--color-muted)', fontWeight: 500 }}>Monitor</span>
          <span style={{ color: 'var(--color-primary)' }}>HUB</span>
        </Link>

        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-sub">Ingresa con tu correo para acceder a tu panel.</p>

        <form id="login-form" className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Correo institucional</label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-control"
              placeholder="tucorreo@unimagdalena.edu.co"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Contraseña</label>
            <input
              id="login-password"
              name="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--color-error-bg)',
                color: 'var(--color-error)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : 'Ingresar'}
          </button>

          <button
            type="button"
            className="btn btn-outline btn-full btn-lg"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            style={{ marginTop: 12 }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 48 48"
              aria-hidden="true"
              focusable="false"
              style={{ marginRight: 8 }}
            >
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.23 9.21 3.64l6.85-6.85C35.9 2.72 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.64 24.46c0-1.54-.14-3.02-.41-4.46H24v8.44h12.87c-.56 3.02-2.24 5.58-4.77 7.3l7.73 6.01c4.52-4.18 7.11-10.36 7.11-17.29z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.42-.76-2.93-.76-4.49s.27-3.07.76-4.49l-7.98-6.19C.92 16.23 0 19.99 0 24c0 4.01.92 7.77 2.56 11.19l7.97-6.6z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.81l-7.73-6.01c-2.14 1.45-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continuar con Google
          </button>
        </form>

        <p className="auth-divider" style={{ marginTop: 20 }}>o</p>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-muted)', marginTop: 12 }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Regístrate gratis
          </Link>
        </p>

        <div style={{
          marginTop: 24, padding: '12px 14px',
          background: 'var(--color-primary-light)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem',
          color: 'var(--color-primary)',
        }}>
          <strong>Demo:</strong> demo@unimagdalena.edu.co / 123456
        </div>
      </div>
    </div>
  )
}
