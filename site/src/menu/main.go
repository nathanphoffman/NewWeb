//go:build js && wasm

package main

import "newweb/src/newweb"

func main() {
	newweb.Load("menu", map[string]interface{}{
		"restaurantName": "The Golden Fork",
		"menuItems": []interface{}{
			map[string]interface{}{
				"name":        "Margherita Pizza",
				"price":       "$12.99",
				"description": "Fresh tomatoes, mozzarella, basil",
			},
			map[string]interface{}{
				"name":        "Caesar Salad",
				"price":       "$8.50",
				"description": "Romaine, parmesan, house dressing",
			},
			map[string]interface{}{
				"name":        "Tiramisu",
				"price":       "$6.00",
				"description": "Classic Italian dessert with espresso",
			},
		},
	})
}
