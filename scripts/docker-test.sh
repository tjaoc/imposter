#!/bin/bash
# Ejecuta tests y build del frontend en el mismo entorno que docker-compose (Node 20 Alpine).
# No requiere tener los contenedores de desarrollo en marcha (usa docker compose run).

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker no está corriendo."
  exit 1
fi

echo "📦 Construyendo imágenes backend y frontend (dev)..."
docker compose build backend frontend

echo ""
echo "🧪 Backend (node:test)…"
docker compose run --rm --no-deps backend npm test

echo ""
echo "🧪 Frontend (vitest)…"
docker compose run --rm --no-deps frontend npm test

echo ""
echo "🏗️  Frontend build (vite)…"
docker compose run --rm --no-deps frontend npm run build

echo ""
echo "✅ Pruebas y build en Docker completados."
