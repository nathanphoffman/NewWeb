#Requires -Version 5.1
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

& (Join-Path $ScriptDir "sync-site.ps1")

Write-Host "-> syncing -> setup/..."
$PkgDir = Join-Path $ScriptDir "setup\engine\build\pkg"
New-Item -ItemType Directory -Force -Path $PkgDir | Out-Null
Copy-Item "$ScriptDir\site\index.html"                      "$ScriptDir\setup\index.html" -Force
Copy-Item "$ScriptDir\site\engine\build\pkg\engine_bg.wasm" "$PkgDir\engine_bg.wasm" -Force
Write-Host "v setup\ synced"

Write-Host "-> copying documentation..."
Copy-Item "$ScriptDir\site\documentation.md" "$ScriptDir\setup\documentation.md" -Force
Write-Host "v documentation.md copied to setup\"
