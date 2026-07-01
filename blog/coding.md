date posted: 2025-11-02
# Why I Switched My Build Pipeline to esbuild
I spent a weekend ripping out an old webpack config and replacing it with esbuild. The build went from twenty seconds to under a second, and the config file shrank from two hundred lines to about fifteen. Sometimes the boring tool really is the better tool.

date posted: 2024-06-18
# Debugging a Gnarly Race Condition
Spent most of a day chasing a bug that only showed up about one time in fifty. Turned out two async handlers were both writing to the same cache key without any lock. The fix was three lines. The debugging was not three lines.

date posted: 2026-01-05
# Notes on Learning Rust
The borrow checker fought me for the first two weeks and then, somewhere in week three, it clicked. Now I find myself missing it when I write code in other languages — it's like a very strict but very helpful editor.
