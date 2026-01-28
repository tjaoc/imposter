# 🎮 Funcionalidades del Juego - Imposter v1.0.0-beta

**Fecha:** 28 de Enero, 2026  
**Estado:** ✅ Completo y funcional

---

## ✅ Funcionalidades Implementadas

### 🎯 Backend

#### 1. Packs de Palabras (MongoDB)

- ✅ **10 packs creados** y cargados en MongoDB
- Packs disponibles:
  1. **Cine y Series** (40 palabras) - Películas, series, actores
  2. **Deportes** (45 palabras) - Equipos, jugadores, competiciones
  3. **Viajes y Lugares** (45 palabras) - Ciudades, monumentos
  4. **Comida y Bebida** (45 palabras) - Platos, bebidas
  5. **Animales** (45 palabras) - Todo tipo de animales
  6. **Tecnología** (45 palabras) - Marcas, gadgets
  7. **Música** (45 palabras) - Artistas, géneros
  8. **Profesiones** (40 palabras) - Oficios y trabajos
  9. **Adultos** (25 palabras - 🔞) - Contenido +18
  10. **Modo Personalizado** - Para añadir tus propias palabras

#### 2. API REST para Packs

- `GET /api/packs` - Obtener todos los packs
- `GET /api/packs/:id` - Obtener pack específico con palabras
- `GET /api/packs/:id/random` - Obtener palabra aleatoria
- `POST /api/packs/custom` - Añadir palabra personalizada

#### 3. Eventos Socket.io del Juego

- `game:start` - Iniciar juego con pack seleccionado
- `game:role` - Enviar rol a cada jugador (palabra o impostor)
- `game:started` - Notificar que el juego comenzó
- `game:reveal-complete` - Confirmar que vio su rol
- `game:discussion-started` - Iniciar fase de discusión con temporizador
- `game:start-voting` - Iniciar fase de votación
- `game:vote` - Registrar voto de un jugador
- `game:vote-result` - Resultado de la votación
- `game:finished` - Juego terminado con ganador

#### 4. Lógica del Juego (utils/gameLogic.js)

- ✅ **Reparto de roles aleatorio** - N civiles + M impostores
- ✅ **Asignación de palabras secretas** - Solo civiles la reciben
- ✅ **Sistema de votación** - Con detección de empates
- ✅ **Condiciones de victoria:**
  - Impostores ganan: eliminan a todos los civiles o igualan su número
  - Civiles ganan: eliminan a todos los impostores
- ✅ **Múltiples rondas** - Si no hay ganador, nueva ronda

### 🎨 Frontend

#### 1. Componente PackSelector

- ✅ Muestra todos los packs disponibles
- ✅ Indicador de contenido adulto (🔞)
- ✅ Selección visual con animaciones
- ✅ Carga desde API

#### 2. Componente CustomWords

- ✅ Modal para añadir palabras personalizadas
- ✅ Lista de palabras añadidas
- ✅ Integración con API
- ✅ Diseño elegante con animaciones

#### 3. Página Room (Actualizada)

- ✅ Selector de packs para el host
- ✅ Botón "Iniciar Juego" habilitado solo cuando:
  - Hay 3+ jugadores
  - Se seleccionó un pack
- ✅ Navegación automática al juego cuando inicia

#### 4. Página Game (Completa)

Fases implementadas:

**a) Fase de Revelación** (revealing)

- ✅ Animación de carta volteándose
- ✅ Muestra "IMPOSTOR" 🕵️ o la palabra secreta 🎯
- ✅ Botón "Continuar" para confirmar
- ✅ Espera a que todos confirmen

**b) Fase de Discusión** (discussion)

- ✅ Temporizador en cuenta regresiva (MM:SS)
- ✅ Muestra tu rol/palabra durante la discusión
- ✅ Instrucciones para impostores y civiles
- ✅ Transición automática a votación

**c) Fase de Votación** (voting)

- ✅ Lista de todos los jugadores
- ✅ Selección de voto con feedback visual
- ✅ Deshabilita voto después de seleccionar
- ✅ Espera a que todos voten

**d) Pantalla de Resultados** (results)

- ✅ Muestra ganador (Impostores o Civiles)
- ✅ Revela la palabra secreta
- ✅ Muestra todos los roles
- ✅ Destaca quién fue el impostor
- ✅ Botón para volver al inicio

