package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

// GraphData structures match your React types
type GraphData struct {
	Nodes []Node `json:"nodes"`
	Links []Link `json:"links"`
}

type Node struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Author string `json:"author"`
	Genre  string `json:"genre"`
	Year   string `json:"year"`
}

type Link struct {
	Source    int    `json:"source"`
	Target    int    `json:"target"`
	Quote     string `json:"quote"`
	Sentiment string `json:"sentiment"`
}

func main() {
	connStr := os.Getenv("DATABASE_URL")
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	r := gin.Default()

	// Enable CORS (Critical since React runs on port 5173 and Go on 8080)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Next()
	})

	r.GET("/asterism/all", func(c *gin.Context) {
		rows, err := db.Query("SELECT id, title, author, genre, year FROM nodes")
		if err != nil {
			log.Println("Error querying nodes:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var nodes []Node
		for rows.Next() {
			var n Node
			rows.Scan(&n.ID, &n.Title, &n.Author, &n.Genre, &n.Year)
			nodes = append(nodes, n)
		}

		lRows, _ := db.Query("SELECT source_id, target_id, quote, sentiment FROM links")
		var links []Link
		for lRows.Next() {
			var l Link
			lRows.Scan(&l.Source, &l.Target, &l.Quote, &l.Sentiment)
			links = append(links, l)
		}

		c.JSON(http.StatusOK, GraphData{Nodes: nodes, Links: links})
	})

	r.Run(":8080")
}
