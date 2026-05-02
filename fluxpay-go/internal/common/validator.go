package common

import (
	"context"
	"fmt"

	"github.com/go-playground/validator/v10"
)

// Validator wraps the validator.Validate for dependency injection
type Validator struct {
	validator *validator.Validate
}

// NewValidator creates a new validator instance
func NewValidator() *Validator {
	return &Validator{
		validator: validator.New(),
	}
}

// Struct validates a struct and returns a list of validation errors
func (v *Validator) Struct(s interface{}) []ValidationError {
	err := v.validator.Struct(s)
	if err == nil {
		return nil
	}

	var errors []ValidationError
	for _, err := range err.(validator.ValidationErrors) {
		errors = append(errors, ValidationError{
			Field:   err.StructField(),
			Message: fmt.Sprintf("field validation failed for '%s' on tag '%s'", err.StructField(), err.Tag()),
		})
	}
	return errors
}

// ValidatorKey is used for context injection
type ValidatorKey struct{}

// WithValidator injects validator into context
func WithValidator(ctx context.Context, v *Validator) context.Context {
	return context.WithValue(ctx, ValidatorKey{}, v)
}

// GetValidator retrieves validator from context
func GetValidator(ctx context.Context) *Validator {
	v, ok := ctx.Value(ValidatorKey{}).(*Validator)
	if !ok {
		return NewValidator()
	}
	return v
}
