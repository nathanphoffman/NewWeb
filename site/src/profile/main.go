//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	newweb.Store("firstName", "Nate")
	newweb.Store("lastName", "Hoffman")
	newweb.Store("email", "natephiliphoffman@proton.me")
	newweb.Store("member", "true")
	newweb.Info("Profile loaded — your session data has been updated.")
}
