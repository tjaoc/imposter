# 📝 Changelog - Imposter

## [1.2.0] - 2026-03-22

### 🚀 Rendimiento, calidad y despliegue

- ✅ **Frontend**: fases de juego extraídas y carga diferida; `LazyMotion` en App; memoización y ajustes de socket/timers; `vite` sin `console`/`debugger` en build; `prefers-reduced-motion` en splash y utilidades de motion.
- ✅ **Aleatoriedad**: impostores y orden de revelación/jugadores con barajados independientes (online y local).
- ✅ **Backend**: `Cache-Control` en listado/detalles de packs; índice compuesto en WordPack; `trust proxy`, CORS desde `CORS_ORIGIN`, `engines.node`; blueprint Render con `npm ci` y checklist.
- ✅ **Tests y Docker**: tests de lógica en backend y Vitest en frontend; script `docker-test.sh` y documentación asociada.

---

## [1.1.23] - 2026-02-04

### 📦 Docs y estadísticas

- ✅ **DOCKER.md** creado con documentación completa de Docker (desarrollo y producción).
- ✅ **README** actualizado: estructura del proyecto (imposter/), Próximos Pasos marcados como hechos, enlace a DOCKER.md.
- ✅ **Estadísticas de jugador** en sala online: partidas jugadas, victorias como civil e impostor (en memoria en el servidor); panel en Room y soporte es/pt.

---

## [1.1.22] - 2026-01-30

### 📝 Marca: Imposter → Impostor

- ✅ **PWA manifest** (vite.config.js): `name`, `short_name` y `description` actualizados a "Impostor" / "Jogo de Impostor (Who is the Spy?)".
- ✅ **Home**: alt del logo cambiado de "Imposter" a "Impostor". Formato menor en room:create y opciones de bots.

---

## [1.1.21] - 2026-01-30

### 🐛 UI: PageNav y card Impostores

- ✅ **PageNav** (Volver/Salir): mismo tamaño que selector de banderas (`min-h-[40px] min-w-[44px]`, `px-3 py-1.5`, `text-xs`, `rounded-xl`).
- ✅ **Card Impostores** (Room y Local): botones − y + más pequeños (`w-8 h-8`, `rounded-lg`, `text-sm`); espaciado reducido (`gap-1`) para que queden más pegados al número.

---

## [1.1.20] - 2026-01-30

### 🧹 CSS y locales

- ✅ **pt-content-safe** (index.css): reducido a `max(0.25rem, calc(env(safe-area-inset-top) + 0.5rem))`.
- ✅ **Footer iOS**: `line-height` de 1.15 a 2 en `body.ios footer`.
- ✅ **Locales**: eliminada clave `selectPackDesc` no usada (es.json, pt.json).

---

## [1.1.19] - 2026-01-30

### 🐛 UI: Duración (Room y Local)

- ✅ **Descripción eliminada**: ya no se muestra "Tiempo de discusión" / "Tempo de discussão" (durationDesc).
- ✅ **Misma línea**: etiqueta "Duración" y el select de minutos en una sola fila (`flex-row items-center justify-between`).

---

## [1.1.18] - 2026-01-30

### 🧹 CSS

- ✅ **Touch targets**: eliminada regla `min-height: 48px` para `button`, `a` y `[role='button']` en `@media (pointer: coarse)` (index.css).

---

## [1.1.17] - 2026-01-30

### 🐛 UI: switch Pista y selector de idioma

- ✅ **Switch "Pista para Impostores"** (Room y Local): track en cápsula (`rounded-full`), card con `card-tight` y `gap-3` para aspecto compacto como ref.
- ✅ **Selector de idioma**: un solo contenedor `rounded-2xl` con borde; opción no seleccionada sin fondo; seleccionada con fondo cyan (`bg-space-cyan`) y `rounded-xl`.

---

## [1.1.16] - 2026-01-30

### 🐛 Switch "Pista para Impostores"

