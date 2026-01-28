# 📝 Changelog - Imposter Premium

## [1.0.0-beta] - 2026-01-28

### 🎉 Primera versión Beta completa

**Estado:** ✅ Funcional y listo para pruebas

---

### ✨ Funcionalidades Implementadas

#### Backend
- ✅ Servidor Express con Socket.io para comunicación en tiempo real
- ✅ MongoDB integrado con Mongoose
- ✅ Sistema de salas con códigos de 6 caracteres
- ✅ Gestión de jugadores (crear, unirse, salir)
- ✅ 10 packs de palabras precargados (390+ palabras)
- ✅ API REST para gestión de packs
- ✅ Lógica completa del juego:
  - Reparto aleatorio de roles (civiles + impostores)
  - Sistema de votación con detección de empates
  - Múltiples rondas
  - Condiciones de victoria/derrota
- ✅ Modo personalizado (añadir palabras propias)

#### Frontend
- ✅ React 19 con Router 7
- ✅ Diseño dark mode con estética espacial/misteriosa
- ✅ Tailwind CSS 3.4.19
- ✅ Animaciones fluidas con Framer Motion 12
- ✅ PWA configurada con Service Workers
- ✅ Socket.io client con reconexión automática
- ✅ Páginas implementadas:
  - **Home:** Crear/unirse a salas
  - **Room:** Lobby de espera + selector de packs
  - **Game:** Juego completo con 4 fases
- ✅ Componentes:
  - PackSelector: Selección de packs de palabras
  - CustomWords: Modal para añadir palabras personalizadas
- ✅ Manejo de errores con feedback visual

#### Juego Completo
- ✅ **Fase 1: Revelación** - Cada jugador ve su rol (palabra secreta o IMPOSTOR)
- ✅ **Fase 2: Discusión** - Temporizador de 120 segundos + recordatorio de rol
- ✅ **Fase 3: Votación** - Sistema de votación para eliminar sospechosos
- ✅ **Fase 4: Resultados** - Pantalla de ganador con revelación de roles

#### Infraestructura
- ✅ Docker Compose para desarrollo local
- ✅ Docker Compose para producción
- ✅ Dockerfiles optimizados (multi-stage builds)
- ✅ Scripts de automatización (dev, prod, clean)
- ✅ Variables de entorno configuradas
- ✅ .dockerignore y .gitignore
- ✅ Nginx configurado para producción

---

### 📦 Packs de Palabras Incluidos

1. **Cine y Series** (40 palabras) - Películas, series, actores, personajes
2. **Deportes** (45 palabras) - Equipos, jugadores, competiciones
3. **Viajes y Lugares** (45 palabras) - Ciudades, países, monumentos
4. **Comida y Bebida** (45 palabras) - Platos, bebidas, postres
5. **Animales** (45 palabras) - Fauna de todo el mundo
6. **Tecnología** (45 palabras) - Marcas, gadgets, apps
7. **Música** (45 palabras) - Artistas, géneros musicales
8. **Profesiones** (40 palabras) - Oficios y trabajos
9. **Adultos** (25 palabras - 🔞) - Contenido para mayores de 18 años
10. **Modo Personalizado** - Añade tus propias palabras

**Total:** 370+ palabras precargadas

---

### 🛠️ Stack Tecnológico

**Backend:**
- Node.js 20 (Alpine)
- Express 5.2.1
- Socket.io 4.8.3
- Mongoose 9.1.5
- MongoDB 7.0
- CORS 2.8.6
- dotenv 17.2.3

**Frontend:**
- React 19.2.4
- React Router DOM 7.13.0
- Socket.io Client 4.8.3
- Framer Motion 12.29.2
- Zustand 5.0.10
- Tailwind CSS 3.4.19
- Vite 7.3.1
- PWA Plugin 1.2.0

**DevOps:**
- Docker & Docker Compose
- Nginx Alpine
- Nodemon 3.1.11

---

### 🐛 Problemas Conocidos y Soluciones

