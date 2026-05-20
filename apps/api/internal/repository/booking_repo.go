package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"monitor-hub-api/internal/models"
)

type BookingRepository struct {
	pool *pgxpool.Pool
}

func NewBookingRepository(pool *pgxpool.Pool) *BookingRepository {
	return &BookingRepository{pool: pool}
}

func (r *BookingRepository) FindByEstudiante(ctx context.Context, estudianteID int) ([]models.Booking, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT b.id, b.estudiante_id, b.offer_id, b.fecha, b.hora,
		       b.modalidad, b.notas, b.estado, b.created_at,
		       o.materia, o.tarifa, o.modalidad,
		       u.nombre, u.calificacion_promedio
		FROM bookings b
		JOIN offers o ON o.id = b.offer_id
		JOIN users u ON u.id = o.tutor_id
		WHERE b.estudiante_id = $1
		ORDER BY b.fecha DESC, b.hora DESC
	`, estudianteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		var o models.Offer
		var tutor models.UserPublic
		var fechaTime time.Time
		err := rows.Scan(
			&b.ID, &b.EstudianteID, &b.OfferID, &fechaTime, &b.Hora,
			&b.Modalidad, &b.Notas, &b.Estado, &b.CreatedAt,
			&o.Materia, &o.Tarifa, &o.Modalidad,
			&tutor.Nombre, &tutor.CalificacionPromedio,
		)
		if err != nil {
			return nil, err
		}
		b.Fecha = fechaTime.Format("2006-01-02")
		o.Tutor = &tutor
		b.Offer = &o
		bookings = append(bookings, b)
	}
	if bookings == nil {
		bookings = []models.Booking{}
	}
	return bookings, nil
}

func (r *BookingRepository) FindByTutor(ctx context.Context, tutorID int) ([]models.Booking, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT b.id, b.estudiante_id, b.offer_id, b.fecha, b.hora,
		       b.modalidad, b.notas, b.estado, b.created_at,
		       u.id, u.nombre, u.programa, u.rol, u.avatar_url, u.bio, u.calificacion_promedio, u.total_sesiones
		FROM bookings b
		JOIN offers o ON o.id = b.offer_id
		JOIN users u ON u.id = b.estudiante_id
		WHERE o.tutor_id = $1
		ORDER BY b.fecha DESC
	`, tutorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var bookings []models.Booking
	for rows.Next() {
		var b models.Booking
		var est models.UserPublic
		var fechaTime time.Time
		err := rows.Scan(
			&b.ID, &b.EstudianteID, &b.OfferID, &fechaTime, &b.Hora,
			&b.Modalidad, &b.Notas, &b.Estado, &b.CreatedAt,
			&est.ID, &est.Nombre, &est.Programa, &est.Rol, &est.AvatarURL, &est.Bio, &est.CalificacionPromedio, &est.TotalSesiones,
		)
		if err != nil {
			return nil, err
		}
		b.Fecha = fechaTime.Format("2006-01-02")
		b.Estudiante = &est
		bookings = append(bookings, b)
	}
	if bookings == nil {
		bookings = []models.Booking{}
	}
	return bookings, nil
}

func (r *BookingRepository) Create(ctx context.Context, estudianteID int, in *models.CreateBookingInput) (*models.Booking, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO bookings (estudiante_id, offer_id, fecha, hora, modalidad, notas)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, estudiante_id, offer_id, fecha, hora, modalidad, notas, estado, created_at
	`, estudianteID, in.OfferID, in.Fecha, in.Hora, in.Modalidad, in.Notas)

	var b models.Booking
	var fechaTime time.Time
	err := row.Scan(
		&b.ID, &b.EstudianteID, &b.OfferID, &fechaTime, &b.Hora,
		&b.Modalidad, &b.Notas, &b.Estado, &b.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("crear reserva: %w", err)
	}
	b.Fecha = fechaTime.Format("2006-01-02")
	return &b, nil
}

func (r *BookingRepository) UpdateEstado(ctx context.Context, id int, estado string) (*models.Booking, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE bookings SET estado = $2
		WHERE id = $1
		RETURNING id, estudiante_id, offer_id, fecha, hora, modalidad, notas, estado, created_at
	`, id, estado)

	var b models.Booking
	var fechaTime time.Time
	err := row.Scan(
		&b.ID, &b.EstudianteID, &b.OfferID, &fechaTime, &b.Hora,
		&b.Modalidad, &b.Notas, &b.Estado, &b.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("actualizar estado: %w", err)
	}
	b.Fecha = fechaTime.Format("2006-01-02")
	return &b, nil
}

func (r *BookingRepository) FindByID(ctx context.Context, id int) (*models.Booking, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, estudiante_id, offer_id, fecha, hora, modalidad, notas, estado, created_at
		FROM bookings WHERE id = $1
	`, id)

	var b models.Booking
	var fechaTime time.Time
	err := row.Scan(
		&b.ID, &b.EstudianteID, &b.OfferID, &fechaTime, &b.Hora,
		&b.Modalidad, &b.Notas, &b.Estado, &b.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	b.Fecha = fechaTime.Format("2006-01-02")
	return &b, nil
}

func (r *BookingRepository) GetNotificationData(ctx context.Context, id int) (*models.BookingNotificationData, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT b.id, b.estado, b.fecha, b.hora, b.modalidad,
		       o.materia,
		       est.id, est.nombre, est.email,
		       tut.id, tut.nombre, tut.email
		FROM bookings b
		JOIN offers o ON o.id = b.offer_id
		JOIN users est ON est.id = b.estudiante_id
		JOIN users tut ON tut.id = o.tutor_id
		WHERE b.id = $1
	`, id)

	var info models.BookingNotificationData
	var fechaTime time.Time
	err := row.Scan(
		&info.BookingID, &info.Estado, &fechaTime, &info.Hora, &info.Modalidad,
		&info.Materia,
		&info.EstudianteID, &info.EstudianteNombre, &info.EstudianteEmail,
		&info.TutorID, &info.TutorNombre, &info.TutorEmail,
	)
	if err != nil {
		return nil, err
	}
	info.Fecha = fechaTime.Format("2006-01-02")
	return &info, nil
}
