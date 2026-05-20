package repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"monitor-hub-api/internal/models"
)

type OfferRepository struct {
	pool *pgxpool.Pool
}

func NewOfferRepository(pool *pgxpool.Pool) *OfferRepository {
	return &OfferRepository{pool: pool}
}

func (r *OfferRepository) FindAll(ctx context.Context) ([]models.Offer, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT o.id, o.tutor_id, o.materia, o.tarifa, o.modalidad,
		       o.descripcion, o.nivel, o.activa, o.created_at,
		       u.id, u.nombre, u.programa, u.rol,
		       u.avatar_url, u.bio, u.calificacion_promedio, u.total_sesiones
		FROM offers o
		JOIN users u ON u.id = o.tutor_id
		WHERE o.activa = TRUE AND u.activo = TRUE
		ORDER BY o.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offers []models.Offer
	for rows.Next() {
		var o models.Offer
		var t models.UserPublic
		err := rows.Scan(
			&o.ID, &o.TutorID, &o.Materia, &o.Tarifa, &o.Modalidad,
			&o.Descripcion, &o.Nivel, &o.Activa, &o.CreatedAt,
			&t.ID, &t.Nombre, &t.Programa, &t.Rol,
			&t.AvatarURL, &t.Bio, &t.CalificacionPromedio, &t.TotalSesiones,
		)
		if err != nil {
			return nil, err
		}
		o.Tutor = &t
		offers = append(offers, o)
	}
	if offers == nil {
		offers = []models.Offer{}
	}
	return offers, nil
}

func (r *OfferRepository) FindByTutorID(ctx context.Context, tutorID int) ([]models.Offer, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, tutor_id, materia, tarifa, modalidad,
		       descripcion, nivel, activa, created_at
		FROM offers
		WHERE tutor_id = $1
		ORDER BY created_at DESC
	`, tutorID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var offers []models.Offer
	for rows.Next() {
		var o models.Offer
		err := rows.Scan(
			&o.ID, &o.TutorID, &o.Materia, &o.Tarifa, &o.Modalidad,
			&o.Descripcion, &o.Nivel, &o.Activa, &o.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		offers = append(offers, o)
	}
	if offers == nil {
		offers = []models.Offer{}
	}
	return offers, nil
}

func (r *OfferRepository) FindByID(ctx context.Context, id int) (*models.Offer, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, tutor_id, materia, tarifa, modalidad,
		       descripcion, nivel, activa, created_at
		FROM offers WHERE id = $1
	`, id)

	var o models.Offer
	err := row.Scan(
		&o.ID, &o.TutorID, &o.Materia, &o.Tarifa, &o.Modalidad,
		&o.Descripcion, &o.Nivel, &o.Activa, &o.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OfferRepository) Create(ctx context.Context, tutorID int, in *models.CreateOfferInput) (*models.Offer, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO offers (tutor_id, materia, tarifa, modalidad, descripcion, nivel)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, tutor_id, materia, tarifa, modalidad, descripcion, nivel, activa, created_at
	`, tutorID, in.Materia, in.Tarifa, in.Modalidad, in.Descripcion, in.Nivel)

	var o models.Offer
	err := row.Scan(
		&o.ID, &o.TutorID, &o.Materia, &o.Tarifa, &o.Modalidad,
		&o.Descripcion, &o.Nivel, &o.Activa, &o.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("crear oferta: %w", err)
	}
	return &o, nil
}

func (r *OfferRepository) Deactivate(ctx context.Context, id, tutorID int) error {
	tag, err := r.pool.Exec(ctx,
		"UPDATE offers SET activa = FALSE WHERE id = $1 AND tutor_id = $2",
		id, tutorID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return fmt.Errorf("oferta no encontrada o sin permiso")
	}
	return nil
}
