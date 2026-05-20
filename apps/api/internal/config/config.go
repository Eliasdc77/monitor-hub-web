package config

import (
	"fmt"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	Environment string

	GoogleClientID      string
	GoogleClientSecret  string
	GoogleRedirectURL   string
	GoogleAllowedDomain string
	FrontendURL         string

	MailHost     string
	MailPort     string
	MailUsername string
	MailPassword string
	MailFrom     string
}

func Load() (*Config, error) {
	// Intentar cargar .env si existe (desarrollo local)
	_ = godotenv.Load()

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL no está definido")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "change-this-secret-in-production"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		env = "development"
	}

	googleRedirectURL := os.Getenv("GOOGLE_REDIRECT_URL")
	if googleRedirectURL == "" {
		googleRedirectURL = "http://localhost:8080/api/auth/google/callback"
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	googleAllowedDomain, ok := os.LookupEnv("GOOGLE_ALLOWED_DOMAIN")
	if !ok {
		googleAllowedDomain = "unimagdalena.edu.co"
	}
	googleAllowedDomain = strings.TrimSpace(googleAllowedDomain)
	if strings.EqualFold(googleAllowedDomain, "any") || googleAllowedDomain == "*" {
		googleAllowedDomain = ""
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		JWTSecret:   jwtSecret,
		Environment: env,

		GoogleClientID:      os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret:  os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:   googleRedirectURL,
		GoogleAllowedDomain: googleAllowedDomain,
		FrontendURL:         frontendURL,

		MailHost:     os.Getenv("MAILTRAP_HOST"),
		MailPort:     os.Getenv("MAILTRAP_PORT"),
		MailUsername: os.Getenv("MAILTRAP_USERNAME"),
		MailPassword: os.Getenv("MAILTRAP_PASSWORD"),
		MailFrom:     os.Getenv("MAILTRAP_FROM"),
	}, nil
}
