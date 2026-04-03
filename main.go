package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

type Fingerprint struct {
	Screen    string `json:"screen"`
	Timezone  string `json:"timezone"`
	Language  string `json:"language"`
	Platform  string `json:"platform"`
	UserAgent string `json:"userAgent"`
	Cores     int    `json:"cores"`
}

type UserInfo struct {
	IP        string `json:"ip"`
	UserAgent string `json:"userAgent"`
	Language  string `json:"language"`
}

func initDB() {
	var err error
	db, err = sql.Open("sqlite3", "footprint.db")
	if err != nil {
		log.Fatal("failed to open db:", err)
	}

	db.Exec(`CREATE TABLE IF NOT EXISTS visits (
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		ip_address TEXT,
		user_agent TEXT,
		language   TEXT,
		timestamp  DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)

	db.Exec(`CREATE TABLE IF NOT EXISTS fingerprints (
		id          INTEGER PRIMARY KEY AUTOINCREMENT,
		identifier  TEXT UNIQUE,
		visit_count INTEGER DEFAULT 1,
		first_seen  DATETIME DEFAULT CURRENT_TIMESTAMP,
		last_seen   DATETIME DEFAULT CURRENT_TIMESTAMP
	)`)
}

func getIP(r *http.Request) string {
	forwarded := r.Header.Get("X-Forwarded-For")
	if forwarded != "" {
		return forwarded
	}
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	return ip
}

func backendInfo(w http.ResponseWriter, r *http.Request) {
	info := UserInfo{
		IP:        getIP(r),
		UserAgent: r.Header.Get("User-Agent"),
		Language:  r.Header.Get("Accept-Language"),
	}

	db.Exec(
		"INSERT INTO visits (ip_address, user_agent, language) VALUES (?, ?, ?)",
		info.IP, info.UserAgent, info.Language,
	)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

func handleFingerprint(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var fp Fingerprint
	json.NewDecoder(r.Body).Decode(&fp)
	identifier := fp.Screen + fp.Timezone + fp.Language + fp.Platform + fp.UserAgent

	var id int
	var visitCount int
	var firstSeen string

	err := db.QueryRow(
		"SELECT id, visit_count, first_seen FROM fingerprints WHERE identifier = ?",
		identifier,
	).Scan(&id, &visitCount, &firstSeen)

	if err == sql.ErrNoRows {
		db.Exec(
			"INSERT INTO fingerprints (identifier) VALUES (?)",
			identifier,
		)
		json.NewEncoder(w).Encode(map[string]any{
			"returning": false,
		})
	} else {
		db.Exec(
			"UPDATE fingerprints SET visit_count = visit_count + 1, last_seen = CURRENT_TIMESTAMP WHERE identifier = ?",
			identifier,
		)
		json.NewEncoder(w).Encode(map[string]any{
			"returning":  true,
			"visitCount": visitCount,
			"firstSeen":  firstSeen,
		})
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /BackendInfo", backendInfo)
	mux.HandleFunc("POST /Fingerprint", handleFingerprint)

	s := http.Server{
		Addr:    ":8080",
		Handler: corsMiddleware(mux),
	}

	log.Println("Server running on :8080")
	s.ListenAndServe()
}
