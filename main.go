package main

import (
	// standard library
	"database/sql"
	"encoding/json"
	"log"
	"net"
	"net/http"

	// third party
	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

type userInfo struct {
	IP        string `json:“ip”`
	UserAgent string `json:”userAgent“`
	Language  string `json:“language”`
}

func getIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	return ip
}

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "footprint.db")
	if err != nil {
		log.Fatal("failed to open db:", err)
	}
	db.Exec(`CREATE TABLE IF NOT EXISTS visits (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address         TEXT,
        user_agent TEXT,
        language   TEXT,
        timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)
}

func BackendInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	info := userInfo{
		IP:        getIP(r),
		UserAgent: r.Header.Get("User-Agent"),
		Language:  r.Header.Get("Accept-Language"),
	}
	_, err := db.Exec(
		"INSERT INTO visits (ip_address, user_agent, language) VALUES (?, ?, ?)",
		info.IP, info.UserAgent, info.Language,
	)
	if err != nil {
		log.Println("db insert error:", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

func main() {
	initDB()
	defer db.Close()
	mux := http.NewServeMux()
	fs := http.FileServer(http.Dir("."))
	mux.HandleFunc("GET /BackendInfo", BackendInfo)

	mux.Handle("/", fs)
	s := http.Server{
		Addr:    ":8080",
		Handler: mux,
	}

	s.ListenAndServe()

}
