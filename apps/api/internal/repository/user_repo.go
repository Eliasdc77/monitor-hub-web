package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"monitor-hub-api/internal/models"
)

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{pool: pool}
}

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*models.User, string, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, nombre, programa, email, password_hash, rol,
		       avatar_url, bio, semestre, calificacion_promedio, total_sesiones, activo, created_at
		FROM users
		WHERE email = $1 AND activo = TRUE
	`, strings.ToLower(strings.TrimSpace(email)))

	var u models.User
	var hash string
	err := row.Scan(
		&u.ID, &u.Nombre, &u.Programa, &u.Email, &hash, &u.Rol,
		&u.AvatarURL, &u.Bio, &u.Semestre, &u.CalificacionPromedio,
		&u.TotalSesiones, &u.Activo, &u.CreatedAt,
	)
	if err != nil {
		return nil, "", err
	}
	return &u, hash, nil
}

func (r *UserRepository) FindByID(ctx context.Context, id int) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `
		SELECT id, nombre, programa, email, rol,
		       avatar_url, bio, semestre, calificacion_promedio, total_sesiones, activo, created_at
		FROM users
		WHERE id = $1
	`, id)

	var u models.User
	err := row.Scan(
		&u.ID, &u.Nombre, &u.Programa, &u.Email, &u.Rol,
		&u.AvatarURL, &u.Bio, &u.Semestre, &u.CalificacionPromedio,
		&u.TotalSesiones, &u.Activo, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM users WHERE email = $1",
		strings.ToLower(strings.TrimSpace(email)),
	).Scan(&count)
	return count > 0, err
}

func (r *UserRepository) Create(ctx context.Context, nombre, programa, email, hash string) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO users (nombre, programa, email, password_hash, rol)
		VALUES ($1, $2, $3, $4, 'estudiante')
		RETURNING id, nombre, programa, email, rol,
		          avatar_url, bio, semestre, calificacion_promedio, total_sesiones, activo, created_at
	`, nombre, programa, strings.ToLower(strings.TrimSpace(email)), hash)

	var u models.User
	err := row.Scan(
		&u.ID, &u.Nombre, &u.Programa, &u.Email, &u.Rol,
		&u.AvatarURL, &u.Bio, &u.Semestre, &u.CalificacionPromedio,
		&u.TotalSesiones, &u.Activo, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insertar usuario: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) CreateOAuthUser(ctx context.Context, nombre, programa, email, hash string, avatarURL *string) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `
		INSERT INTO users (nombre, programa, email, password_hash, avatar_url, rol)
		VALUES ($1, $2, $3, $4, $5, 'estudiante')
		RETURNING id, nombre, programa, email, rol,
		          avatar_url, bio, semestre, calificacion_promedio, total_sesiones, activo, created_at
	`, nombre, programa, strings.ToLower(strings.TrimSpace(email)), hash, avatarURL)

	var u models.User
	err := row.Scan(
		&u.ID, &u.Nombre, &u.Programa, &u.Email, &u.Rol,
		&u.AvatarURL, &u.Bio, &u.Semestre, &u.CalificacionPromedio,
		&u.TotalSesiones, &u.Activo, &u.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("insertar usuario oauth: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) UpdateProfile(ctx context.Context, id int, in *models.UpdateProfileInput) (*models.User, error) {
	row := r.pool.QueryRow(ctx, `
		UPDATE users SET
			nombre   = COALESCE($2, nombre),
			programa = COALESCE($3, programa),
			bio      = COALESCE($4, bio),
			semestre = COALESCE($5, semestre)
		WHERE id = $1
		RETURNING id, nombre, programa, email, rol,
		          avatar_url, bio, semestre, calificacion_promedio, total_sesiones, activo, created_at
	`, id, in.Nombre, in.Programa, in.Bio, in.Semestre)

	var u models.User
	err := row.Scan(
		&u.ID, &u.Nombre, &u.Programa, &u.Email, &u.Rol,
		&u.AvatarURL, &u.Bio, &u.Semestre, &u.CalificacionPromedio,
		&u.TotalSesiones, &u.Activo, &u.CreatedAt,
	)
	return &u, err
}

func (r *UserRepository) UpdateAvatarURL(ctx context.Context, id int, avatarURL string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE users SET avatar_url = $2
		WHERE id = $1
	`, id, avatarURL)
	return err
}

func (r *UserRepository) FindAll(ctx context.Context) ([]models.User, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, nombre, programa, email, rol,
		       avatar_url, bio, semestre, calificacion_promedio, total_sesiones, activo, created_at
		FROM users
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var u models.User
		err := rows.Scan(
			&u.ID, &u.Nombre, &u.Programa, &u.Email, &u.Rol,
			&u.AvatarURL, &u.Bio, &u.Semestre, &u.CalificacionPromedio,
			&u.TotalSesiones, &u.Activo, &u.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	if users == nil {
		users = []models.User{}
	}
	return users, nil
}

func (r *UserRepository) UpdateRole(ctx context.Context, id int, rol string) error {
	_, err := r.pool.Exec(ctx, "UPDATE users SET rol = $2 WHERE id = $1", id, rol)
	return err
}
