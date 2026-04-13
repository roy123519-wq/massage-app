package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"massage-backend/database"
	"massage-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/line/line-bot-sdk-go/v7/linebot"
	"gorm.io/gorm"
)

var bot *linebot.Client

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file")
	}

	bot, err = linebot.New(
		os.Getenv("LINE_CHANNEL_SECRET"),
		os.Getenv("LINE_CHANNEL_ACCESS_TOKEN"),
	)
	if err != nil {
		log.Println("Line bot init failed:", err)
	}

	database.ConnectDB()
	database.DB.AutoMigrate(&models.Admin{}, &models.Member{}, &models.Transaction{}, &models.TopupPlan{}, &models.ServicePlan{})
	
	// Create default admin if not exists
	var admin models.Admin
	if err := database.DB.Where("username = ?", "admin").First(&admin).Error; err != nil {
		database.DB.Create(&models.Admin{Username: "admin", Password: "password123"})
	}
}

func main() {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			return true // 允許所有來源連線，徹底解決 Vercel CORS 問題
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.POST("/login", login)
		api.GET("/members", getMembers)
		api.POST("/members", createMember)
		api.PUT("/members/:id", updateMember)
		api.DELETE("/members/:id", deleteMember)
		api.GET("/members/:id/transactions", getTransactions)
		api.POST("/members/:id/transactions", createTransaction)

		api.GET("/topup-plans", getTopupPlans)
		api.POST("/topup-plans", createTopupPlan)
		api.PUT("/topup-plans/:id", updateTopupPlan)
		api.DELETE("/topup-plans/:id", deleteTopupPlan)

		api.GET("/service-plans", getServicePlans)
		api.POST("/service-plans", createServicePlan)
		api.PUT("/service-plans/:id", updateServicePlan)
		api.DELETE("/service-plans/:id", deleteServicePlan)

		api.GET("/revenue/monthly", getMonthlyRevenue)
		
		api.POST("/line/webhook", lineWebhook)
	}

	log.Println("Server running on port 8080")
	r.Run(":8080")
}

func login(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var admin models.Admin
	if err := database.DB.Where("username = ? AND password = ?", input.Username, input.Password).First(&admin).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Login successful", "admin": admin})
}

func getMembers(c *gin.Context) {
	var members []models.Member
	database.DB.Find(&members)
	c.JSON(http.StatusOK, members)
}

func createMember(c *gin.Context) {
	var input models.Member
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create member"})
		return
	}

	c.JSON(http.StatusOK, input)
}

func updateMember(c *gin.Context) {
	id := c.Param("id")
	var member models.Member
	if err := database.DB.First(&member, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	var input struct {
		Name      string `json:"name"`
		Phone     string `json:"phone"`
		Email     string `json:"email"`
		BirthDate string `json:"birth_date"`
		Gender    string `json:"gender"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&member).Updates(models.Member{Name: input.Name, Phone: input.Phone, Email: input.Email, BirthDate: input.BirthDate, Gender: input.Gender})
	c.JSON(http.StatusOK, member)
}

func deleteMember(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.Member{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete member"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Member deleted successfully"})
}

func getTransactions(c *gin.Context) {
	memberID := c.Param("id")
	var transactions []models.Transaction
	database.DB.Where("member_id = ?", memberID).Order("created_at desc").Find(&transactions)
	c.JSON(http.StatusOK, transactions)
}

func createTransaction(c *gin.Context) {
	memberID := c.Param("id")
	var member models.Member
	if err := database.DB.First(&member, memberID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Member not found"})
		return
	}

	var input struct {
		Amount int    `json:"amount"` 
		Type   string `json:"type"`   
		Note   string `json:"note"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	amount := input.Amount
	if input.Type == "deduction" && amount > 0 {
		amount = -amount
	}

	if member.Balance+amount < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient balance"})
		return
	}

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		transaction := models.Transaction{
			MemberID: member.ID,
			Amount:   amount,
			Type:     input.Type,
			Note:     input.Note,
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		member.Balance += amount
		if err := tx.Save(&member).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transaction successful", "new_balance": member.Balance})
}

func getTopupPlans(c *gin.Context) {
	var plans []models.TopupPlan
	database.DB.Find(&plans)
	c.JSON(http.StatusOK, plans)
}

func createTopupPlan(c *gin.Context) {
	var input models.TopupPlan
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create topup plan"})
		return
	}

	c.JSON(http.StatusOK, input)
}

func updateTopupPlan(c *gin.Context) {
	id := c.Param("id")
	var plan models.TopupPlan
	if err := database.DB.First(&plan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Topup plan not found"})
		return
	}

	var input models.TopupPlan
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&plan).Updates(models.TopupPlan{Name: input.Name, Price: input.Price, Bonus: input.Bonus})
	c.JSON(http.StatusOK, plan)
}

