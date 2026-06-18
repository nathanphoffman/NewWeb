//go:build js && wasm

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"time"

	"newweb/src/newweb"
)

func sha256hex(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

func main() {
	username := newweb.Get("auth.username")
	password := newweb.Get("auth.password")

	if username == "" || password == "" {
		newweb.Auth(false, "", "")
		return
	}

	// H = SHA256(password) — stored in localStorage as the persistent credential
	H := sha256hex(password)

	// timeToken = SHA256(H + minute) — one-time token sent to server
	minute := strconv.FormatInt(time.Now().Unix()/60, 10)
	timeToken := sha256hex(H + minute)

	// Store token for JS auth handler to pick up and POST to /api/auth
	newweb.Store("auth.time_token", timeToken)

	// Signal JS: crypto done; H is the value to persist in localStorage
	newweb.Auth(true, H, username)
}
