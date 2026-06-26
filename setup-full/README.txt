Thank you for trying our NEW WEB! (Full Build)

This is the full build, which includes the in-browser markdown editor.
For a lighter reading-only build, use the slim setup instead:
  npx degit https://github.com/nathanphoffman/NewWeb/setup my-site

How To Run
-----------------------
If you are seeing this file you have likely ran a git command to copy this directory, if so
then all you need to do is run "npm run start" to start the web server.

Basic Usage
-----------------------
The markdown that is your homepage is 'main.md'. If you create other markdown files
in the same directory as main.md, they will be navigatable as localhost#{filename}.md

You can link to markdown files in the same directory by just putting the markdown path in
a link like: [About this project](about)  This will load about.md in your root. If it is in
a subdirectory you can just reference it like info/about which loads info/about.md

Full Build Features
-----------------------
This build includes an in-browser markdown editor (powered by CodeMirror). You can
edit your markdown files directly in the browser when running the local dev server.

Static Hosting
-----------------------
No server required for hosting — drop the folder contents on any static host.
Required files:
  index.html
  engine/build/pkg/engine_bg.wasm
  engine/build/editor.bundle.js
  your .md files
