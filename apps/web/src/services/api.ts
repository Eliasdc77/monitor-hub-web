import type { AuthResponse, CreateBookingInput, CreateOfferInput, LoginInput, Offer, RegisterInput, Booking, User } from '../types'

const BASE = 'https://monitorhub-api.onrender.com/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('mhub_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(BASE + path, { ...options, headers })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Don't logout on 401 errors, only throw the error
    if (res.status !== 401) {
      throw new Error(data?.message ?? 'Error de conexión con el servidor.')
    }
  }
  return data as T
}

// ── Auth ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body: RegisterInput) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: LoginInput) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () =>
    request<{ ok: boolean; user: User }>('/auth/me'),

  updateMe: (body: Partial<Pick<User, 'nombre' | 'programa' | 'bio' | 'semestre'>>) =>
    request<{ ok: boolean; user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
}

// ── Offers ────────────────────────────────────────────────────────────────

export const offersApi = {
  list: () =>
    request<{ ok: boolean; offers: Offer[] }>('/offers'),

  mine: () =>
    request<{ ok: boolean; offers: Offer[] }>('/offers/mine'),

  create: (body: CreateOfferInput) =>
    request<{ ok: boolean; offer: Offer }>('/offers', { method: 'POST', body: JSON.stringify(body) }),

  deactivate: (id: number) =>
    request<{ ok: boolean }>(`/offers/${id}`, { method: 'DELETE' }),
}

// ── Bookings ──────────────────────────────────────────────────────────────

export const bookingsApi = {
  mine: () =>
    request<{ ok: boolean; bookings: Booking[] }>('/bookings/mine'),

  incoming: () =>
    request<{ ok: boolean; bookings: Booking[] }>('/bookings/incoming'),

  create: (body: CreateBookingInput) =>
    request<{ ok: boolean; booking: Booking }>('/bookings', { method: 'POST', body: JSON.stringify(body) }),

  updateEstado: (id: number, estado: string) =>
    request<{ ok: boolean; booking: Booking }>(`/bookings/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado }),
    }),
}

// ── Admin ─────────────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: () =>
    request<{ ok: boolean; users: User[] }>('/admin/users'),

  updateRole: (id: number, rol: string) =>
    request<{ ok: boolean; message: string }>(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ rol }),
    }),

  getStats: () =>
    request<{
      ok: boolean;
      stats: {
        total_users: number
        total_monitors: number
        total_bookings: number
        total_offers: number
      }
    }>('/admin/stats'),
}
