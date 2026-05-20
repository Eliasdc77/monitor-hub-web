package repository

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepository struct {
	pool *pgxpool.Pool
}

func NewAdminRepository(pool *pgxpool.Pool) *AdminRepository {
	return &AdminRepository{pool: pool}
}

type SystemStats struct {
	TotalUsers    int `json:"total_users"`
	TotalMonitors int `json:"total_monitors"`
	TotalBookings int `json:"total_bookings"`
	TotalOffers   int `json:"total_offers"`
}

func (r *AdminRepository) GetStats(ctx context.Context) (*SystemStats, error) {
	var stats SystemStats
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&stats.TotalUsers); err != nil {
		return nil, err
	}
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM users WHERE rol = 'monitor'").Scan(&stats.TotalMonitors); err != nil {
		return nil, err
	}
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM bookings").Scan(&stats.TotalBookings); err != nil {
		return nil, err
	}
	if err := r.pool.QueryRow(ctx, "SELECT COUNT(*) FROM offers").Scan(&stats.TotalOffers); err != nil {
		return nil, err
	}
	return &stats, nil
}
