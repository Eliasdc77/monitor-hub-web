package handlers

import (
	"context"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"monitor-hub-api/internal/middleware"
	"monitor-hub-api/internal/models"
	"monitor-hub-api/internal/services"
	"monitor-hub-api/pkg/response"
)

type TutoringHandler struct {
	svc *services.TutoringService
}

func NewTutoringHandler(svc *services.TutoringService) *TutoringHandler {
	return &TutoringHandler{svc: svc}
}

// GET /api/offers
func (h *TutoringHandler) ListOffers(c *gin.Context) {
	offers, err := h.svc.ListOffers(context.Background())
	if err != nil {
		response.InternalError(c, "Error al obtener ofertas.")
		return
	}
	response.OK(c, gin.H{"ok": true, "offers": offers})
}

// GET /api/offers/mine (protected)
func (h *TutoringHandler) MyOffers(c *gin.Context) {
	uid := mustUID(c)
	offers, err := h.svc.GetMyOffers(context.Background(), uid)
	if err != nil {
		response.InternalError(c, "Error al obtener tus ofertas.")
		return
	}
	response.OK(c, gin.H{"ok": true, "offers": offers})
}

// POST /api/offers (protected, monitor/admin)
func (h *TutoringHandler) CreateOffer(c *gin.Context) {
	uid := mustUID(c)
	var in models.CreateOfferInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "Completa materia, tarifa y modalidad.")
		return
	}
	offer, err := h.svc.CreateOffer(context.Background(), uid, &in)
	if err != nil {
		response.InternalError(c, "No se pudo crear la oferta.")
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true, "offer": offer})
}

// DELETE /api/offers/:id (protected)
func (h *TutoringHandler) DeactivateOffer(c *gin.Context) {
	uid := mustUID(c)
	offerID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID de oferta inválido.")
		return
	}
	if err := h.svc.DeactivateOffer(context.Background(), offerID, uid); err != nil {
		response.NotFound(c, "Oferta no encontrada.")
		return
	}
	response.OK(c, gin.H{"ok": true, "message": "Oferta desactivada."})
}

// GET /api/bookings/mine (protected)
func (h *TutoringHandler) MyBookings(c *gin.Context) {
	uid := mustUID(c)
	bookings, err := h.svc.GetMyBookings(context.Background(), uid)
	if err != nil {
		response.InternalError(c, "Error al obtener tus reservas.")
		return
	}
	response.OK(c, gin.H{"ok": true, "bookings": bookings})
}

// GET /api/bookings/incoming (protected, monitor)
func (h *TutoringHandler) IncomingBookings(c *gin.Context) {
	uid := mustUID(c)
	bookings, err := h.svc.GetIncomingBookings(context.Background(), uid)
	if err != nil {
		response.InternalError(c, "Error al obtener reservas entrantes.")
		return
	}
	response.OK(c, gin.H{"ok": true, "bookings": bookings})
}

// POST /api/bookings (protected)
func (h *TutoringHandler) CreateBooking(c *gin.Context) {
	uid := mustUID(c)
	var in models.CreateBookingInput
	if err := c.ShouldBindJSON(&in); err != nil {
		response.BadRequest(c, "Completa offer_id, fecha, hora y modalidad.")
		return
	}
	booking, err := h.svc.CreateBooking(context.Background(), uid, &in)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	c.JSON(http.StatusCreated, gin.H{"ok": true, "booking": booking})
}

// PATCH /api/bookings/:id/estado (protected)
func (h *TutoringHandler) UpdateBookingEstado(c *gin.Context) {
	bookingID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		response.BadRequest(c, "ID inválido.")
		return
	}
	var body struct {
		Estado string `json:"estado" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.BadRequest(c, "Falta el campo 'estado'.")
		return
	}
	booking, err := h.svc.UpdateBookingEstado(context.Background(), bookingID, body.Estado)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}
	response.OK(c, gin.H{"ok": true, "booking": booking})
}

func mustUID(c *gin.Context) int {
	uid, _ := c.Get(middleware.UserIDKey)
	id, _ := uid.(int)
	return id
}
