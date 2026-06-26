#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Engine = Join-Path $ScriptDir "engine"

Write-Host "-> building slim JS..."
Push-Location $Engine
try {
    npm run build:js-slim
    npm run build:html-slim
} finally {
    Pop-Location
}
Write-Host "v slim built -> $ScriptDir\index.html"

Write-Host "-> syncing slim -> setup/..."
Copy-Item "$ScriptDir\index.html"                        "$ScriptDir\setup\index.html" -Force
Copy-Item "$Engine\build\pkg\engine_bg.wasm"             "$ScriptDir\setup\engine\build\pkg\engine_bg.wasm" -Force
Write-Host "v setup\ synced (viewer only)"

Write-Host "-> building full JS..."
Push-Location $Engine
try {
    npm run build:editor-js
    npm run build:js
    npm run build:html-full
} finally {
    Pop-Location
}
Write-Host "v full built -> $ScriptDir\index-full.html"

Write-Host "-> syncing full -> setup-full/..."
New-Item -ItemType Directory -Force -Path "$ScriptDir\setup-full\engine\build\pkg" | Out-Null
Copy-Item "$ScriptDir\index-full.html"                   "$ScriptDir\setup-full\index.html" -Force
Copy-Item "$Engine\build\pkg\engine_bg.wasm"             "$ScriptDir\setup-full\engine\build\pkg\engine_bg.wasm" -Force
Copy-Item "$Engine\build\editor.bundle.js"               "$ScriptDir\setup-full\engine\build\editor.bundle.js" -Force
Write-Host "v setup-full\ synced (with markdown editor)"

Write-Host "-> copying documentation..."
Copy-Item "$ScriptDir\documentation.md" "$ScriptDir\setup\documentation.md" -Force
Copy-Item "$ScriptDir\documentation.md" "$ScriptDir\setup-full\documentation.md" -Force
Write-Host "v documentation.md copied to both setups"

Write-Host ""
Write-Host "Both builds synced:"
Write-Host "  setup\      -> slim (viewer only, lightweight)"
Write-Host "  setup-full\ -> full (with in-browser markdown editor)"
