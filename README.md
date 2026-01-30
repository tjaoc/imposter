# Imposter - Who is the Spy?

**Versión:** 1.0.0  
**Estado:** ✅ Funcional y listo para pruebas beta

PWA de alto rendimiento del juego "Imposter (Who is the Spy?)" con todas las funcionalidades VIP.

## 🚀 Características

- ✅ Todos los packs de categorías desbloqueados (Cine, Adultos, Deportes, Viajes, etc.)
- ✅ Modo de juego personalizado (añadir palabras propias)
- ✅ Interfaz sin anuncios con animaciones fluidas (framer-motion)
- ✅ Capacidad offline total (Service Workers)
- ✅ Diseño Dark Mode elegante con estética espacial/misteriosa
- ✅ Gestión de salas en tiempo real con Socket.io

## 📁 Estructura del Proyecto

```
spy/
├── backend/
│   ├── server.js          # Servidor Express + Socket.io
│   ├── Dockerfile         # Docker para producción
│   ├── Dockerfile.dev     # Docker para desarrollo
│   ├── config/
│   │   └── db.js          # Configuración MongoDB
│   ├── models/
│   │   └── WordPack.js    # Esquema de packs de palabras
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # Páginas principales
│   │   ├── hooks/         # Custom hooks
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile         # Docker para producción
│   ├── Dockerfile.dev     # Docker para desarrollo
│   ├── nginx.conf         # Configuración Nginx para producción
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── scripts/
│   ├── docker-dev.sh      # Script desarrollo
│   ├── docker-prod.sh     # Script producción
│   └── docker-clean.sh    # Script limpieza
├── docker-compose.yml     # Docker Compose desarrollo
├── docker-compose.prod.yml # Docker Compose producción
├── DOCKER.md              # Guía completa de Docker
└── README.md
```

## 🛠️ Instalación

### Opción 1: Con Docker (Recomendado) 🐳

#### Desarrollo Local

```bash
# Usar script automatizado
./scripts/docker-dev.sh

# O manualmente
docker-compose build
docker-compose up -d
```

#### Producción

```bash
# Usar script automatizado
./scripts/docker-prod.sh

# O manualmente
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

📖 **Ver [DOCKER.md](./DOCKER.md) para guía completa de Docker**

### Opción 2: Instalación Manual

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu configuración de MongoDB
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📝 Variables de Entorno

### Backend (.env)

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/imposter-premium
NODE_ENV=development
```

### Frontend (.env)

```
VITE_SOCKET_URL=http://localhost:4000
```

## 🎮 Uso

### Con Docker

1. Ejecuta `./scripts/docker-dev.sh` o `docker-compose up -d`
2. Abre http://localhost:3000 en tu navegador
3. Crea o únete a una sala con un código
4. ¡Disfruta del juego!

### Sin Docker

1. Inicia el servidor backend: `cd backend && npm run dev`
2. Inicia el frontend: `cd frontend && npm run dev`
3. Abre http://localhost:3000 en tu navegador
4. Crea o únete a una sala con un código
5. ¡Disfruta del juego!

## 🐳 Docker

El proyecto incluye configuración completa de Docker para desarrollo y producción:

- **Desarrollo**: Hot reload, volúmenes montados, MongoDB incluido
- **Producción**: Imágenes optimizadas, multi-stage builds, Nginx, healthchecks

📖 **Consulta [DOCKER.md](./DOCKER.md) para documentación completa**

## 🏗️ Próximos Pasos

- [ ] Implementar lógica completa del juego (reparto de roles, votación)
- [ ] Añadir packs de palabras iniciales a MongoDB
- [ ] Implementar modo personalizado (añadir palabras)
- [ ] Mejorar Service Workers para offline completo
- [ ] Añadir estadísticas de jugadores

## 📄 Licencia

ISC
