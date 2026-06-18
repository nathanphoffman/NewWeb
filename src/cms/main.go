//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	action := newweb.Get("cms.action")
	filepath := newweb.Get("cms.filepath")
	// cms.content is available for future backend POST
	_ = newweb.Get("cms.content")

	switch action {
	case "create":
		newweb.Info("Created: " + filepath)
	default:
		newweb.Info("Post saved")
	}
}
