# 🐳 Docker - Imposter

Documentación de la configuración Docker para desarrollo y producción.

## Resumen

| Entorno      | Compose              | Frontend     | Backend      | MongoDB      |
|-------------|----------------------|--------------|--------------|--------------|
| Desarrollo  | `docker-compose.yml` | :3000        | :4000        | :27017       |
| Producción  | `docker-compose.prod.yml` | :80 (Nginx) | :4000        | interno      |

## Desarrollo

### Requisitos

- Docker y Docker Compose
- Ninguna instalación local de Node o MongoDB

### Uso rápido

```bash
./scripts/docker-dev.sh
```

O manualmente:

```bash
docker-compose build
docker-compose up -d
```

### Servicios en desarrollo

- **Frontend** (Vite): http://localhost:3000 — hot reload, volúmenes montados
- **Backend** (Express + Socket.io): http://localhost:4000 — `npm run dev` con nodemon
- **MongoDB**: localhost:27017 — base de datos `imposter`, datos en volumen `mongodb_data`

### Pruebas (tests + build) con Docker

No hace falta tener `docker compose up` en marcha. Usa las imágenes de desarrollo y volúmenes no persistentes:

```bash
chmod +x ./scripts/docker-test.sh   # solo la primera vez
./scripts/docker-test.sh
```

Equivale a:

- `docker compose build backend frontend`
- `docker compose run --rm --no-deps backend npm test` (lógica `gameLogic` con Node `node:test`)
- `docker compose run --rm --no-deps frontend npm test` (Vitest: `localGameLogic`)
- `docker compose run --rm --no-deps frontend npm run build` (comprueba Vite en el contenedor)

Si ya tienes contenedores levantados, también puedes:

```bash
docker compose exec backend npm test
docker compose exec frontend npm test
docker compose exec frontend npm run build
```

### Comandos útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Logs solo del backend
docker-compose logs -f backend

# Detener todo
docker-compose down

# Reconstruir sin caché
./scripts/docker-dev.sh --no-cache
```

### Variables de entorno (desarrollo)

Definidas en `docker-compose.yml`:

- Backend: `NODE_ENV=development`, `PORT=4000`, `MONGODB_URI=mongodb://mongodb:27017/imposter`
- Frontend: `VITE_SOCKET_URL=http://localhost:4000` (el navegador se conecta al backend en tu máquina)

---

## Producción

### Uso rápido

```bash
# Opcional: crear .env.prod si el script lo pide
./scripts/docker-prod.sh
```

O manualmente:

```bash
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### Servicios en producción

- **Frontend**: puerto 80 — build estático servido por Nginx (imagen multi-stage)
- **Backend**: puerto 4000 — Node en modo producción, healthcheck en `/health`
- **MongoDB**: solo red interna, sin puertos expuestos (recomendado)

### Imágenes

- **Backend**: `Dockerfile` con target `production` — usuario no-root, solo dependencias de producción
- **Frontend**: `Dockerfile` — stage builder (Node) + stage production (Nginx Alpine), healthcheck con `wget`

### Healthchecks

- Backend: `GET http://localhost:4000/health` → 200
- Frontend: `wget --spider http://localhost/` → éxito

### Volúmenes

- `mongodb_data_prod`: datos de MongoDB
- `mongodb_config_prod`: configuración de MongoDB

### Seguridad en producción

- No exponer MongoDB al host salvo que sea necesario
- Configurar autenticación de MongoDB con `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` y ajustar `MONGODB_URI`
- Usar HTTPS (reverse proxy externo o descomentar el servicio nginx en `docker-compose.prod.yml`)
- Revisar variables en `.env.prod` antes de desplegar

---

## Estructura de archivos Docker

```
imposter/
├── docker-compose.yml        # Desarrollo (Mongo + Backend + Frontend)
├── docker-compose.prod.yml   # Producción (mismos servicios, builds de prod)
├── backend/
│   ├── Dockerfile            # Multi-stage: development + production
│   └── Dockerfile.dev        # Solo desarrollo (nodemon)
└── frontend/
    ├── Dockerfile            # Builder + Nginx
    ├── Dockerfile.dev        # Solo desarrollo (Vite)
    └── nginx.conf            # Configuración Nginx (SPA + /health, /sw.js)
```

---

## Limpieza

Script para eliminar contenedores, redes y volúmenes no usados:

```bash
./scripts/docker-clean.sh
```

**Cuidado:** en desarrollo, `docker-compose down -v` elimina los volúmenes y con ellos los datos de MongoDB.
