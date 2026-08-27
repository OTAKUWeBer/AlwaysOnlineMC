@echo off
title AlwaysBotMC 24/7 (Minecraft 1.21.4)
color 0b

echo ===================================================
echo   AlwaysBotMC - 24/7 Minecraft Anti-AFK Bot
echo   Auto-Restart Loop Enabled
echo ===================================================
echo.

:loop
echo [%DATE% %TIME%] Starting AlwaysBotMC...
node bot.js
echo.
echo [%DATE% %TIME%] Bot stopped or crashed!
echo [%DATE% %TIME%] Restarting in 5 seconds... (Press Ctrl+C to terminate)
timeout /t 5 /nobreak >nul
goto loop
