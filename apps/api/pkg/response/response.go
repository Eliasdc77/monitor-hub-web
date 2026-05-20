package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// OK sends a 200 JSON response.
func OK(c *gin.Context, data gin.H) {
	c.JSON(http.StatusOK, data)
}

// Created sends a 201 JSON response.
func Created(c *gin.Context, data gin.H) {
	c.JSON(http.StatusCreated, data)
}

// Err sends an error JSON response with the given status code.
func Err(c *gin.Context, status int, message string) {
	c.AbortWithStatusJSON(status, gin.H{"ok": false, "message": message})
}

// BadRequest sends a 400 response.
func BadRequest(c *gin.Context, message string) {
	Err(c, http.StatusBadRequest, message)
}

// Unauthorized sends a 401 response.
func Unauthorized(c *gin.Context, message string) {
	Err(c, http.StatusUnauthorized, message)
}

// Forbidden sends a 403 response.
func Forbidden(c *gin.Context, message string) {
	Err(c, http.StatusForbidden, message)
}

// NotFound sends a 404 response.
func NotFound(c *gin.Context, message string) {
	Err(c, http.StatusNotFound, message)
}

// Conflict sends a 409 response.
func Conflict(c *gin.Context, message string) {
	Err(c, http.StatusConflict, message)
}

// InternalError sends a 500 response.
func InternalError(c *gin.Context, message string) {
	Err(c, http.StatusInternalServerError, message)
}
