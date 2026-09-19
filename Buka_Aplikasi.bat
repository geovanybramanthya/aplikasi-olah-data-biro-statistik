@echo off
title Biro Statistik BEM UNDIP - Survey Analytics Platform
cls
echo =========================================================================
echo   BIRO STATISTIK BEM UNIVERSITAS DIPONEGORO 2026
echo   Survey Analytics & Visualization Platform (Offline Launcher)
echo =========================================================================
echo.
echo Sedang menyiapkan server dan membuka aplikasi di browser Anda...
echo.

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Menggunakan runtime Python untuk menyajikan server lokal...
    start http://localhost:4173
    python -m http.server 4173 --directory dist
    goto end
)

where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Menggunakan runtime Node.js untuk menyajikan server lokal...
    start http://localhost:4173
    npx --yes serve -s dist -l 4173
    goto end
)

echo [OK] Menggunakan launcher native Windows PowerShell...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\server.ps1"

:end
pause
