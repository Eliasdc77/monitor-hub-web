package services

import (
	"context"
	"fmt"
	"log"
	"strings"

	"monitor-hub-api/internal/models"
	"monitor-hub-api/internal/repository"
)

type NotificationService struct {
	repo       *repository.NotificationRepository
	bookings   *repository.BookingRepository
	mailSender MailSender
}

func NewNotificationService(repo *repository.NotificationRepository, bookings *repository.BookingRepository, mailSender MailSender) *NotificationService {
	return &NotificationService{repo: repo, bookings: bookings, mailSender: mailSender}
}

func (s *NotificationService) SendBookingCreated(ctx context.Context, bookingID int) error {
	info, err := s.bookings.GetNotificationData(ctx, bookingID)
	if err != nil {
		return err
	}

	when := fmt.Sprintf("%s %s", info.Fecha, info.Hora)
	studentTitle := "Reserva creada"
	studentMsg := fmt.Sprintf("Tu solicitud para %s con %s el %s (%s) esta pendiente de confirmacion.", info.Materia, info.TutorNombre, when, info.Modalidad)
	tutorTitle := "Nueva reserva"
	tutorMsg := fmt.Sprintf("Nueva solicitud de %s para %s el %s (%s).", info.EstudianteNombre, info.Materia, when, info.Modalidad)

	var firstErr error
	if err := s.createAndSend(ctx, info.EstudianteID, "booking_new", studentTitle, studentMsg, info.EstudianteEmail, bookingID); err != nil && firstErr == nil {
		firstErr = err
	}
	if err := s.createAndSend(ctx, info.TutorID, "booking_new", tutorTitle, tutorMsg, info.TutorEmail, bookingID); err != nil && firstErr == nil {
		firstErr = err
	}
	return firstErr
}

func (s *NotificationService) SendBookingStatusUpdated(ctx context.Context, bookingID int) error {
	info, err := s.bookings.GetNotificationData(ctx, bookingID)
	if err != nil {
		return err
	}

	notifType, studentTitle, tutorTitle := bookingStatusTitles(info.Estado)
	if notifType == "" {
		return nil
	}

	when := fmt.Sprintf("%s %s", info.Fecha, info.Hora)
	studentMsg := fmt.Sprintf("Tu reserva para %s con %s el %s fue %s.", info.Materia, info.TutorNombre, when, info.Estado)
	tutorMsg := fmt.Sprintf("La reserva de %s para %s el %s fue %s.", info.EstudianteNombre, info.Materia, when, info.Estado)

	var firstErr error
	if err := s.createAndSend(ctx, info.EstudianteID, notifType, studentTitle, studentMsg, info.EstudianteEmail, bookingID); err != nil && firstErr == nil {
		firstErr = err
	}
	if err := s.createAndSend(ctx, info.TutorID, notifType, tutorTitle, tutorMsg, info.TutorEmail, bookingID); err != nil && firstErr == nil {
		firstErr = err
	}
	return firstErr
}

func bookingStatusTitles(estado string) (string, string, string) {
	estado = strings.ToLower(strings.TrimSpace(estado))
	switch estado {
	case "confirmada":
		return "booking_confirmed", "Reserva confirmada", "Reserva confirmada"
	case "cancelada":
		return "booking_cancelled", "Reserva cancelada", "Reserva cancelada"
	case "completada":
		return "booking_completed", "Reserva completada", "Reserva completada"
	default:
		return "", "", ""
	}
}

func (s *NotificationService) createAndSend(ctx context.Context, userID int, notifType, title, message, email string, refID int) error {
	n := &models.Notification{
		UserID:       userID,
		Tipo:         notifType,
		Titulo:       title,
		Mensaje:      &message,
		ReferenciaID: &refID,
		Leida:        false,
	}

	if err := s.repo.Create(ctx, n); err != nil {
		return err
	}

	if s.mailSender == nil {
		return nil
	}

	if err := s.mailSender.Send(email, title, message); err != nil {
		log.Printf("email error: %v", err)
		return err
	}

	return nil
}
