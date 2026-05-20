package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"monitor-hub-api/internal/config"
	"monitor-hub-api/internal/database"
	"monitor-hub-api/internal/handlers"
	"monitor-hub-api/internal/middleware"
	"monitor-hub-api/internal/repository"
	"monitor-hub-api/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Error de configuración: %v", err)
	}

	// ── Base de datos ──────────────────────────────────────────
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := database.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("No se pudo conectar a la BD: %v", err)
	}
	defer pool.Close()
	log.Println("✅ Conectado a PostgreSQL")

	// ── Repositorios ───────────────────────────────────────────
	userRepo := repository.NewUserRepository(pool)
	offerRepo := repository.NewOfferRepository(pool)
	bookingRepo := repository.NewBookingRepository(pool)
	adminRepo := repository.NewAdminRepository(pool)
	notificationRepo := repository.NewNotificationRepository(pool)

	// ── Servicios ──────────────────────────────────────────────
	var googleConfig *oauth2.Config
	if cfg.GoogleClientID != "" && cfg.GoogleClientSecret != "" {
		googleConfig = &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
			Scopes:       []string{"openid", "email", "profile"},
			Endpoint:     google.Endpoint,
		}
	}

	mailSender, err := services.NewSMTPMailSender(
		cfg.MailHost,
		cfg.MailPort,
		cfg.MailUsername,
		cfg.MailPassword,
		cfg.MailFrom,
	)
	if err != nil {
		log.Printf("Aviso mail: %v", err)
	}

	notificationsSvc := services.NewNotificationService(notificationRepo, bookingRepo, mailSender)
	authSvc := services.NewAuthService(userRepo, cfg.JWTSecret, googleConfig, cfg.GoogleAllowedDomain)
	tutoringsSvc := services.NewTutoringService(offerRepo, bookingRepo, notificationsSvc)
	adminSvc := services.NewAdminService(userRepo, adminRepo)

	// ── Handlers ───────────────────────────────────────────────
	authH := handlers.NewAuthHandler(authSvc, cfg.FrontendURL)
	tutoringH := handlers.NewTutoringHandler(tutoringsSvc)
	adminH := handlers.NewAdminHandler(adminSvc)

	// ── Router ─────────────────────────────────────────────────
	if cfg.Environment == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())

	// CORS
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	// ── Routes ─────────────────────────────────────────────────
	api := r.Group("/api")
	{
		api.GET("/health", handlers.Health)

		auth := api.Group("/auth")
		{
			auth.POST("/register", authH.Register)
			auth.POST("/login", authH.Login)
			auth.GET("/google", authH.GoogleLogin)
			auth.GET("/google/callback", authH.GoogleCallback)
			auth.GET("/me", middleware.Auth(authSvc), authH.Me)
			auth.PATCH("/me", middleware.Auth(authSvc), authH.UpdateMe)
		}

		offers := api.Group("/offers")
		{
			offers.GET("", tutoringH.ListOffers)
			offers.GET("/mine", middleware.Auth(authSvc), tutoringH.MyOffers)
			offers.POST("", middleware.Auth(authSvc), tutoringH.CreateOffer)
			offers.DELETE("/:id", middleware.Auth(authSvc), tutoringH.DeactivateOffer)
		}

		bookings := api.Group("/bookings")
		bookings.Use(middleware.Auth(authSvc))
		{
			bookings.GET("/mine", tutoringH.MyBookings)
			bookings.GET("/incoming", tutoringH.IncomingBookings)
			bookings.POST("", tutoringH.CreateBooking)
			bookings.PATCH("/:id/estado", tutoringH.UpdateBookingEstado)
		}

		adminGroup := api.Group("/admin")
		adminGroup.Use(middleware.Auth(authSvc), middleware.RequireRol("admin"))
		{
			adminGroup.GET("/users", adminH.ListUsers)
			adminGroup.PATCH("/users/:id/role", adminH.UpdateUserRole)
			adminGroup.GET("/stats", adminH.GetStats)
		}
	}

	// ── Start ──────────────────────────────────────────────────
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("🚀 Monitor-HUB API escuchando en %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Error al iniciar servidor: %v", err)
	}
}
