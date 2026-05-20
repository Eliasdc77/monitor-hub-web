package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"monitor-hub-api/internal/services"
	"monitor-hub-api/pkg/response"
)

const UserIDKey = "userID"
const UserRolKey = "userRol"
const UserEmailKey = "userEmail"

// Auth validates the Bearer JWT token in the Authorization header.
func Auth(authSvc *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Unauthorized(c, "Token requerido.")
			return
		}

		token := strings.TrimPrefix(header, "Bearer ")
		claims, err := authSvc.ValidateToken(token)
		if err != nil {
			response.Unauthorized(c, "Token inválido o expirado.")
			return
		}

		c.Set(UserIDKey, claims.UserID)
		c.Set(UserRolKey, claims.Rol)
		c.Set(UserEmailKey, claims.Email)
		c.Next()
	}
}

// RequireRol restricts access to users with a specific role.
func RequireRol(rol string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRol, _ := c.Get(UserRolKey)
		if userRol != rol {
			response.Forbidden(c, "No tienes permisos para esta acción.")
			return
		}
		c.Next()
	}
}
