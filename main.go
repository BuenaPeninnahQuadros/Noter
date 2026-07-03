package main

import (
	"fmt"
	"log"
	"net/http"
	"noter-backend/routes"
	"os"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func loadEnv() {
	for _, path := range []string{".env", "../.env", "noter-backend/.env"} {
		if err := godotenv.Load(path); err == nil {
			return
		}
	}
}

func main() {
	loadEnv()
	routes.InitDB()

	router := mux.NewRouter()
	routes.RegisterRoutes(router)

	port := os.Getenv("BACKEND_PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Printf("✅ Noter backend running on port %s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, router))
}
