# 📝 Changelog - Imposter

## [1.0.3] - 2026-01-30

### 🐛 Correcciones y mejoras UI

#### ✨ Mejoras

- ✅ **Footer en iOS**: Layout flex con scroll solo en `main`; footer fijo al fondo sin `position: fixed` para evitar que se mueva al hacer scroll en Safari iOS.
- ✅ **Home**: Una sola card que agrupa "Um só dispositivo", nombre, crear sala y entrar en sala para ganar espacio.
- ✅ **Espacio del título**: Menos margen entre el título IMPOSTOR y el logo/card.
- ✅ **Capitalización**: Primera letra de cada palabra en todas las traducciones (ES/PT) aplicada en el hook de traducciones.
- ✅ **Palabras personalizadas**: Desactivado temporalmente (botón en Home y categoría "Personalizado" en Local/online).

#### 📋 Notas

- Categoría aleatoria, iconos por categoría y cajas uniformes (`.card`) ya incluidos desde commits anteriores.

---

## [1.0.2] - 2026-01-30

### 📱 Móvil y tablet (iPhone, Android, iPad)

#### ✨ Mejoras

- ✅ **Viewport y teclado**: `viewport-fit=cover`, `interactive-widget=resize-visual` para mejor comportamiento del teclado en móvil/tablet.
- ✅ **Safe areas**: Contenido y footer respetan notch, Dynamic Island y home indicator (iOS); padding con `env(safe-area-inset-*)`.
- ✅ **Touch targets**: Botones y enlaces interactivos con mínimo 48px de altura; eliminado `touch-ignore` en controles táctiles.
- ✅ **Legibilidad**: Texto secundario en `text-sm` en Footer, PackSelector, Local, Home, Game.
- ✅ **Modal CustomWords**: Overlay con safe areas; contenido con `max-h-[85dvh]` y scroll para teclado en móvil.
- ✅ **Layout**: `min-h-full` en páginas (Home, Local, Room, Game, LocalGame) para evitar doble scroll; breakpoint `tablet: 600px` en Tailwind.
- ✅ **Tablet/iPad**: Contenido centrado con `tablet:max-w-3xl`, `lg:max-w-4xl` en el layout principal.
- ✅ **PWA**: `orientation: 'any'` en el manifest para permitir vertical y horizontal en tablets.

#### 📋 Notas

- Probado en iPhone, Android, iPad y tablets Android. Recomendado validar en dispositivo real.

---

## [1.0.1] - 2026-01-30

### 🔧 Producción y móvil

#### ✨ Mejoras

- ✅ **Adaptación móvil (iPhone / Android)**: Safe areas para notch, Dynamic Island y home indicator; utilidades `pt-content-safe` y `top-content-safe`; footer posicionado sobre el home indicator; contenedores scrollables en resultados/votación (`scroll-touch`, `max-h-[85dvh]`); touch targets mínimos 48px; inputs 16px en móvil para evitar zoom en iOS; viewport y `format-detection` en `index.html`.
- ✅ **Sin logs en producción**: Eliminados todos los `console.log` del frontend (Game, Home, CustomWords) y del backend en ejecución (server.js, config/db.js, seeds/wordPacks.js). Se mantienen `console.error` y `console.warn` para depuración de fallos. Los scripts manuales (update-words-monthly, tests, seed-standalone) conservan su salida por consola.

#### 📋 Notas

- **Seed**: Al arrancar, el backend borra todos los WordPacks y vuelve a ejecutar el seed (es-ES + pt-PT). Opción `npm run seed` en backend para ejecutar solo el seed.
- **Actualización mensual**: Script `scripts/update-words-monthly.js` para el día 1 (cron externo o GitHub Actions). Ver `DEPLOYMENT.md`.

---

## [1.0.0] - 2026-01-30

### 🎉 Versión estable 1.0.0

- **Estado:** Estable. Incluye todas las funcionalidades de la beta3.
- **Despliegue:** Blueprint Render con producción y desarrollo (impostor.netic.app, apiimp.netic.app, dev.\*). Ver `RENDER_ENVS.md` y `DEPLOYMENT.md`.

---

## [1.0.0-beta3] - 2026-01-30

### 🎯 Modo local, i18n, UX y correcciones

#### ✨ Nuevas Funcionalidades

