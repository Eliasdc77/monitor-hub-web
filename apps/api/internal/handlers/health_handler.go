package handlers

import (
	"github.com/gin-gonic/gin"
	"monitor-hub-api/pkg/response"
)

// Health godoc
// @Summary Health check endpoint
// @Tags system
func Health(c *gin.Context) {
	response.OK(c, gin.H{
		"ok":      true,
		"service": "monitor-hub-api",
	})
}
