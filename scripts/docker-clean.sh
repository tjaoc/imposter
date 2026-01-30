#!/bin/bash

# Script para limpiar contenedores, imágenes y volúmenes de Docker

set -e

echo "🧹 Limpiando entorno Docker..."

read -p "¿Estás seguro? Esto eliminará todos los contenedores, imágenes y volúmenes del proyecto. (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Operación cancelada."
    exit 1
fi

echo "🛑 Deteniendo y eliminando contenedores y volúmenes del proyecto..."
docker-compose down -v 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true

echo "🗑️  Eliminando imágenes del proyecto..."
docker rmi bso-backend-dev bso-frontend-dev 2>/dev/null || true
docker rmi bso-backend-prod bso-frontend-prod 2>/dev/null || true
# Nombres alternativos por nombre de contenedor/imagen
docker rmi imposter-backend-dev imposter-frontend-dev 2>/dev/null || true
docker rmi imposter-backend-prod imposter-frontend-prod 2>/dev/null || true

echo "🧹 Limpiando sistema Docker (opcional)..."
read -p "¿Deseas ejecutar 'docker system prune'? Esto limpiará recursos no utilizados del sistema. (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker system prune -f
fi

echo "✅ Limpieza completada!"