- ✅ **Modo un solo dispositivo (local)**: Partidas locales sin servidor: añadir jugadores, elegir pack, reparto de roles con “pasa el móvil” y votación por turnos
- ✅ **Internacionalización (i18n)**: Soporte español y portugués con diccionarios (`es.json`, `pt.json`), contexto `LanguageContext`, hook `useTranslation` y selector de idioma en Home
- ✅ **Pantalla de “pasa el turno”**: UI segura para que cada jugador vea su rol y palabra en privado antes de pasar el dispositivo
- ✅ **API de packs por idioma**: El backend admite filtro opcional `locale` en `GET /api/packs` para solicitar packs por idioma
- ✅ **Palabras y categorías en el idioma seleccionado**: Al iniciar partida (online o nueva partida) se envía `locale`; el backend usa el pack en ese idioma (mismo slug) para palabra secreta y pista
- ✅ **Footer en todas las páginas**: “Desarrollado con ❤️ por Tiago Cruz” y versión de la app fijos en la parte inferior en todas las rutas
- ✅ **Nueva partida con los mismos jugadores (local)**: Botón “Nueva Partida” en resultados intermedios y finales lleva a selección de categoría con la misma lista de jugadores

#### 🐛 Correcciones

- ✅ **Resultados de votación**: Solo se cuentan votos de civiles para “impostor descubierto”; el voto del impostor no cuenta para eliminación ni para acertar
- ✅ **Colores en resultados**: Quien acertó al impostor se muestra en verde; quien no acertó, en rojo (online y local, resultados intermedios y finales)
- ✅ **Nueva partida local**: Al pulsar “Nueva Partida” se navega a `/local` con `keepPlayers`; la pantalla de categorías se muestra con los mismos jugadores sin volver a contador/votación

#### 🔧 Mejoras Técnicas

- ✅ **Frontend**: Rutas `/local` y `/local/game`, páginas `Local.jsx` y `LocalGame.jsx`, lógica local en `utils/localGameLogic.js`
- ✅ **UI localizada**: Textos traducidos en Home, Room, Game, PackSelector, CustomWords y flujo local
- ✅ **Backend**: `processVotes` en `gameLogic.js` cuenta solo votos de civiles para eliminación; `impostorDiscovered` solo si hay impostor y todos los civiles votaron por él
- ✅ **Versión**: La app muestra la versión desde `package.json` (Vite `define`); footer fijo con `fixed bottom-0`

---

## [1.0.0-beta2] - 2026-01-28

### 🎯 Mejoras y Correcciones

#### ✨ Nuevas Funcionalidades

- ✅ **Sistema de "Nueva Partida"**: El creador original de la sala puede iniciar una nueva partida desde los resultados
- ✅ **Selección múltiple de packs**: Los jugadores pueden seleccionar múltiples temas o todos los temas al crear una sala
- ✅ **Botón "Volver al Inicio"**: Disponible en todas las fases del juego (discusión, votación, resultados)
- ✅ **Persistencia de nombres**: Los nombres de los jugadores se mantienen entre partidas y reconexiones
- ✅ **Detección de impostor descubierto**: Cuando todos los civiles acertan, se muestra "El Impostor fue descubierto" en lugar de "eliminado"

#### 🐛 Correcciones de Bugs

- ✅ **Corregido**: El nombre del jugador ya no aparece en su propia lista de votación
- ✅ **Corregido**: Los resultados se muestran correctamente después de que todos votan
- ✅ **Corregido**: El juego procesa la votación inmediatamente cuando todos los civiles votan, sin esperar al impostor
- ✅ **Corregido**: El botón "Nueva Partida" solo aparece para el creador original de la sala
- ✅ **Corregido**: Los nombres de los jugadores se preservan correctamente al crear una nueva partida
- ✅ **Corregido**: Error `ROOM_NOT_FOUND` al intentar crear nueva partida desde resultados finales
- ✅ **Corregido**: El socket mantiene su referencia a la sala incluso después de que el juego termina

#### 🔧 Mejoras Técnicas

- ✅ **Backend**: Mejorado el manejo de `originalHostId` para identificar al creador original de la sala
- ✅ **Backend**: Optimizado el procesamiento de votaciones para no eliminar jugadores, solo mostrar resultados
- ✅ **Backend**: Mejorada la lógica de detección de "impostor descubierto" cuando todos los civiles acertan
- ✅ **Frontend**: Mejorado el filtrado de jugadores en la lista de votación
- ✅ **Frontend**: Mejorada la visualización de resultados mostrando quién votó por quién
- ✅ **Frontend**: Añadida lógica para re-unirse a la sala antes de crear nueva partida

#### 📊 Cambios en la Lógica del Juego

- ✅ **Sin eliminaciones**: El juego ya no elimina jugadores, solo muestra resultados
- ✅ **Sin empates**: Se eliminó la lógica de empates, solo se muestran resultados de votación
- ✅ **Resultados mejorados**:
  - Si todos los civiles acertan: Muestra "🎯 El Impostor fue descubierto: [nombre]"
  - Si no todos acertan: Solo muestra en verde a los jugadores que acertaron
  - El impostor siempre muestra "🕵️ IMPOSTOR" en los resultados
  - Los civiles muestran "→ [nombre del votado]" en los resultados

---

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

**Versión:** 1.0.0  
**Estado:** ✅ Estable
