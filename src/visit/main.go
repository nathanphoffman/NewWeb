//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	newweb.Redirect("https://example.com", "Leaving NewWeb")
}
