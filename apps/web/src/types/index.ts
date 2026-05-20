// ── Entities ──────────────────────────────────────────────────────────────

export interface User {
  id: number
  nombre: string
  programa: string
  email: string
  rol: 'estudiante' | 'monitor' | 'admin'
  avatar_url?: string | null
  bio?: string | null
  semestre?: number | null
  calificacion_promedio: number
  total_sesiones: number
  activo: boolean
  created_at: string
}

export interface UserPublic {
  id: number
  nombre: string
  programa: string
  rol: string
  avatar_url?: string | null
  bio?: string | null
  calificacion_promedio: number
  total_sesiones: number
}

export interface Offer {
  id: number
  tutor_id: number
  tutor?: UserPublic
  materia: string
  tarifa: number
  modalidad: 'Virtual' | 'Presencial' | 'Ambas'
  descripcion?: string | null
  nivel?: string | null
  activa: boolean
  created_at: string
}

export interface Booking {
  id: number
  estudiante_id: number
  estudiante?: UserPublic
  offer_id: number
  offer?: {
    materia: string
    tarifa: number
    modalidad: string
    tutor?: { nombre: string; calificacion_promedio: number }
  }
  fecha: string
  hora: string
  modalidad: string
  notas?: string | null
  estado: BookingEstado
  created_at: string
}

export type BookingEstado = 'pendiente' | 'confirmada' | 'completada' | 'cancelada'

// ── DTOs ──────────────────────────────────────────────────────────────────

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  nombre: string
  programa: string
  email: string
  password: string
}

export interface CreateOfferInput {
  materia: string
  tarifa: number
  modalidad: 'Virtual' | 'Presencial' | 'Ambas'
  descripcion?: string
  nivel?: string
}

export interface CreateBookingInput {
  offer_id: number
  fecha: string // YYYY-MM-DD format, will be parsed by backend
  hora: string
  modalidad: 'Virtual' | 'Presencial'
  notas?: string
}

// ── API Responses ─────────────────────────────────────────────────────────

export interface AuthResponse {
  ok: boolean
  user: User
  token: string
}

export interface ApiError {
  ok: false
  message: string
}

// ── Session ───────────────────────────────────────────────────────────────

export interface Session {
  user: User
  token: string
}
