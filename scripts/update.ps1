# Plotr - self-update on Windows. Launched by the in-app Update button
# (runs in its own console window while the app closes).
# Pulls the latest changes, rebuilds, reinstalls, and relaunches Plotr.

$ErrorActionPreference = "Stop"
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

Write-Host "== Plotr updater ==" -ForegroundColor Cyan

# -- Wait for the app to close so no files are locked --
Write-Host "Waiting for Plotr to close..."
$waited = 0
while ((Get-Process plotr -ErrorAction SilentlyContinue) -and $waited -lt 30) {
    Start-Sleep -Milliseconds 500
    $waited += 0.5
}
if (Get-Process plotr -ErrorAction SilentlyContinue) {
    Write-Host "Plotr is still running - close it and re-run this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# -- Pull the latest changes --
$pulled = $false
if ((Test-Path "$repo\.git") -and (Get-Command git -ErrorAction SilentlyContinue)) {
    git remote get-url origin *> $null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Pulling latest changes..." -ForegroundColor Cyan
        git pull --ff-only
        if ($LASTEXITCODE -ne 0) {
            Write-Host "git pull failed (local changes or diverged history?). Continuing with the current code." -ForegroundColor Yellow
        } else {
            $pulled = $true
        }
    } else {
        Write-Host "No git remote configured - skipping pull, reinstalling current code." -ForegroundColor Yellow
    }
} else {
    Write-Host "Not a git repository (or git missing) - skipping pull, reinstalling current code." -ForegroundColor Yellow
}

# -- Rebuild and reinstall --
& "$PSScriptRoot\install.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Install failed." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# -- Relaunch --
$candidates = @(
    "$env:LOCALAPPDATA\Plotr\Plotr.exe",
    "$env:ProgramFiles\Plotr\Plotr.exe"
)
$exe = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($exe) {
    Write-Host "Relaunching Plotr..." -ForegroundColor Green
    Start-Process -FilePath $exe
} else {
    Write-Host "Installed, but couldn't find Plotr.exe to relaunch - start it from the Start menu." -ForegroundColor Yellow
}

if ($pulled) { Write-Host "Update complete." -ForegroundColor Green }
else { Write-Host "Reinstall complete (no new changes were pulled)." -ForegroundColor Green }
Start-Sleep -Seconds 3
