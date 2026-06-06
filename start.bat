@echo off
title AKS Service Manager
echo ===================================================
echo   Accessible Knowledge Accessing System (AKS)
echo               Service Manager
echo ===================================================
echo.
echo [1/4] Starting Spring Boot Backend (Port 8001)...
start "Spring Boot Backend" cmd /k "cd Backend\coreservices_AKS && mvnw spring-boot:run"

echo [2/4] Starting Node.js Reviews Backend (Port 8002)...
start "Node.js Reviews Backend" cmd /k "cd Backend\node_service && npm install && npm start"

echo [3/4] Starting FastAPI Gateway (Port 8000)...
start "FastAPI Gateway" cmd /k "cd Backend\gateway && python run.py"

echo [4/4] Starting React Frontend (Port 5173)...
start "React Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ===================================================
echo All services started! Check the separate terminal windows for logs.
echo Press any key to exit this service manager.
echo ===================================================
pause > nul
