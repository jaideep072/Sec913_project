@echo off
title AKS Node.js Reviews Stack
echo ===================================================
echo   Starting Node.js Reviews Backend Stack (MongoDB)
echo ===================================================
echo.
echo [1/1] Starting Node.js Reviews Backend (Port 8002)...
start "Node.js Reviews Backend" cmd /k "cd Backend\node_service && npm install && npm start"

echo.
echo Node.js reviews service started! Check the logs in the opened terminal window.
pause
