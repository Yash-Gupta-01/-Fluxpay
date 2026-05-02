package common

import (
	"encoding/json"
	"errors"
	"net/http"
)

// Response represents a standard API response
type Response struct {
	Success bool        `json:"success"`
	Code    string      `json:"code,omitempty"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
}

// ValidationError represents a validation error response
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// writeJSON writes a JSON response
func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// OK sends a 200 OK response with data
func OK(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusOK, Response{
		Success: true,
		Data:    data,
	})
}

// Created sends a 201 Created response with data
func Created(w http.ResponseWriter, data interface{}) {
	writeJSON(w, http.StatusCreated, Response{
		Success: true,
		Data:    data,
	})
}

// BadRequest sends a 400 Bad Request response
func BadRequest(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusBadRequest, Response{
		Success: false,
		Code:    "BAD_REQUEST",
		Message: message,
	})
}

// ValidationErrors sends a 400 response with validation errors
func ValidationErrors(w http.ResponseWriter, errors []ValidationError) {
	writeJSON(w, http.StatusBadRequest, Response{
		Success: false,
		Code:    "VALIDATION_ERROR",
		Message: "Validation failed",
		Error:   errors,
	})
}

// Unauthorized sends a 401 Unauthorized response
func Unauthorized(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusUnauthorized, Response{
		Success: false,
		Code:    "UNAUTHORIZED",
		Message: message,
	})
}

// Forbidden sends a 403 Forbidden response
func Forbidden(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusForbidden, Response{
		Success: false,
		Code:    "FORBIDDEN",
		Message: message,
	})
}

// NotFound sends a 404 Not Found response
func NotFound(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusNotFound, Response{
		Success: false,
		Code:    "NOT_FOUND",
		Message: message,
	})
}

// Conflict sends a 409 Conflict response
func Conflict(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusConflict, Response{
		Success: false,
		Code:    "CONFLICT",
		Message: message,
	})
}

// InternalServerError sends a 500 Internal Server Error response
func InternalServerError(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusInternalServerError, Response{
		Success: false,
		Code:    "INTERNAL_SERVER_ERROR",
		Message: message,
	})
}

// HandleServiceError handles service layer errors and sends appropriate HTTP response
func HandleServiceError(w http.ResponseWriter, err error) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		writeJSON(w, appErr.Status, Response{
			Success: false,
			Code:    appErr.Code,
			Message: appErr.Message,
		})
		return
	}

	// Default to internal server error
	InternalServerError(w, "An unexpected error occurred")
}
