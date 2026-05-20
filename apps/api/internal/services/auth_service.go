package services

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"monitor-hub-api/internal/models"
	"monitor-hub-api/internal/repository"
)

type AuthService struct {
	users               *repository.UserRepository
	jwtSecret           []byte
	googleConfig        *oauth2.Config
	googleAllowedDomain string
}

func NewAuthService(users *repository.UserRepository, jwtSecret string, googleConfig *oauth2.Config, googleAllowedDomain string) *AuthService {
	return &AuthService{
		users:               users,
		jwtSecret:           []byte(jwtSecret),
		googleConfig:        googleConfig,
		googleAllowedDomain: normalizeDomain(googleAllowedDomain),
	}
}

type TokenClaims struct {
	jwt.RegisteredClaims
	UserID int    `json:"uid"`
	Email  string `json:"email"`
	Rol    string `json:"rol"`
}

type googleUserInfo struct {
	Email         string `json:"email"`
	EmailVerified *bool  `json:"email_verified"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

func (s *AuthService) Register(ctx context.Context, in *models.RegisterInput) (*models.User, string, error) {
	in.Nombre = strings.TrimSpace(in.Nombre)
	in.Programa = strings.TrimSpace(in.Programa)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))

	exists, err := s.users.EmailExists(ctx, in.Email)
	if err != nil {
		return nil, "", fmt.Errorf("verificar email: %w", err)
	}
	if exists {
		return nil, "", fmt.Errorf("ese correo ya está registrado")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("hash de contraseña: %w", err)
	}

	user, err := s.users.Create(ctx, in.Nombre, in.Programa, in.Email, string(hash))
	if err != nil {
		return nil, "", fmt.Errorf("crear usuario: %w", err)
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) Login(ctx context.Context, in *models.LoginInput) (*models.User, string, error) {
	email := strings.ToLower(strings.TrimSpace(in.Email))

	user, hash, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		return nil, "", fmt.Errorf("credenciales incorrectas")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)); err != nil {
		return nil, "", fmt.Errorf("credenciales incorrectas")
	}

	token, err := s.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, token, nil
}

func (s *AuthService) GetGoogleAuthURL(state string) (string, error) {
	if s.googleConfig == nil {
		return "", fmt.Errorf("google oauth no configurado")
	}
	return s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOnline), nil
}

func (s *AuthService) HandleGoogleCallback(ctx context.Context, code string) (*models.User, string, error) {
	if s.googleConfig == nil {
		return nil, "", fmt.Errorf("google oauth no configurado")
	}
	if strings.TrimSpace(code) == "" {
		return nil, "", fmt.Errorf("codigo de autorizacion invalido")
	}

	token, err := s.googleConfig.Exchange(ctx, code)
	if err != nil {
		return nil, "", fmt.Errorf("intercambio de codigo oauth: %w", err)
	}

	info, err := s.fetchGoogleUserInfo(ctx, token)
	if err != nil {
		return nil, "", err
	}

	if info.Email == "" {
		return nil, "", fmt.Errorf("email no disponible en google")
	}

	if info.EmailVerified != nil && !*info.EmailVerified {
		return nil, "", fmt.Errorf("email no verificado en google")
	}

	if s.googleAllowedDomain != "" {
		email := strings.ToLower(strings.TrimSpace(info.Email))
		suffix := "@" + s.googleAllowedDomain
		if !strings.HasSuffix(email, suffix) {
			return nil, "", fmt.Errorf("solo se permite correo institucional")
		}
	}

	email := strings.ToLower(strings.TrimSpace(info.Email))
	user, _, err := s.users.FindByEmail(ctx, email)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return nil, "", fmt.Errorf("buscar usuario: %w", err)
		}

		nombre := strings.TrimSpace(info.Name)
		if nombre == "" {
			nombre = strings.TrimSpace(info.GivenName + " " + info.FamilyName)
		}
		if nombre == "" {
			parts := strings.Split(email, "@")
			if len(parts) > 0 {
				nombre = parts[0]
			}
		}
		if nombre == "" {
			nombre = "Usuario"
		}

		programa := "No especificado"

		secret, err := randomString(24)
		if err != nil {
			return nil, "", fmt.Errorf("generar secreto oauth: %w", err)
		}
		hash, err := bcrypt.GenerateFromPassword([]byte(secret), bcrypt.DefaultCost)
		if err != nil {
			return nil, "", fmt.Errorf("hash oauth: %w", err)
		}

		var avatarURL *string
		if strings.TrimSpace(info.Picture) != "" {
			v := strings.TrimSpace(info.Picture)
			avatarURL = &v
		}

		user, err = s.users.CreateOAuthUser(ctx, nombre, programa, email, string(hash), avatarURL)
		if err != nil {
			return nil, "", fmt.Errorf("crear usuario oauth: %w", err)
		}
	} else if strings.TrimSpace(info.Picture) != "" {
		_ = s.users.UpdateAvatarURL(ctx, user.ID, strings.TrimSpace(info.Picture))
	}

	jwtToken, err := s.generateToken(user)
	if err != nil {
		return nil, "", err
	}

	return user, jwtToken, nil
}

func (s *AuthService) fetchGoogleUserInfo(ctx context.Context, token *oauth2.Token) (*googleUserInfo, error) {
	client := s.googleConfig.Client(ctx, token)
	resp, err := client.Get("https://openidconnect.googleapis.com/v1/userinfo")
	if err != nil {
		return nil, fmt.Errorf("consultar perfil google: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("respuesta invalida de google: %s", resp.Status)
	}
	var info googleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, fmt.Errorf("decodificar perfil google: %w", err)
	}
	return &info, nil
}

func (s *AuthService) ValidateToken(tokenStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado")
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("token inválido o expirado")
	}
	claims, ok := token.Claims.(*TokenClaims)
	if !ok {
		return nil, fmt.Errorf("claims inválidos")
	}
	return claims, nil
}

func (s *AuthService) GetUserByID(ctx context.Context, id int) (*models.User, error) {
	return s.users.FindByID(ctx, id)
}

func (s *AuthService) UpdateProfile(ctx context.Context, id int, in *models.UpdateProfileInput) (*models.User, error) {
	return s.users.UpdateProfile(ctx, id, in)
}

func (s *AuthService) generateToken(user *models.User) (string, error) {
	claims := &TokenClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
		UserID: user.ID,
		Email:  user.Email,
		Rol:    user.Rol,
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(s.jwtSecret)
}

func randomString(size int) (string, error) {
	b := make([]byte, size)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func normalizeDomain(domain string) string {
	domain = strings.ToLower(strings.TrimSpace(domain))
	domain = strings.TrimPrefix(domain, "@")
	return domain
}
