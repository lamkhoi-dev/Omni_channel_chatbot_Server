#!/bin/sh
# Auto-run migrations before starting the server

echo "🔄 Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Set default PORT if not provided
PORT=${PORT:-8000}

echo "🚀 Starting server on port $PORT..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT
