<!-- themes: cats -->
<!-- title: The New Web Project -->

# Welcome to the New Web Project
To get started right away, learn how to [Set Up Your First Site](first_site)

The New Web project was created by [Nathan Hoffman](https://nathanhoffman.me) from a thought experiment "What would the 90s web look like if we could redo it in 2026?"

To see the current progress check out [Progress](progress)

To understand why I think this might take off, see: [Why Though?](why_though)

New Web embraces the **core philosophy**:
- **Anyone should be able to create** a webpage in seconds
  - Markdown powers it all
  - No UI concerns, CSS, etc
  - Themes that do exist are standardized or user made (sites can only provide suggested keywords that may tie to templates like 'space')
  - UI elements that do exist are part of the New Web Browser (or the JS wrapper)
- **Users control** the data flow first and foremost
  - Users can see if a script acts
  - Users can decide if a script acts
  - A script never acts on page load, it can request the right to act, but never on its own
- **Input is generalized**
  - There is no tricks, just a standard input triggered by a link like "Add Address"
  - The standard input is controlled by New Web not the browser
  - The user decides after entering the input if they want to share it and run the script
- **JavaScript is not required**, the web belongs to all languages
  - For those who want more than md read-only functionality, Web Assembly is used in place of JS for scripting
  - One WASM = One Action. No bloated huge client side scripting, WASM is only loaded as called by the user (which means one link click = one WASM load at most)
  - Right now this means: TinyGo, Rust, and AssemblyScript are great options
    - Python and C# are possible but potentially larger 
    - Any other WASM language not listed here should work but performance can't be guaranteed 
- **Privacy is respected**
  - Users can see why a script is running (or a warning if no reason is given)
  - Users can see what cached data is being authorized to the WASM script
  - Users can clear **all** cached data easily
  - Cached data is only held until the browser is closed, unless the user specifically goes out of there way to save it.
  - Users can see if they are about to be directed to a traditional website
