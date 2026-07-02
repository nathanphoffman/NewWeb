//go:build js && wasm

package main

import (
	"newweb/src/newweb"
	"time"
)

func main() {
	time.Sleep(3 * time.Second)

	first := newweb.Get("form.firstName")
	last := newweb.Get("form.lastName")
	email := newweb.Get("form.email")
	phone := newweb.Get("form.phone")
	state := newweb.Get("form.state")
	zip := newweb.Get("form.zip")

	newweb.More("### Order Summary\n\n" +
		"**Name:** " + first + " " + last + "\n\n" +
		"**Email:** " + email + "\n\n" +
		"**Phone:** " + phone + "\n\n" +
		"**Ship to:** " + state + " " + zip)
}
