@echo off
title AKS Spring Boot Stack
echo ===================================================
echo   Starting Spring Boot (Postgres + MongoDB) Stack
echo ===================================================
echo.
echo [1/4] Starting Spring Boot PostgreSQL Backend (Port 8001)...
start "Spring Boot PostgreSQL Backend" cmd /k "cd Backend\coreservices_AKS && mvnw spring-boot:run"

echo [2/4] Starting Spring Boot MongoDB Backend (Port 8020)...
start "Spring Boot MongoDB Backend" cmd /k "cd Backend\coreservices_mongo && mvnw spring-boot:run"

echo [3/4] Starting FastAPI Gateway (Port 8000)...
start "FastAPI Gateway" cmd /k "cd Backend\gateway && python run.py"

echo [4/4] Starting React Frontend (Port 5173)...
start "React Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo Spring Boot stack started! Check separate terminal windows for logs.
pause