#### 1. WebSocket cerrado antes de conexión
- **Problema:** Error "WebSocket is closed before the connection is established"
- **Solución:** Usar transports: ['polling', 'websocket'] para empezar con polling
- **Estado:** ✅ Resuelto

#### 2. Warning HydrateFallback en React 19
- **Problema:** React 19 genera warnings de hydration innecesarios en SPAs
- **Solución:** Suprimir warnings específicos en main.jsx
- **Estado:** ✅ Resuelto

#### 3. Loop infinito en useEffect
- **Problema:** Socket en dependencias causaba re-renders infinitos
- **Solución:** Socket global compartido entre componentes
- **Estado:** ✅ Resuelto

#### 4. Salas se eliminan al navegar
- **Problema:** Socket se desconectaba al cambiar de componente
- **Solución:** Socket singleton global que persiste entre navegaciones
- **Estado:** ✅ Resuelto

#### 5. Eventos no recibidos en Game
- **Problema:** Timing de listeners vs emisión de eventos
- **Solución:** Listeners registrados antes + emisión individual a jugadores
- **Estado:** ✅ Resuelto

---

### 📊 Métricas de Pruebas

**Backend:**
- ✅ Health Check: 100%
- ✅ MongoDB Connection: 100%
- ✅ Socket.io Crear Sala: 100%
- ✅ Socket.io Unirse Sala: 100%
- ✅ Socket.io Actualizaciones: 100%
- ✅ Socket.io Desconexión: 100%

**Frontend:**
- ✅ HTTP Accesibilidad: 100%
- ✅ Título de página: 100%
- ✅ Meta tags: 100%
- ✅ React Scripts: 100%
- ✅ Vite Dev Server: 100%
- ✅ CSS Loading: 100%
- ✅ Backend Accesible: 100%
- ✅ Socket.io Client: 100%

**Tasa de éxito total:** **100%** (14/14 pruebas)

---

### 🚀 Cómo Ejecutar

#### Desarrollo Local
```bash
# Opción 1: Script automatizado
./scripts/docker-dev.sh

# Opción 2: Manual
docker-compose up -d
```

#### Producción
```bash
# Opción 1: Script automatizado
./scripts/docker-prod.sh

# Opción 2: Manual
docker-compose -f docker-compose.prod.yml up -d
```

#### Sin Docker
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

---

### 📝 Documentación

- [README.md](./README.md) - Visión general del proyecto
- [DOCKER.md](./DOCKER.md) - Guía completa de Docker
- [GAME_FEATURES.md](./GAME_FEATURES.md) - Funcionalidades del juego
- [TEST_REPORT.md](./TEST_REPORT.md) - Reporte de pruebas
- [MONITORING.md](./MONITORING.md) - Guía de monitoreo

---

### 🎯 Próximas Funcionalidades (Post-Beta)

- [ ] Configuración avanzada de juego (UI para ajustar impostores, tiempo)
- [ ] Chat en tiempo real durante la discusión
- [ ] Sistema de puntuación y rankings
- [ ] Estadísticas de partidas
- [ ] Más packs de palabras (idiomas, categorías temáticas)
- [ ] Modo espectador
- [ ] Sonidos y efectos de audio
- [ ] Avatares personalizados
- [ ] Sistema de amigos
- [ ] Historial de partidas

---

### 🙏 Créditos

**Desarrollado por:** Tiago Cruz  
**Fecha de lanzamiento Beta:** 28 de Enero, 2026  
**Inspirado en:** Imposter (Who is the Spy?) by Cosmicode Games  
**Stack:** React + Node.js + MongoDB + Socket.io  
**Licencia:** ISC

---

### 📊 Estadísticas del Proyecto

- **Líneas de código:** ~2,500+
- **Archivos creados:** 40+
- **Tiempo de desarrollo:** 1 día
- **Dependencias:** 20+ npm packages
- **Packs de palabras:** 10
- **Palabras totales:** 370+
- **Pruebas:** 14 (100% pasadas)

---

**Versión:** 1.0.0-beta  
**Estado:** ✅ Estable y funcional  
**Listo para:** Pruebas beta con usuarios reales
