<!-- themes: cat -->
# Hello from NewWeb

This page is rendered from `main.md` via **Go WASM + goldmark**.

Navigate to another page to see link interception in action:

- [About this project](about)
- [Aluminum](more:aluminum.md)

> Links to other pages are caught by the engine and load the target `.md` file in place, no page reload.

---

[Test Not Http](startrek.com)
[Star Trek](https://startrek.com)

[Place Order](wasm:src/order.wasm)

[Visit example.com](wasm:src/visit.wasm)

<!-- script_reasoning: Menu items are loaded in from a server as they may change from time to time -->
[View Menu](wasm:src/menu.wasm)

<!-- script_reasoning: Loads your profile into this session so other scripts can personalise your experience -->
<!-- data: firstName, lastName, email, member -->
[Load My Profile](wasm:src/profile.wasm)

![my cat](684448.jpg)