---

## 🎮 Flujo Completo del Juego

### 1. Crear/Unirse a Sala

1. Host crea sala o jugadores se unen con código
2. Esperan en el lobby hasta tener 3+ jugadores

### 2. Configurar y Empezar

1. Host selecciona un pack de palabras
2. Host hace clic en "Iniciar Juego"
3. Backend asigna roles aleatoriamente

### 3. Revelación de Roles ✅ IMPLEMENTADO

**Funcionalidad:** Cada jugador ve su rol de forma privada

**Implementación:**

1. Backend asigna roles aleatoriamente (N civiles + M impostores)
2. Cada jugador recibe su rol individualmente vía Socket.io
3. **Civiles** ven la palabra secreta en pantalla grande
4. **Impostores** ven "IMPOSTOR 🕵️" (sin palabra)
5. Animación de carta volteándose (Framer Motion)
6. Botón "Continuar" para confirmar que vieron su rol
7. Pantalla de espera mientras otros confirman

**Archivos:**

- `backend/utils/gameLogic.js` - Función `assignRoles()`
- `frontend/src/pages/Game.jsx` - Fase de revelación (líneas 158-211)

---

### 4. Fase de Discusión ✅ IMPLEMENTADO

**Funcionalidad:** Temporizador + discusión entre jugadores

**Implementación:**

1. Temporizador de 120 segundos (configurable)
2. Cuenta regresiva visual en formato MM:SS
3. Muestra tu rol/palabra durante la discusión
4. Instrucciones diferentes para civiles e impostores:
   - **Civiles:** "Habla sobre la palabra sin decirla directamente"
   - **Impostores:** "Intenta descubrir la palabra sin revelar que eres el impostor"
5. Al terminar el tiempo → transición automática a votación

**Archivos:**

- `backend/server.js` - Evento `game:discussion-started` (línea 310+)
- `frontend/src/pages/Game.jsx` - Fase de discusión (líneas 213-254)
- `frontend/src/pages/Game.jsx` - useEffect temporizador (líneas 105-118)

---

### 5. Sistema de Votación ✅ IMPLEMENTADO

**Funcionalidad:** Votación para eliminar sospechosos

**Implementación:**

1. Lista de todos los jugadores activos
2. Cada jugador selecciona a quién votar
3. Feedback visual al seleccionar (borde cyan + checkmark)
4. Botón se deshabilita después de votar
5. Mensaje de "Esperando a los demás..."
6. Backend cuenta votos cuando todos votaron
7. **Detección de empates** - Si hay empate, nadie es eliminado
8. Resultado mostrado con alert (nombre del eliminado)

**Archivos:**

- `backend/utils/gameLogic.js` - Función `processVotes()` (línea 50+)
- `backend/server.js` - Evento `game:vote` (línea 320+)
- `frontend/src/pages/Game.jsx` - Fase de votación (líneas 256-310)
- `frontend/src/pages/Game.jsx` - Función `handleVote()` (líneas 140-152)

---

### 6. Verificación de Victoria y Múltiples Rondas ✅ IMPLEMENTADO

**Funcionalidad:** Condiciones de victoria y sistema de rondas

**Implementación:**

1. Después de cada votación, backend verifica condiciones de victoria
2. **Impostores ganan si:**
   - Eliminan a todos los civiles
   - Número de impostores ≥ número de civiles
3. **Civiles ganan si:**
   - Eliminan a todos los impostores
4. **Si nadie ganó:**
   - Nueva ronda de discusión
   - Contador de ronda se incrementa
   - Votos se resetean
   - Temporizador se reinicia
5. Jugadores eliminados no participan en siguientes rondas

**Archivos:**

- `backend/utils/gameLogic.js` - Función `checkGameEnd()` (línea 85+)
- `backend/server.js` - Lógica de rondas en `game:vote` (línea 350+)

---

### 7. Pantalla de Resultados Finales ✅ IMPLEMENTADO

**Funcionalidad:** Muestra ganador y revela todos los roles

**Implementación:**

1. **Pantalla de victoria/derrota:**
   - Emoji 🎉 si ganaste, 😢 si perdiste
   - Título grande: "🕵️ Impostores Ganan!" o "🎯 Civiles Ganan!"
