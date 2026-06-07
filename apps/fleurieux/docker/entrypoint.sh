#!/bin/sh
# docker/entrypoint.sh
# Lancé au démarrage du conteneur app

set -e

echo "🔄 Migrations Prisma..."
npx prisma migrate deploy

echo "🚀 Démarrage Next.js..."
exec node server.js
