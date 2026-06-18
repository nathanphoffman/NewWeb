//go:build js && wasm

package main

import "newweb/src/newweb"

func jsonEscape(s string) string {
	out := ""
	for _, c := range s {
		switch c {
		case '"':
			out += `\"`
		case '\\':
			out += `\\`
		case '\n':
			out += `\n`
		case '\r':
			out += `\r`
		case '\t':
			out += `\t`
		default:
			if c >= 0x20 {
				out += string(c)
			}
		}
	}
	return out
}

func main() {
	action := newweb.Get("cms.action")
	filepath := newweb.Get("cms.filepath")
	content := newweb.Get("cms.content")

	body := `{"path":"` + jsonEscape(filepath) + `","content":"` + jsonEscape(content) + `"}`

	switch action {
	case "create":
		newweb.ApiFetch("POST", "/api/file", body)
	default:
		newweb.ApiFetch("PUT", "/api/file", body)
	}
}
