#!/bin/sh
set -e

echo "=== Banana Slides - Zeabur Deployment ==="

# Run database migrations
echo "Running database migrations..."
cd /app && uv run --directory backend alembic upgrade head
echo "Database migrations completed."

# Start supervisor (manages both nginx and Flask)
echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/app.conf
