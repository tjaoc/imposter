# 🐳 Guía de Docker

Esta guía explica cómo usar Docker para desarrollo local y producción.

## 📋 Requisitos Previos

- Docker Desktop instalado y corriendo
- Docker Compose v3.8 o superior

## 🏠 Desarrollo Local

### Opción 1: Usando el script (Recomendado)

```bash
./scripts/docker-dev.sh
```

### Opción 2: Comandos manuales

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Servicios disponibles en desarrollo

- **Frontend**: <http://localhost:3000> (con hot reload)
- **Backend**: <http://localhost:4000> (con nodemon)
- **MongoDB**: localhost:27017

### Características de desarrollo

- ✅ Hot reload automático
- ✅ Volúmenes montados para edición en tiempo real
- ✅ MongoDB con datos persistentes
- ✅ Logs en tiempo real

## 🚀 Producción

### Opción 1: Usando el script (Recomendado)

```bash
./scripts/docker-prod.sh
```

### Opción 2: Comandos manuales

```bash
# Construir imágenes de producción
docker-compose -f docker-compose.prod.yml build

# Iniciar servicios
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Detener servicios
docker-compose -f docker-compose.prod.yml down
```

### Configuración de producción

1. **Crear archivo `.env.prod`** con tus variables de entorno:

```env
NODE_ENV=production
MONGO_USERNAME=admin
MONGO_PASSWORD=tu_password_seguro
MONGODB_URI=mongodb://admin:tu_password_seguro@mongodb:27017/imposter-premium?authSource=admin
```

1. **Configurar MongoDB con autenticación** (recomendado):

   - Edita `docker-compose.prod.yml` y descomenta las variables de entorno de MongoDB
   - Añade las credenciales en `.env.prod`

2. **Configurar dominio y SSL**:
   - Configura un reverse proxy (nginx/traefik) si es necesario
   - Configura certificados SSL para HTTPS

### Características de producción

- ✅ Imágenes optimizadas (multi-stage build)
- ✅ Usuario no-root en contenedores
- ✅ Healthchecks configurados
- ✅ Sin hot reload (mejor rendimiento)
- ✅ Nginx para servir frontend estático

## 🧹 Limpieza

Para limpiar contenedores, imágenes y volúmenes:

```bash
./scripts/docker-clean.sh
```

O manualmente:

```bash
# Detener y eliminar contenedores y volúmenes
docker-compose down -v
docker-compose -f docker-compose.prod.yml down -v

# Eliminar imágenes
docker rmi imposter-backend-dev imposter-frontend-dev
docker rmi imposter-backend-prod imposter-frontend-prod
```

## 📊 Comandos Útiles

### Ver logs en tiempo real

```bash
# Desarrollo
docker-compose logs -f backend
docker-compose logs -f frontend

# Producción
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Ejecutar comandos dentro de contenedores

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh
```

### Reiniciar un servicio específico

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Ver estado de servicios

```bash
docker-compose ps
docker-compose -f docker-compose.prod.yml ps
```

## 🔧 Personalización

### Override de configuración local

Crea un archivo `docker-compose.override.yml` (no se commitea) para personalizar tu entorno:

```yaml
version: '3.8'

services:
  backend:
    environment:
      - DEBUG=*
    ports:
      - '4001:4000' # Cambiar puerto si es necesario
```

## 🐛 Troubleshooting

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :4000

# Cambiar puertos en docker-compose.yml
```

### MongoDB no conecta

```bash
# Verificar que MongoDB está corriendo
docker-compose ps mongodb

# Ver logs de MongoDB
docker-compose logs mongodb

# Reiniciar MongoDB
docker-compose restart mongodb
```

### Reconstruir imágenes

```bash
# Forzar reconstrucción sin cache
docker-compose build --no-cache
```

### Limpiar todo y empezar de nuevo

```bash
./scripts/docker-clean.sh
./scripts/docker-dev.sh
```

## 📝 Notas Importantes

- **Desarrollo**: Los cambios en el código se reflejan automáticamente gracias a los volúmenes montados
- **Producción**: Necesitas reconstruir las imágenes después de cambios en el código
- **MongoDB**: Los datos persisten en volúmenes Docker, no se pierden al reiniciar
- **Seguridad**: En producción, configura autenticación de MongoDB y usa HTTPS

## 🔒 Seguridad en Producción

1. ✅ Configura autenticación de MongoDB
2. ✅ Usa variables de entorno seguras (no las commitees)
3. ✅ Configura firewall en el servidor
4. ✅ Usa HTTPS con certificados SSL válidos
5. ✅ Limita acceso a puertos sensibles (MongoDB no debe ser público)
6. ✅ Configura backups regulares de MongoDB
7. ✅ Monitorea logs regularmente
