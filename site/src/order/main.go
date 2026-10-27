//go:build js && wasm

package main

import (
	"newweb/src/newweb"
	"time"
)

// processingDelay simulates the time a real order would take to process.
const processingDelay = 3 * time.Second

// orderSummary builds the markdown shown to the user from the submitted form values.
func orderSummary() string {
	first := newweb.Get("form.firstName")
	last := newweb.Get("form.lastName")
	email := newweb.Get("form.email")
	phone := newweb.Get("form.phone")
	state := newweb.Get("form.state")
	zip := newweb.Get("form.zip")

	return "### Order Summary\n\n" +
		"**Name:** " + first + " " + last + "\n\n" +
		"**Email:** " + email + "\n\n" +
		"**Phone:** " + phone + "\n\n" +
		"**Ship to:** " + state + " " + zip
}

func main() {
	time.Sleep(processingDelay)
	newweb.More(orderSummary())
}
