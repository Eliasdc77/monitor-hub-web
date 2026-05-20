package services

import (
	"context"
	"fmt"
	"log"

	"monitor-hub-api/internal/models"
	"monitor-hub-api/internal/repository"
)

type TutoringService struct {
	offers        *repository.OfferRepository
	bookings      *repository.BookingRepository
	notifications *NotificationService
}

func NewTutoringService(offers *repository.OfferRepository, bookings *repository.BookingRepository, notifications *NotificationService) *TutoringService {
	return &TutoringService{offers: offers, bookings: bookings, notifications: notifications}
}

// ─── Offers ────────────────────────────────────────────────────────────────

func (s *TutoringService) ListOffers(ctx context.Context) ([]models.Offer, error) {
	return s.offers.FindAll(ctx)
}

func (s *TutoringService) GetMyOffers(ctx context.Context, tutorID int) ([]models.Offer, error) {
	return s.offers.FindByTutorID(ctx, tutorID)
}

func (s *TutoringService) CreateOffer(ctx context.Context, tutorID int, in *models.CreateOfferInput) (*models.Offer, error) {
	return s.offers.Create(ctx, tutorID, in)
}

func (s *TutoringService) DeactivateOffer(ctx context.Context, offerID, tutorID int) error {
	return s.offers.Deactivate(ctx, offerID, tutorID)
}

// ─── Bookings ──────────────────────────────────────────────────────────────

func (s *TutoringService) CreateBooking(ctx context.Context, estudianteID int, in *models.CreateBookingInput) (*models.Booking, error) {
	// Verificar que la oferta existe y está activa
	offer, err := s.offers.FindByID(ctx, in.OfferID)
	if err != nil || !offer.Activa {
		return nil, fmt.Errorf("oferta no encontrada o no disponible")
	}
	// Evitar que el tutor se reserve a sí mismo
	if offer.TutorID == estudianteID {
		return nil, fmt.Errorf("no puedes reservar tu propia tutoría")
	}
	booking, err := s.bookings.Create(ctx, estudianteID, in)
	if err != nil {
		return nil, err
	}
	if s.notifications != nil {
		if err := s.notifications.SendBookingCreated(ctx, booking.ID); err != nil {
			log.Printf("notification error: %v", err)
		}
	}
	return booking, nil
}

func (s *TutoringService) GetMyBookings(ctx context.Context, estudianteID int) ([]models.Booking, error) {
	return s.bookings.FindByEstudiante(ctx, estudianteID)
}

func (s *TutoringService) GetIncomingBookings(ctx context.Context, tutorID int) ([]models.Booking, error) {
	return s.bookings.FindByTutor(ctx, tutorID)
}

func (s *TutoringService) UpdateBookingEstado(ctx context.Context, bookingID int, estado string) (*models.Booking, error) {
	valid := map[string]bool{
		"pendiente": true, "confirmada": true,
		"completada": true, "cancelada": true,
	}
	if !valid[estado] {
		return nil, fmt.Errorf("estado inválido: %s", estado)
	}
	booking, err := s.bookings.UpdateEstado(ctx, bookingID, estado)
	if err != nil {
		return nil, err
	}
	if s.notifications != nil {
		if err := s.notifications.SendBookingStatusUpdated(ctx, booking.ID); err != nil {
			log.Printf("notification error: %v", err)
		}
	}
	return booking, nil
}
