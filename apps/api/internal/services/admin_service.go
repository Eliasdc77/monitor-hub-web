package services

import (
	"context"
	"fmt"

	"monitor-hub-api/internal/models"
	"monitor-hub-api/internal/repository"
)

type AdminService struct {
	users *repository.UserRepository
	admin *repository.AdminRepository
}

func NewAdminService(users *repository.UserRepository, admin *repository.AdminRepository) *AdminService {
	return &AdminService{users: users, admin: admin}
}

func (s *AdminService) ListAllUsers(ctx context.Context) ([]models.User, error) {
	return s.users.FindAll(ctx)
}

func (s *AdminService) UpdateUserRole(ctx context.Context, userID int, newRole string) error {
	if newRole != "estudiante" && newRole != "monitor" && newRole != "admin" {
		return fmt.Errorf("rol inválido")
	}
	return s.users.UpdateRole(ctx, userID, newRole)
}

func (s *AdminService) GetSystemStats(ctx context.Context) (*repository.SystemStats, error) {
	return s.admin.GetStats(ctx)
}
