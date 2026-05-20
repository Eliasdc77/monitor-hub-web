package handlers

import (
	"context"
	"strconv"

	"github.com/gin-gonic/gin"
	"monitor-hub-api/internal/services"
	"monitor-hub-api/pkg/response"
)

type AdminHandler struct {
	svc *services.AdminService
}

func NewAdminHandler(svc *services.AdminService) *AdminHandler {
	return &AdminHandler{svc: svc}
}

// GET /api/admin/users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	users, err := h.svc.ListAllUsers(context.Background())
	if err != nil {
		response.InternalError(c, "Error al obtener usuarios.")
		return
	}
	response.OK(c, gin.H{"ok": true, "users": users})
}

// PATCH /api/admin/users/:id/role
func (h *AdminHandler) UpdateUserRole(c *gin.Context) {
	userID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID de usuario inválido.")
		return
	}
	var body struct {
		Rol string `json:"rol" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "Falta el campo 'rol'.")
		return
	}
	if err := h.svc.UpdateUserRole(context.Background(), userID, body.Rol); err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, gin.H{"ok": true, "message": "Rol actualizado."})
}

// GET /api/admin/stats
func (h *AdminHandler) GetStats(c *gin.Context) {
	stats, err := h.svc.GetSystemStats(context.Background())
	if err != nil {
		response.InternalError(c, "Error al obtener estadísticas.")
		return
	}
	response.OK(c, gin.H{"ok": true, "stats": stats})
}
