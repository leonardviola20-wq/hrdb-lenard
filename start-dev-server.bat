@echo off
setlocal

:: 1. Force reset the LAN adapter to instantly kickstart the connection
echo Resetting LAN Adapter...
netsh interface set interface name="Ethernet" admin=disabled
timeout /t 2 /nobreak >nul
netsh interface set interface name="Ethernet" admin=enabled
echo Waiting for network stabilization...
timeout /t 5 /nobreak >nul

:: 2. Launch your dev server
cd /d "D:\VSCode\hrdb-lenard"
start "HRDB Dev Server" cmd /k "npm run dev -- --hostname 0.0.0.0 --port 3000"