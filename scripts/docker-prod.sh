#!/bin/bash

# Script para producción con Docker

set -e

echo "🚀 Iniciando despliegue de producción..."

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker no está corriendo. Por favor inicia Docker Desktop."
    exit 1
fi

# Verificar variables de entorno
if [ ! -f .env.prod ]; then
    echo "⚠️  Archivo .env.prod no encontrado."
    echo "📝 Creando archivo .env.prod de ejemplo..."
    cat > .env.prod << EOF
# Variables de entorno para producción
NODE_ENV=production
MONGO_USERNAME=admin
MONGO_PASSWORD=change_me_secure_password
MONGODB_URI=mongodb://admin:change_me_secure_password@mongodb:27017/imposter-premium?authSource=admin
EOF
    echo "✅ Archivo .env.prod creado. Por favor edítalo con tus valores reales."
    exit 1
fi

# Construir imágenes de producción
echo "📦 Construyendo imágenes de producción..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🛑 Deteniendo contenedores anteriores (si existen)..."
docker-compose -f docker-compose.prod.yml down

echo "🔧 Iniciando servicios de producción..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

# Verificar estado
echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Despliegue de producción completado!"
echo ""
echo "📍 Servicios disponibles:"
echo "   - Frontend: http://localhost (o tu dominio)"
echo "   - Backend:  http://localhost:4000"
echo ""
echo "📝 Comandos útiles:"
echo "   - Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   - Detener:  docker-compose -f docker-compose.prod.yml down"
echo "   - Reiniciar: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔒 Recuerda:"
echo "   - Configurar firewall y seguridad"
echo "   - Configurar SSL/HTTPS"
echo "   - Configurar backups de MongoDB"
echo "   - Revisar logs regularmente"
