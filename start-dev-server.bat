@echo off
setlocal
cd /d D:\VSCode\hrdb-lenard
start "HRDB Dev Server" cmd /k "npm run dev -- --hostname 0.0.0.0 --port 3000"
