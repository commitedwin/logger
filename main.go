package main

import (
	"encoding/json"
	"net"
	"net/http"
)

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

func BackendInfo(w http.ResponseWriter, r *http.Request) {

	info := userInfo{
		IP:        getIP(r),
		UserAgent: r.Header.Get("User-Agent"),
		Language:  r.Header.Get("Accept-Language"),
	}

	json.NewEncoder(w).Encode(info)
}

func main() {
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
