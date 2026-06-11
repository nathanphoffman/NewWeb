//go:build js && wasm

package main

import (
	"bytes"
	"syscall/js"

	"github.com/yuin/goldmark"
)

func parseMarkdown(md string) string {
	var buf bytes.Buffer
	if err := goldmark.Convert([]byte(md), &buf); err != nil {
		return "<p>Error rendering markdown</p>"
	}
	return buf.String()
}

func render(this js.Value, args []js.Value) interface{} {
	md := args[0].String()
	return parseMarkdown(md)
}

func main() {
	js.Global().Set("newwebRender", js.FuncOf(render))
	select {} // keep alive
}
