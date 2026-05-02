package common

import (
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config holds application configuration
type Config struct {
	// Server
	Port     int
	Env      string
	LogLevel string

	// Database
	DatabaseURL       string
	DBMaxConns        int32
	DBMinIdleConns    int32
	DBMaxConnIdleTime time.Duration

	// Redis
	RedisURL string

	// JWT
	JWTAccessTokenSecret  string
	JWTRefreshTokenSecret string
	JWTAccessTokenTTL     time.Duration
	JWTRefreshTokenTTL    time.Duration

	// Kafka
	KafkaBrokers       []string
	KafkaConsumerGroup string

	// Features
	AdminEnabled bool
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("PORT", 8080)
	viper.SetDefault("ENV", "development")
	viper.SetDefault("LOG_LEVEL", "info")
	viper.SetDefault("DB_MAX_CONNS", 25)
	viper.SetDefault("DB_MIN_IDLE_CONNS", 5)
	viper.SetDefault("DB_MAX_CONN_IDLE_TIME", "5m")
	viper.SetDefault("JWT_ACCESS_TOKEN_TTL", "15m")
	viper.SetDefault("JWT_REFRESH_TOKEN_TTL", "168h")
	viper.SetDefault("ADMIN_ENABLED", true)

	accessTokenTTL, err := time.ParseDuration(viper.GetString("JWT_ACCESS_TOKEN_TTL"))
	if err != nil {
		accessTokenTTL = 15 * time.Minute
	}

	refreshTokenTTL, err := time.ParseDuration(viper.GetString("JWT_REFRESH_TOKEN_TTL"))
	if err != nil {
		refreshTokenTTL = 7 * 24 * time.Hour
	}

	maxIdleTime, err := time.ParseDuration(viper.GetString("DB_MAX_CONN_IDLE_TIME"))
	if err != nil {
		maxIdleTime = 5 * time.Minute
	}

	return &Config{
		Port:                  viper.GetInt("PORT"),
		Env:                   viper.GetString("ENV"),
		LogLevel:              viper.GetString("LOG_LEVEL"),
		DatabaseURL:           viper.GetString("DATABASE_URL"),
		DBMaxConns:            int32(viper.GetInt("DB_MAX_CONNS")),
		DBMinIdleConns:        int32(viper.GetInt("DB_MIN_IDLE_CONNS")),
		DBMaxConnIdleTime:     maxIdleTime,
		RedisURL:              viper.GetString("REDIS_URL"),
		JWTAccessTokenSecret:  viper.GetString("JWT_ACCESS_TOKEN_SECRET"),
		JWTRefreshTokenSecret: viper.GetString("JWT_REFRESH_TOKEN_SECRET"),
		JWTAccessTokenTTL:     accessTokenTTL,
		JWTRefreshTokenTTL:    refreshTokenTTL,
		KafkaBrokers:          parseStringSlice(viper.GetString("KAFKA_BROKERS")),
		KafkaConsumerGroup:    viper.GetString("KAFKA_CONSUMER_GROUP"),
		AdminEnabled:          viper.GetBool("ADMIN_ENABLED"),
	}, nil
}

// parseStringSlice parses a comma-separated string into a slice.
func parseStringSlice(s string) []string {
	if s == "" {
		return []string{}
	}

	parts := strings.Split(s, ",")
	for i := range parts {
		parts[i] = strings.TrimSpace(parts[i])
	}

	return parts
}
