package models

import "time"

type Admin struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
}

type Member struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Phone     string    `gorm:"uniqueIndex;not null" json:"phone"`
	Email     string    `json:"email"`
	BirthDate string    `json:"birth_date"`
	Gender    string    `json:"gender"`
	Balance   int       `gorm:"default:0" json:"balance"`
	LineID    string    `json:"line_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type TopupPlan struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Price     int       `gorm:"not null" json:"price"`
	Bonus     int       `gorm:"not null" json:"bonus"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type ServicePlan struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	Price     int       `gorm:"not null" json:"price"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Transaction struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MemberID  uint      `gorm:"index;not null" json:"member_id"`
	Amount    int       `gorm:"not null" json:"amount"` // Positive for top-up, negative for deduction
	Type      string    `gorm:"not null" json:"type"`   // "topup" or "deduction"
	Note      string    `json:"note"`
	CreatedAt time.Time `json:"created_at"`
}