2. **Revelación de información:**
   - Palabra secreta destacada con efecto glow
   - Lista completa de jugadores con sus roles
   - Impostores marcados en rojo
   - Civiles con su palabra asignada
3. **Quién fue eliminado:**
   - Muestra el nombre del jugador eliminado en la última votación
4. **Botón "Volver al inicio":**
   - Navega de regreso a la home
   - Permite crear una nueva partida
5. **Animaciones:**
   - Entrada con scale animation
   - Diseño elegante con glass effect

**Archivos:**

- `backend/server.js` - Evento `game:finished` (línea 365+)
- `frontend/src/pages/Game.jsx` - Pantalla de resultados (líneas 312-376)

---

### 8. Modo Personalizado ✅ IMPLEMENTADO

**Funcionalidad:** Añadir palabras propias

**Implementación:**

1. **Modal CustomWords:**
   - Botón en Home: "✏️ Añadir palabras personalizadas"
   - Modal overlay con glass effect
   - Input para escribir palabras
   - Botón "+" para añadir
   - Enter para añadir rápido
2. **Lista de palabras añadidas:**
   - Muestra palabras de la sesión actual
   - Scroll si hay muchas palabras
   - Máximo 50 caracteres por palabra
3. **Backend:**
   - POST /api/packs/custom
   - Guarda en pack "Modo Personalizado" en MongoDB
   - Valida que la palabra no esté vacía
   - No permite duplicados
4. **Uso en el juego:**
   - Seleccionar "Modo Personalizado" en la sala
   - Juega con tus palabras customizadas

**Archivos:**

- `frontend/src/components/CustomWords.jsx` - Modal completo
- `backend/controllers/wordPackController.js` - `addCustomWord()` (línea 50+)
- `backend/routes/wordPacks.js` - POST /custom (línea 11)

---

## 🔧 Configuración del Juego

**En Room.jsx (settings):**

- `maxPlayers` - Máximo de jugadores (default: 12)
- `impostorCount` - Número de impostores (default: 1)
- `discussionSeconds` - Duración de discusión (default: 120s)

**Ajustable en el código:**

```javascript
settings: {
  maxPlayers: settings?.maxPlayers ?? 12,
  impostorCount: settings?.impostorCount ?? 1,
  discussionSeconds: settings?.discussionSeconds ?? 120,
}
```

---

## 📊 Estado Actual

### Backend

- ✅ Servidor funcionando en puerto 4000
- ✅ MongoDB conectado y con 10 packs
- ✅ 0 salas activas, 0 juegos activos
- ✅ Todos los eventos Socket.io implementados

### Frontend

- ✅ Servidor funcionando en puerto 3000
- ✅ Todos los componentes creados
- ✅ Animaciones con Framer Motion
- ✅ Diseño dark mode espacial

---

## 🎯 Cómo Probar el Juego Completo

### Opción 1: Multiples Ventanas del Navegador

1. **Ventana 1:** http://localhost:3000
   - Crea una sala como "Jugador1"
   - Selecciona un pack (ej: "Cine y Series")
   - Espera a que se unan más jugadores

2. **Ventana 2 (incógnito):** http://localhost:3000
   - Únete con el código de la sala como "Jugador2"

3. **Ventana 3 (otro navegador):** http://localhost:3000
   - Únete con el código de la sala como "Jugador3"

4. **En Ventana 1:** Haz clic en "Iniciar Juego"

5. **Todas las ventanas:**
   - Verán su rol (palabra o impostor)
   - Confirman con "Continuar"
   - Fase de discusión comienza
   - Luego votan
   - Ven resultados

### Opción 2: Modo Personalizado

1. En la home, clic en "✏️ Añadir palabras personalizadas"
2. Añade tus propias palabras
3. Crea una sala y selecciona "Modo Personalizado"
4. Juega con tus palabras

---

## 📝 Próximas Mejoras Posibles

- [ ] Configuración de juego (número de impostores, tiempo)
- [ ] Chat en tiempo real durante discusión
- [ ] Sonidos y efectos de audio
- [ ] Estadísticas y historial de partidas
- [ ] Modo espectador
- [ ] Más packs de palabras

---

**Estado:** ✅ **JUEGO COMPLETO Y FUNCIONAL**  
**Listo para jugar:** ✅ **SÍ**
