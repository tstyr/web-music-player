# Cloudflare Tunnel Helper Script
# This script starts a Cloudflare tunnel and automatically opens the browser

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " 🎵 Cloudflare Tunnel Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if cloudflared is installed
$cloudflaredCmd = $null
try {
    $cloudflaredCmd = Get-Command cloudflared -ErrorAction Stop
    Write-Host "[OK] cloudflared found in PATH" -ForegroundColor Green
} catch {
    # Check Downloads folder
    $downloadPath = "$env:USERPROFILE\Downloads\cloudflared-windows-amd64.exe"
    if (Test-Path $downloadPath) {
        $cloudflaredCmd = $downloadPath
        Write-Host "[OK] cloudflared found in Downloads folder" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] cloudflared not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install cloudflared:" -ForegroundColor Yellow
        Write-Host "  1. Run: winget install --id Cloudflare.cloudflared" -ForegroundColor Yellow
        Write-Host "  2. Or download from: https://github.com/cloudflare/cloudflared/releases" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
}

Write-Host ""
Write-Host "[INFO] Starting Cloudflare Quick Tunnel..." -ForegroundColor Cyan
Write-Host "[INFO] Target: http://127.0.0.1:3000" -ForegroundColor Cyan
Write-Host ""

# Create log file path
$logFile = "$env:TEMP\cloudflared-tunnel.log"
if (Test-Path $logFile) {
    Remove-Item $logFile -Force
}

# Start cloudflared tunnel in background
$tunnelProcess = Start-Process -FilePath $cloudflaredCmd -ArgumentList "tunnel", "--url", "http://127.0.0.1:3000" -RedirectStandardOutput $logFile -RedirectStandardError $logFile -PassThru -WindowStyle Hidden

Write-Host "[INFO] Waiting for tunnel to start..." -ForegroundColor Cyan

# Wait for tunnel URL to appear in log (max 30 seconds)
$maxWaitTime = 30
$waitInterval = 1
$elapsedTime = 0
$tunnelUrl = $null

while ($elapsedTime -lt $maxWaitTime) {
    Start-Sleep -Seconds $waitInterval
    $elapsedTime += $waitInterval
    
    if (Test-Path $logFile) {
        $logContent = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        
        # Extract tunnel URL using regex
        if ($logContent -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
            $tunnelUrl = $matches[0]
            break
        }
    }
    
    # Show progress
    Write-Host "." -NoNewline
}

Write-Host ""
Write-Host ""

if ($tunnelUrl) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " 🌐 Tunnel URL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  $tunnelUrl" -ForegroundColor White -BackgroundColor DarkGreen
    Write-Host ""
    Write-Host "[SUCCESS] Tunnel is ready!" -ForegroundColor Green
    Write-Host "[INFO] Opening browser..." -ForegroundColor Cyan
    Write-Host ""
    
    # Open browser
    Start-Process $tunnelUrl
    
    Write-Host "✅ Browser opened automatically!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " 📱 Access from Mobile" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open this URL on your phone:" -ForegroundColor White
    Write-Host "   $tunnelUrl" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "2. Or generate QR code at:" -ForegroundColor White
    Write-Host "   - https://www.qr-code-generator.com/" -ForegroundColor Cyan
    Write-Host "   - https://qrcode.tec-it.com/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Save tunnel info for later use
    $tunnelInfo = @{
        Url = $tunnelUrl
        ProcessId = $tunnelProcess.Id
        StartTime = Get-Date
    }
    $tunnelInfo | ConvertTo-Json | Out-File "$env:TEMP\tunnel-info.json" -Encoding UTF8
    
    Write-Host "[INFO] Tunnel process ID: $($tunnelProcess.Id)" -ForegroundColor Gray
    Write-Host "[INFO] Log file: $logFile" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " ⚠️ Warning" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "[WARNING] Could not extract tunnel URL automatically" -ForegroundColor Yellow
    Write-Host "[INFO] Tunnel may still be starting..." -ForegroundColor Cyan
    Write-Host "[INFO] Check log file: $logFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "The tunnel URL should appear in the log file shortly." -ForegroundColor White
    Write-Host "It will look like: https://xxxxx.trycloudflare.com" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press Ctrl+C to stop the tunnel and server" -ForegroundColor Gray
Write-Host ""

exit 0
