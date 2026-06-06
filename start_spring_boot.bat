@echo off
title AKS Spring Boot Stack
echo ===================================================
echo   Starting Spring Boot + Gateway + Frontend Stack
echo ===================================================
echo.
echo [1/3] Starting Spring Boot Backend (Port 8001)...
start "Spring Boot Backend" cmd /k "cd Backend\coreservices_AKS && mvnw spring-boot:run"

echo [2/3] Starting FastAPI Gateway (Port 8000)...
start "FastAPI Gateway" cmd /k "cd Backend\gateway && python run.py"

echo [3/3] Starting React Frontend (Port 5173)...
start "React Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo Spring Boot stack started! Check separate terminal windows for logs.
pause
