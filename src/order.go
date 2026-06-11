//go:build js && wasm

package main

import "syscall/js"

func main() {
	js.Global().Get("gemweb").Call("redirect", "md:order-placed.md", "Order placed successfully!")
}
