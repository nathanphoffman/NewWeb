#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Engine = Join-Path $ScriptDir "engine"

Write-Host "-> building engine..."
Push-Location $Engine
try {
    npm run build
} finally {
    Pop-Location
}

Write-Host "-> copying engine wasm + index.html -> site/..."
$PkgDir = Join-Path $ScriptDir "site\engine\build\pkg"
New-Item -ItemType Directory -Force -Path $PkgDir | Out-Null
Copy-Item "$Engine\build\pkg\engine_bg.wasm" "$PkgDir\engine_bg.wasm" -Force
Copy-Item "$Engine\build\index.html" "$ScriptDir\site\index.html" -Force
Write-Host "v site/ synced"