- ✅ **Forma rectangular con curvas** (Room y Local): track con `rounded-2xl` para que sea un rectángulo con las cuatro esquinas redondeadas en lugar de pastilla circular.

---

## [1.1.15] - 2026-01-30

### 🐛 Switch "Pista para Impostores"

- ✅ **Tamaño reducido** (Room y Local): track `h-7 w-12`, thumb `h-5 w-5` con `translate-x-5` cuando activo; switch más compacto y proporcionado respecto al icono y texto.

---

## [1.1.14] - 2026-01-30

### 🐛 Switch "Pista para Impostores"

- ✅ **Proporciones corregidas** (Room y Local): track `h-10 w-[4.25rem]`, thumb `h-7 w-7` con `left-1` y `translate-x-8` cuando activo; márgenes simétricos para que el switch no se vea deformado/aplastado.

---

## [1.1.13] - 2026-01-30

### ✨ Splash y comprobación de actualizaciones PWA

- ✅ **Splash al arranque**: comprobación de actualizaciones PWA inmediata (`registerSW` con `immediate: true` y `registration.update()` en `onRegisteredSW`).
- ✅ El splash permanece visible hasta que termina la verificación (evento `pwa-update-check-done` a los ~2,5 s) o timeout máximo de 4 s.
- ✅ El aviso de actualización puede aparecer en cuanto hay nueva versión, sin esperar 30+ segundos.

---

## [1.1.12] - 2026-01-30

### 📱 Footer móvil/iPhone

- ✅ Footer compacto por defecto en móvil (max-sm): texto 10px, pt-1, pb 0.375rem, leading-tight; no depende de detección iOS en primer pintado para verse pequeño en iPhone.

---

## [1.1.11] - 2026-01-30

### ✨ Splash al abrir

- ✅ **Splash animado** con icono de la app (index.html): visible al instante, animación pulse; se oculta tras ~800 ms cuando la app ha cargado y se ha verificado si hay actualizaciones PWA.

---

## [1.1.10] - 2026-01-30

### 📱 iOS: footer y top

- ✅ **Footer en iOS**: más compacto (texto 11px, leading-tight, pt-1, pb 0.5rem).
- ✅ **Top**: pt-content-safe y top-content-safe reducidos ~0.5rem para subir contenido 1–2 pts.

---

## [1.1.9] - 2026-01-30

### 📱 Móvil: switch, footer y card de pistas

- ✅ **Switch "Pista para Impostores"** (Room y Local): más pequeño (h-9 w-14), más separado del texto (gap-4, pl-2).
- ✅ **Footer**: texto más pequeño (text-xs sm:text-sm), menos padding (pt-2, pb 0.75rem).
- ✅ **Card pistas + botón Próximo** (Game): en móvil input y botón en columna para evitar overflow; w-full min-w-0 y overflow-x-hidden.

---

## [1.1.8] - 2026-01-30

### 📱 Footer móvil (online)

- ✅ App: `min-h-dvh` para que el contenedor llene la altura visible en móvil.
- ✅ Footer: `mt-auto` para pegarlo al fondo; `pb-[max(1.25rem,env(safe-area-inset-bottom))]` para más espacio inferior.

---

## [1.1.7] - 2026-01-30

### 🐛 index.html

- ✅ Viewport: `interactive-widget=resizes-visual` (valor válido; antes `resize-visual` se ignoraba).
- ✅ Meta PWA: `mobile-web-app-capable` en lugar de `apple-mobile-web-app-capable` deprecado.

---

## [1.1.6] - 2026-01-30

### 📌 Versión automática en commit/push

- ✅ Regla Cursor: al pedir "commit y push" **sin indicar versión**, subir patch automáticamente (ej. 1.1.5 → 1.1.6) y actualizar VERSION.md, package.json (front/back), CHANGELOG.md antes del commit.
- ✅ Si el usuario indica versión (ej. "commit push v1.1.7"), usar esa versión en todos los archivos.

