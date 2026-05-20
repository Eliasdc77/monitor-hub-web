package handlers

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"monitor-hub-api/internal/middleware"
	"monitor-hub-api/internal/models"
	"monitor-hub-api/internal/services"
	"monitor-hub-api/pkg/response"
)

type AuthHandler struct {
	svc         *services.AuthService
	frontendURL string
}

func NewAuthHandler(svc *services.AuthService, frontendURL string) *AuthHandler {
	frontendURL = strings.TrimRight(strings.TrimSpace(frontendURL), "/")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}
	return &AuthHandler{svc: svc, frontendURL: frontendURL}
}

const oauthStateCookie = "mhub_oauth_state"

// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var in models.RegisterInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "Completa todos los campos requeridos correctamente.")
		return
	}

	user, token, err := h.svc.Register(context.Background(), &in)
	if err != nil {
		if err.Error() == "ese correo ya está registrado" {
			response.Conflict(c, err.Error())
			return
		}
		response.InternalError(c, "Error al registrar usuario.")
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":    true,
		"user":  user,
		"token": token,
	})
}

// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var in models.LoginInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "Ingresa tu correo y contraseña.")
		return
	}

	user, token, err := h.svc.Login(context.Background(), &in)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}

	response.OK(c, gin.H{
		"ok":    true,
		"user":  user,
		"token": token,
	})
}

// GET /api/auth/google
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	state, err := newOAuthState()
	if err != nil {
		response.InternalError(c, "No se pudo iniciar el login con Google.")
		return
	}

	urlStr, err := h.svc.GetGoogleAuthURL(state)
	if err != nil {
		response.InternalError(c, err.Error())
		return
	}

	c.SetCookie(oauthStateCookie, state, 300, "/", "", false, true)
	c.Redirect(http.StatusFound, urlStr)
}

// GET /api/auth/google/callback
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	if errParam := c.Query("error"); errParam != "" {
		h.redirectWithError(c, errParam)
		return
	}

	state := c.Query("state")
	code := c.Query("code")
	stateCookie, _ := c.Cookie(oauthStateCookie)

	if state == "" || code == "" || stateCookie == "" || stateCookie != state {
		h.redirectWithError(c, "estado oauth invalido")
		return
	}

	// Clear state cookie
	c.SetCookie(oauthStateCookie, "", -1, "/", "", false, true)

	_, token, err := h.svc.HandleGoogleCallback(context.Background(), code)
	if err != nil {
		h.redirectWithError(c, err.Error())
		return
	}

	redirectURL := fmt.Sprintf("%s/login?token=%s", h.frontendURL, url.QueryEscape(token))
	c.Redirect(http.StatusFound, redirectURL)
}

// GET /api/auth/me (protected)
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	uid, ok := userID.(int)
	if !ok {
		response.Unauthorized(c, "Sesión inválida.")
		return
	}

	user, err := h.svc.GetUserByID(context.Background(), uid)
	if err != nil {
		response.NotFound(c, "Usuario no encontrado.")
		return
	}

	response.OK(c, gin.H{"ok": true, "user": user})
}

// PATCH /api/auth/me (protected)
func (h *AuthHandler) UpdateMe(c *gin.Context) {
	userID, _ := c.Get(middleware.UserIDKey)
	uid, _ := userID.(int)

	var in models.UpdateProfileInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "Datos inválidos.")
		return
	}

	user, err := h.svc.UpdateProfile(context.Background(), uid, &in)
	if err != nil {
		response.InternalError(c, "No se pudo actualizar el perfil.")
		return
	}

	response.OK(c, gin.H{"ok": true, "user": user})
}

func (h *AuthHandler) redirectWithError(c *gin.Context, message string) {
	redirectURL := fmt.Sprintf("%s/login?error=%s", h.frontendURL, url.QueryEscape(message))
	c.Redirect(http.StatusFound, redirectURL)
}

func newOAuthState() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}
