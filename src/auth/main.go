//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	username := newweb.Get("auth.username")
	password := newweb.Get("auth.password")

	// Hookup points — future: read these, hash the password, POST to endpoint
	_ = newweb.Get("config.auth.endpoint")
	_ = newweb.Get("config.auth.hashMethod")

	if username == "admin" && password == "password123" {
		newweb.Auth(true)
	} else {
		newweb.Auth(false)
	}
}
