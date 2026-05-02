package common

import (
	"errors"
)

// AppError represents an application-level error with context
type AppError struct {
	Code    string
	Message string
	Err     error
	Status  int
}

// Error implements the error interface
func (e *AppError) Error() string {
	if e.Err != nil {
		return e.Message + ": " + e.Err.Error()
	}
	return e.Message
}

// Unwrap returns the underlying error for error.Is/As compatibility
func (e *AppError) Unwrap() error {
	return e.Err
}

// Common error types
var (
	ErrInvalidRequest   = &AppError{Code: "INVALID_REQUEST", Message: "Invalid request", Status: 400}
	ErrValidation       = &AppError{Code: "VALIDATION_ERROR", Message: "Validation failed", Status: 400}
	ErrUnauthorized     = &AppError{Code: "UNAUTHORIZED", Message: "Unauthorized", Status: 401}
	ErrForbidden        = &AppError{Code: "FORBIDDEN", Message: "Forbidden", Status: 403}
	ErrNotFound         = &AppError{Code: "NOT_FOUND", Message: "Not found", Status: 404}
	ErrConflict         = &AppError{Code: "CONFLICT", Message: "Conflict", Status: 409}
	ErrInternalServer   = &AppError{Code: "INTERNAL_SERVER_ERROR", Message: "Internal server error", Status: 500}
)

// NewAppError creates a new application error
func NewAppError(code, message string, status int, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
		Status:  status,
	}
}

// GetStatus returns the HTTP status code for an error
func GetStatus(err error) int {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Status
	}
	return 500
}

// GetCode returns the error code
func GetCode(err error) string {
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr.Code
	}
	return "INTERNAL_SERVER_ERROR"
}
