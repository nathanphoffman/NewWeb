//go:build js && wasm

package newweb

import "syscall/js"

var api = js.Global().Get("newweb")

func Redirect(url, reason string) {
	api.Call("redirect", url, reason)
}

func Info(md string) {
	api.Call("info", md)
}

func Error(md string) {
	api.Call("error", md)
}

func More(md string) {
	api.Call("more", md)
}
