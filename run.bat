@echo off
title Portfolio Manager

echo ========================================
echo   Portfolio Manager - Launcher
echo ========================================
echo.
echo   1. Dev mode (hot reload)
echo   2. Build production
echo   3. Build Windows installer
echo   4. Install dependencies
echo   5. Rebuild native modules
echo.
set /p choice="Select option (1-5): "

if "%choice%"=="1" (
    echo Starting dev server...
    npx electron-vite dev
) else if "%choice%"=="2" (
    echo Building production...
    npx electron-vite build
) else if "%choice%"=="3" (
    echo Building Windows installer...
    npx electron-vite build && npx electron-builder --win
) else if "%choice%"=="4" (
    echo Installing dependencies...
    npm install --ignore-scripts
    node node_modules\electron\install.js
    npx electron-rebuild -f -w better-sqlite3
) else if "%choice%"=="5" (
    echo Rebuilding native modules...
    npx electron-rebuild -f -w better-sqlite3
) else (
    echo Invalid option.
)

pause
