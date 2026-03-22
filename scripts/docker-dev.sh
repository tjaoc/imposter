#!/bin/bash

# Script para desarrollo local con Docker

set -e

echo "🚀 Iniciando entorno de desarrollo..."

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

# Construir y levantar servicios (--no-cache para reconstrucción completa)
BUILD_OPTS=""
if [ "$1" = "--no-cache" ] || [ "$1" = "--rebuild" ]; then
    echo "🔄 Reconstrucción completa (sin caché)..."
    BUILD_OPTS="--no-cache"
fi
echo "📦 Construyendo imágenes..."
docker-compose build $BUILD_OPTS

echo "🔧 Iniciando servicios..."
docker-compose up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 5

# Verificar estado
echo "📊 Estado de los servicios:"
docker-compose ps

echo ""
echo "✅ Entorno de desarrollo listo!"
echo ""
echo "📍 Servicios disponibles:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend:  http://localhost:4000"
echo "   - MongoDB:  localhost:27017"
echo ""
echo "📝 Comandos útiles:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Detener:  docker-compose down"
echo "   - Reiniciar: docker-compose restart"
echo "   - Tests + build (Docker): ./scripts/docker-test.sh"
