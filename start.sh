#!/bin/bash
# ===================================================
# AlwaysBotMC - 24/7 Minecraft Anti-AFK Bot
# Auto-Restart Loop Script for Linux / macOS / VPS
# ===================================================

echo "==================================================="
echo "  AlwaysBotMC - 24/7 Minecraft Anti-AFK Bot"
echo "  Auto-Restart Loop Enabled"
echo "==================================================="

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting AlwaysBotMC..."
    node bot.js
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 0 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bot stopped gracefully."
        break
    fi
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Bot exited with code $EXIT_CODE. Restarting in 5 seconds..."
    sleep 5
done
