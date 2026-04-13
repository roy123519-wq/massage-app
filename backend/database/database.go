package database

import (
	"log"
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var database *gorm.DB
	var err error

	dbURL := os.Getenv("DATABASE_URL")

	if dbURL != "" {
		// Use PostgreSQL if DATABASE_URL is set (Cloud env)
		database, err = gorm.Open(postgres.Open(dbURL), &gorm.Config{})
	} else {
		// Fallback to SQLite (Local env)
		database, err = gorm.Open(sqlite.Open("massage.db"), &gorm.Config{})
	}

	if err != nil {
		log.Fatal("Failed to connect to database! Error: ", err)
	}

	DB = database
}
