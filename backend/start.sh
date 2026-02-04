#!/bin/bash
# Render startup script with automatic migrations

echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migration warning (might be expected if schema is up to date)"
fi

echo "🚀 Starting application..."
npm run start:prod
