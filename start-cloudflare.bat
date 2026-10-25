@echo off
title Klarity Family Finance - Cloudflare Tunnel
echo ========================================================
echo Starting Klarity Server and Cloudflare Tunnel...
echo ========================================================

start "Klarity Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
start "Cloudflare Tunnel" cmd /k "bin\cloudflared.exe tunnel --url http://localhost:5000"

echo.
echo Klarity is now running! Look at the Cloudflare window for your live HTTPS URL.
pause
