#!/bin/bash
# Render startup script with automatic migrations and smart seeding

echo "🔄 Running database migrations..."
npx prisma db push --accept-data-loss

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "⚠️ Migration warning (might be expected if schema is up to date)"
fi

# Check if database has data (check if users table has any records)
echo "🔍 Checking if database needs seeding..."
USER_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -o '[0-9]*' | head -1)

if [ -z "$USER_COUNT" ] || [ "$USER_COUNT" = "0" ]; then
    echo "📦 Database is empty, running seed..."
    npm run seed
    if [ $? -eq 0 ]; then
        echo "✅ Database seeded successfully"
    else
        echo "⚠️ Seed failed, but continuing..."
    fi
else
    echo "✅ Database already has data ($USER_COUNT users), skipping seed"
fi

echo "🚀 Starting application..."
npm run start:prod
