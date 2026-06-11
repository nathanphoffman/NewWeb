//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	newweb.Redirect("md:order-placed.md", "Order placed successfully!")
}
