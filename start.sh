#!/bin/sh
# Clean up stale Chromium lock files left over from previous container runs.
# Without this, redeployments crash with "profile appears to be in use".
echo "Cleaning up stale Chromium locks..."
find /app/session -name "SingletonLock" -delete 2>/dev/null
find /app/session -name "SingletonCookie" -delete 2>/dev/null
find /app/session -name "SingletonSocket" -delete 2>/dev/null

echo "Starting WhatsApp bot..."
exec node index.js
