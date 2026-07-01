#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Engine = Join-Path $ScriptDir "engine"

Write-Host "-> building JS..."
Push-Location $Engine
try {
    npm run build:js
    npm run build:html
} finally {
    Pop-Location
}
Write-Host "v built -> $ScriptDir\site\index.html"

Write-Host "-> syncing -> setup/..."
Copy-Item "$ScriptDir\site\index.html"       "$ScriptDir\setup\index.html" -Force
Copy-Item "$Engine\build\pkg\engine_bg.wasm" "$ScriptDir\setup\engine\build\pkg\engine_bg.wasm" -Force
Write-Host "v setup\ synced"

Write-Host "-> copying documentation..."
Copy-Item "$ScriptDir\site\documentation.md" "$ScriptDir\setup\documentation.md" -Force
Write-Host "v documentation.md copied to setup\"