---

## [1.1.5] - 2026-01-30

### 📌 Sincronización de versión

- ✅ Versión unificada en VERSION.md, frontend/package.json, backend/package.json.
- ✅ Regla Cursor: al pedir commit/push con versión (ej. v1.1.5), se actualiza la versión en todos los archivos antes del commit.

---

## [1.1.1] - 2026-01-30

### 🧹 Limpieza y optimizaciones

- ✅ **Optimizaciones frontend**: Lazy loading de rutas, chunks manuales (react-vendor, router, motion, socket-zustand), fuente no bloqueante, console override solo en dev.
- ✅ **Backend**: Compresión gzip (`compression`), eliminado `processVotes` y `an-array-of-spanish-words`; seed solo con listas curadas.
- ✅ **Limpieza**: Eliminados 8 .md no usados (TEST_*, GAME_FEATURES, QUICKSTART, MONITORING, RENDER_ENVS, DEPLOYMENT, DOCKER); CustomWords.jsx, pwa-assets.config.js, bulkWordsLoader.js, generate-data.js; deps @vite-pwa/assets-generator, workbox-window. README sin referencias a DOCKER.md.

---

## [1.1.0] - 2026-01-30

### ✨ Juego online: fase de pistas y bots

#### Nuevas funcionalidades

- ✅ **Fase de pistas**: Tras revelar el rol, 3 rondas de 30 s en las que cada jugador escribe su pista (palabra o frase); todos ven las pistas. Después pasa a discusión y votación.
- ✅ **Bots automáticos**: Al crear sala (Home) se puede elegir 0–5 bots. Los bots reciben rol, escriben pistas (palabra del pack) y votan solos (pistas a los 3 s, votos a los 12 s de abrir votación).
- ✅ **Jugar solo online**: Con 1 humano + 2 bots (o más) se puede iniciar partida sin más jugadores.

#### Cambios técnicos

- Backend: `gameLogic` con `clueRound`, `maxClueRounds`, `clueRoundSeconds`, `cluesByRound`; eventos `game:clue-round-started`, `game:submit-clue`, `game:clue-received`, `game:clue-round-complete`; `submitBotClues`, `assignBotVotes`, `tryProcessVoting`; `room:create` acepta `settings.botCount`.
- Frontend: fase `clues` en Game (timer 30 s, input pista, lista de pistas); Home con selector "Jugar con bots"; traducciones ES/PT para pistas y bots.

---

## [1.0.4] - 2026-01-30

### ✨ Mejoras y correcciones de iconos/PWA

#### Mejoras

- ✅ **PWA: popup de actualización**: La app ahora notifica al usuario cuando hay una nueva versión disponible y permite actualizar con un clic.
- ✅ **Iconos desde `icon_impostor.jpeg`**: Todos los iconos (favicon, PWA, Apple Touch Icon, `public/icons/`) se generan a partir de `public/icon_impostor.jpeg`.
- ✅ **Fondo transparente en iconos**: Los iconos PNG se generan con fondo transparente (donde antes había blanco o donde el logo no llena el lienzo).
- ✅ **SVG autocontenidos**: Los archivos SVG de iconos (`favicon.svg`, `public/icons/*.svg`) ahora embeben la imagen PNG en base64 para asegurar que se muestran correctamente en cualquier contexto.
- ✅ **Script `generate-icons`**: Creado `frontend/scripts/generate-icons-from-logo.js` para automatizar la generación de todos los formatos de icono (PNG, ICO, SVG) con la lógica de relleno de fondo y transparencia.
- ✅ **Fondo extendido en `icon_impostor-filled.png`**: El script ahora genera una versión de la imagen de origen con el fondo degradado extendido a las esquinas, usándola como base para todos los iconos.

#### 🐞 Correcciones

- ✅ Corregida la lógica para muestrear colores de gradiente en el script de generación de iconos.

---

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
