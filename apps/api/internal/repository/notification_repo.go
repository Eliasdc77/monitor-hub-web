package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"monitor-hub-api/internal/models"
)

type NotificationRepository struct {
	pool *pgxpool.Pool
}

func NewNotificationRepository(pool *pgxpool.Pool) *NotificationRepository {
	return &NotificationRepository{pool: pool}
}

func (r *NotificationRepository) Create(ctx context.Context, n *models.Notification) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO notifications (user_id, tipo, titulo, mensaje, referencia_id)
		VALUES ($1, $2, $3, $4, $5)
	`, n.UserID, n.Tipo, n.Titulo, n.Mensaje, n.ReferenciaID)
	return err
}