func deleteTopupPlan(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.TopupPlan{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete topup plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Topup plan deleted successfully"})
}

func getMonthlyRevenue(c *gin.Context) {
	periodType := c.DefaultQuery("period", "monthly")
	
	var results []struct {
		Period            string `json:"period"`
		TopupRevenue     int    `json:"topup_revenue"`
		DeductionRevenue int    `json:"deduction_revenue"`
	}

	dialect := database.DB.Dialector.Name()
	
	sqliteFormat := "'%Y-%m'"
	pgFormat := "'YYYY-MM'"
	
	if periodType == "yearly" {
		sqliteFormat = "'%Y'"
		pgFormat = "'YYYY'"
	} else if periodType == "daily" {
		sqliteFormat = "'%Y-%m-%d'"
		pgFormat = "'YYYY-MM-DD'"
	}

	selectQuery := fmt.Sprintf("strftime(%s, created_at) as period, SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) as topup_revenue, SUM(CASE WHEN type = 'deduction' THEN ABS(amount) ELSE 0 END) as deduction_revenue", sqliteFormat)
	
	if dialect == "postgres" {
		selectQuery = fmt.Sprintf("TO_CHAR(created_at, %s) as period, SUM(CASE WHEN type = 'topup' THEN amount ELSE 0 END) as topup_revenue, SUM(CASE WHEN type = 'deduction' THEN ABS(amount) ELSE 0 END) as deduction_revenue", pgFormat)
	}

	database.DB.Model(&models.Transaction{}).
		Select(selectQuery).
		Group("period").
		Order("period desc").
		Scan(&results)

	c.JSON(http.StatusOK, results)
}

func getServicePlans(c *gin.Context) {
	var plans []models.ServicePlan
	database.DB.Find(&plans)
	c.JSON(http.StatusOK, plans)
}

func createServicePlan(c *gin.Context) {
	var input models.ServicePlan
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := database.DB.Create(&input).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service plan"})
		return
	}

	c.JSON(http.StatusOK, input)
}

func updateServicePlan(c *gin.Context) {
	id := c.Param("id")
	var plan models.ServicePlan
	if err := database.DB.First(&plan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service plan not found"})
		return
	}

	var input models.ServicePlan
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Model(&plan).Updates(models.ServicePlan{Name: input.Name, Price: input.Price})
	c.JSON(http.StatusOK, plan)
}

func deleteServicePlan(c *gin.Context) {
	id := c.Param("id")
	if err := database.DB.Delete(&models.ServicePlan{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service plan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service plan deleted successfully"})
}

func lineWebhook(c *gin.Context) {
	if bot == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Bot uninitialized"})
		return
	}

	events, err := bot.ParseRequest(c.Request)
	if err != nil {
		if err == linebot.ErrInvalidSignature {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid signature"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		}
		return
	}

	for _, event := range events {
		if event.Type == linebot.EventTypeMessage {
			switch message := event.Message.(type) {
			case *linebot.TextMessage:
				handleLineTextMessage(bot, event.ReplyToken, event.Source.UserID, message.Text)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func handleLineTextMessage(bot *linebot.Client, replyToken, lineID, text string) {
	text = strings.TrimSpace(text)
	
	if strings.HasPrefix(text, "綁定") {
		parts := strings.Split(text, " ")
		if len(parts) >= 2 {
			phone := strings.TrimSpace(parts[1])
			var member models.Member
			if err := database.DB.Where("phone = ?", phone).First(&member).Error; err != nil {
				bot.ReplyMessage(replyToken, linebot.NewTextMessage("找不到該手機號碼的會員。")).Do()
				return
			}
			
			database.DB.Model(&member).Update("line_id", lineID)
			replyText := fmt.Sprintf("會員綁定成功！您的當前餘額為：%d元", member.Balance)
			bot.ReplyMessage(replyToken, linebot.NewTextMessage(replyText)).Do()
		} else {
			bot.ReplyMessage(replyToken, linebot.NewTextMessage("指令格式錯誤，請輸入「綁定 您的手機號碼」")).Do()
		}
		return
	}

	if text == "餘額" {
		var member models.Member
		if err := database.DB.Where("line_id = ?", lineID).First(&member).Error; err != nil {
			bot.ReplyMessage(replyToken, linebot.NewTextMessage("您尚未綁定會員，請輸入「綁定 您的手機號碼」進行綁定。")).Do()
			return
		}
		
		replyText := fmt.Sprintf("您目前的餘額為：%d元", member.Balance)
		bot.ReplyMessage(replyToken, linebot.NewTextMessage(replyText)).Do()
		return
	}
}
