# Plotr - build and install on Windows.
# Builds the release bundle and runs the NSIS installer silently, which
# registers Plotr in the Start menu so Windows app search finds it.

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

Write-Host "== Plotr installer ==" -ForegroundColor Cyan

# -- Prerequisites --
foreach ($tool in @("node", "npm", "cargo")) {
    if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
        Write-Host "Missing prerequisite: $tool" -ForegroundColor Red
        Write-Host "Install Node.js (https://nodejs.org) and Rust (https://rustup.rs), then re-run."
        exit 1
    }
}

# -- Build --
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

Write-Host "Building release bundles (this can take a few minutes)..." -ForegroundColor Cyan
npm run tauri build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

# -- Install --
$setup = Get-ChildItem "$repo\src-tauri\target\release\bundle\nsis\*-setup.exe" |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $setup) {
    Write-Host "No installer found in src-tauri\target\release\bundle\nsis" -ForegroundColor Red
    exit 1
}

Write-Host "Running installer: $($setup.Name)" -ForegroundColor Cyan
# /S = silent. Tauri's NSIS installer defaults to a per-user install with a
# Start menu shortcut - no admin prompt, discoverable in app search.
$proc = Start-Process -FilePath $setup.FullName -ArgumentList "/S" -Wait -PassThru
if ($proc.ExitCode -ne 0) {
    Write-Host "Installer exited with code $($proc.ExitCode)" -ForegroundColor Red
    exit $proc.ExitCode
}

Write-Host ""
Write-Host "Plotr installed. Search for 'Plotr' in the Start menu to launch it." -ForegroundColor Green
