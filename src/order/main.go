//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	newweb.Redirect("order-placed", "Order placed successfully!")
}
