//go:build js && wasm

package main

import "newweb/src/newweb"

// menuItem builds one dish for the menu template.
func menuItem(name, price, description string) map[string]interface{} {
	return map[string]interface{}{
		"name":        name,
		"price":       price,
		"description": description,
	}
}

func main() {
	newweb.Load("menu", map[string]interface{}{
		"restaurantName": "The Golden Fork",
		"menuItems": []interface{}{
			menuItem("Margherita Pizza", "$12.99", "Fresh tomatoes, mozzarella, basil"),
			menuItem("Caesar Salad", "$8.50", "Romaine, parmesan, house dressing"),
			menuItem("Tiramisu", "$6.00", "Classic Italian dessert with espresso"),
		},
	})
}
