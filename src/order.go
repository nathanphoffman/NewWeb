//go:build js && wasm

package main

import "syscall/js"

func main() {

	fileName := "md:order-placed.md"
	reason := "Order placed successfully!"

	js.Global().Get("gemweb").Call("redirect", fileName, reason)
}
