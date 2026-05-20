package models

import "time"

// ─── User ──────────────────────────────────────────────────────────────────

type User struct {
	ID                   int       `json:"id"`
	Nombre               string    `json:"nombre"`
	Programa             string    `json:"programa"`
	Email                string    `json:"email"`
	Rol                  string    `json:"rol"`
	AvatarURL            *string   `json:"avatar_url,omitempty"`
	Bio                  *string   `json:"bio,omitempty"`
	Semestre             *int      `json:"semestre,omitempty"`
	CalificacionPromedio float64   `json:"calificacion_promedio"`
	TotalSesiones        int       `json:"total_sesiones"`
	Activo               bool      `json:"activo"`
	CreatedAt            time.Time `json:"created_at"`
}

// UserPublic is a subset safe to expose in offer/booking responses.
type UserPublic struct {
	ID                   int     `json:"id"`
	Nombre               string  `json:"nombre"`
	Programa             string  `json:"programa"`
	Rol                  string  `json:"rol"`
	AvatarURL            *string `json:"avatar_url,omitempty"`
	Bio                  *string `json:"bio,omitempty"`
	CalificacionPromedio float64 `json:"calificacion_promedio"`
	TotalSesiones        int     `json:"total_sesiones"`
}

// ─── Offer ─────────────────────────────────────────────────────────────────

type Offer struct {
	ID          int         `json:"id"`
	TutorID     int         `json:"tutor_id"`
	Tutor       *UserPublic `json:"tutor,omitempty"`
	Materia     string      `json:"materia"`
	Tarifa      int         `json:"tarifa"`
	Modalidad   string      `json:"modalidad"`
	Descripcion *string     `json:"descripcion,omitempty"`
	Nivel       *string     `json:"nivel,omitempty"`
	Activa      bool        `json:"activa"`
	CreatedAt   time.Time   `json:"created_at"`
}

// ─── Booking ───────────────────────────────────────────────────────────────

type Booking struct {
	ID           int         `json:"id"`
	EstudianteID int         `json:"estudiante_id"`
	Estudiante   *UserPublic `json:"estudiante,omitempty"`
	OfferID      int         `json:"offer_id"`
	Offer        *Offer      `json:"offer,omitempty"`
	Fecha        string      `json:"fecha"` // YYYY-MM-DD
	Hora         string      `json:"hora"`  // HH:MM
	Modalidad    string      `json:"modalidad"`
	Notas        *string     `json:"notas,omitempty"`
	Estado       string      `json:"estado"`
	CreatedAt    time.Time   `json:"created_at"`
}

type BookingNotificationData struct {
	BookingID        int    `json:"booking_id"`
	Estado           string `json:"estado"`
	Fecha            string `json:"fecha"`
	Hora             string `json:"hora"`
	Modalidad        string `json:"modalidad"`
	Materia          string `json:"materia"`
	EstudianteID     int    `json:"estudiante_id"`
	EstudianteNombre string `json:"estudiante_nombre"`
	EstudianteEmail  string `json:"estudiante_email"`
	TutorID          int    `json:"tutor_id"`
	TutorNombre      string `json:"tutor_nombre"`
	TutorEmail       string `json:"tutor_email"`
}

// ─── Review ────────────────────────────────────────────────────────────────

type Review struct {
	ID           int       `json:"id"`
	BookingID    int       `json:"booking_id"`
	EstudianteID int       `json:"estudiante_id"`
	TutorID      int       `json:"tutor_id"`
	Calificacion int       `json:"calificacion"`
	Comentario   *string   `json:"comentario,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// ─── Notification ──────────────────────────────────────────────────────────

type Notification struct {
	ID           int       `json:"id"`
	UserID       int       `json:"user_id"`
	Tipo         string    `json:"tipo"`
	Titulo       string    `json:"titulo"`
	Mensaje      *string   `json:"mensaje,omitempty"`
	Leida        bool      `json:"leida"`
	ReferenciaID *int      `json:"referencia_id,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

// ─── DTOs ──────────────────────────────────────────────────────────────────

type RegisterInput struct {
	Nombre   string `json:"nombre"   binding:"required,min=2,max=120"`
	Programa string `json:"programa" binding:"required,min=2,max=180"`
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginInput struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type CreateOfferInput struct {
	Materia     string  `json:"materia"     binding:"required,min=2,max=180"`
	Tarifa      int     `json:"tarifa"      binding:"required,min=0"`
	Modalidad   string  `json:"modalidad"   binding:"required,oneof=Virtual Presencial Ambas"`
	Descripcion *string `json:"descripcion"`
	Nivel       *string `json:"nivel"`
}

type CreateBookingInput struct {
	OfferID   int     `json:"offer_id"  binding:"required"`
	Fecha     string  `json:"fecha"     binding:"required"`
	Hora      string  `json:"hora"      binding:"required"`
	Modalidad string  `json:"modalidad" binding:"required,oneof=Virtual Presencial"`
	Notas     *string `json:"notas"`
}

type CreateReviewInput struct {
	BookingID    int     `json:"booking_id"   binding:"required"`
	Calificacion int     `json:"calificacion" binding:"required,min=1,max=5"`
	Comentario   *string `json:"comentario"`
}

type UpdateProfileInput struct {
	Nombre   *string `json:"nombre"`
	Programa *string `json:"programa"`
	Bio      *string `json:"bio"`
	Semestre *int    `json:"semestre"`
}
