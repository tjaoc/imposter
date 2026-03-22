# 🎮 Imposter - Version 1.2.0

**Fecha de lanzamiento:** 22 de Marzo, 2026  
**Estado:** ✅ Estable

---

## 🎯 Resumen de la Versión

**v1.2.0** – Rendimiento (Game por fases, LazyMotion, optimizaciones), aleatoriedad de impostores y orden de jugadores, tests y Docker, despliegue Render (CORS, trust proxy, npm ci).  
**v1.1.21** – PageNav (Volver/Salir): mismo tamaño que selector de banderas (min-h-40, min-w-44, text-xs). Card Impostores: botones − y + más pequeños (w-8 h-8) y más pegados al número (gap-1).  
**v1.1.20** – CSS: pt-content-safe reducido; footer iOS line-height 2; locales: eliminada clave selectPackDesc no usada.  
**v1.1.19** – Duración (Room y Local): eliminada descripción "Tiempo de discusión"; etiqueta "Duración" y select en la misma línea.  
**v1.1.18** – CSS: eliminada regla de touch targets (min-height: 48px en botones/enlaces en pointer: coarse).  
**v1.1.17** – Switch Pista como ref.: track en cápsula (rounded-full), card-tight; selector de idioma: un contenedor, opción seleccionada con fondo cyan redondeado.  
**v1.1.16** – Switch "Pista para Impostores" (Room y Local): track con forma rectangular y curvas en los 4 lados (rounded-2xl).  
**v1.1.15** – Switch "Pista para Impostores" (Room y Local): tamaño reducido (track h-7 w-12, thumb h-5 w-5) para que no domine la fila.  
**v1.1.14** – Switch "Pista para Impostores" (Room y Local): proporciones corregidas (track h-10, thumb h-7, márgenes simétricos) para que no se vea deformado.  
**v1.1.13** – Splash al arranque: comprobación de actualizaciones PWA inmediata (registerSW immediate + registration.update); splash visible hasta que termina la verificación o timeout 4s.  
**v1.1.12** – Footer en móvil/iPhone: compacto por defecto (max-sm: 10px, menos padding); no depende de detección iOS en primer pintado.  
**v1.1.11** – Splash animado con icono de la app al abrir; se oculta al cargar contenido y verificación de actualizaciones.  
**v1.1.10** – iOS: footer más compacto (texto 11px, menos padding); top subido 1–2 pts (pt-content-safe y top-content-safe).  
**v1.1.9** – Móvil: switch Pista más pequeño y separado del texto; footer más compacto; card pistas + botón Próximo sin overflow (flex-col en móvil).  
**v1.1.8** – Footer móvil: min-h-dvh en App, mt-auto y más padding inferior en Footer para pegarlo al fondo.  
**v1.1.7** – Viewport: interactive-widget=resizes-visual; meta mobile-web-app-capable (reemplaza deprecado).  
**v1.1.6** – Bump automático de versión en commit/push; regla actualizada para subir patch si no se indica versión.  
**v1.1.5** – Sincronización de versión en todo el proyecto; regla Cursor para actualizar versión automáticamente en commit/push.  
**v1.1.2** – Corrección botón "Nueva Partida" en juego online (con/sin bots): backend siempre responde, room.settings asegurado, frontend solo emite tras room:join ok y timeout de respuesta.  
**v1.1.1** – Optimizaciones de rendimiento, compresión backend y limpieza de proyecto (código/deps/docs no usados).  
**v1.1.0** – Fase de pistas (3 rondas de 30 s) y bots automáticos en juego online.

### ✨ Características Principales

- ✅ **Fase de pistas (v1.1.0)** - 3 rondas de 30 s: cada jugador escribe su pista, todos la ven; luego discusión y votación
- ✅ **Bots automáticos (v1.1.0)** - Al crear sala puedes añadir 0–5 bots; ponen pistas y votan solos
- ✅ **10 packs de palabras desbloqueados** (370+ palabras)
- ✅ **Sin anuncios** - Experiencia premium sin interrupciones
- ✅ **Multijugador en tiempo real** - Socket.io para sincronización perfecta
- ✅ **Diseño dark mode elegante** - Estética espacial/misteriosa
- ✅ **Animaciones fluidas** - Framer Motion en todas las transiciones
- ✅ **PWA configurada** - Instalar y jugar offline
- ✅ **Responsive** - Funciona en móviles y desktop
- ✅ **Optimizado móvil/tablet (v1.0.2)** - iPhone, Android, iPad y tablets Android: safe areas, teclado, max-width en tablet, PWA orientation any

---

## 🎮 Cómo Funciona

### Sistema de Juego (online)

1. **Mínimo 3 jugadores** - Humanos y/o bots (máximo 12)
2. **1-2 impostores** - El resto son civiles
3. **Palabra secreta** - Solo los civiles la conocen
4. **3 rondas de pistas (30 s cada una)** - Cada uno escribe su pista; todos la ven
5. **Discusión** - Descubre quién es el impostor
6. **Votación** - Elimina a los sospechosos
7. **Múltiples rondas** - Hasta que haya un ganador

### Condiciones de Victoria

- **Civiles ganan:** Eliminan a todos los impostores
- **Impostores ganan:** Eliminan a suficientes civiles (≥ número de impostores)

---

## 📊 Especificaciones Técnicas

### Rendimiento

- ✅ Tiempo de respuesta backend: <50ms
- ✅ Tiempo de carga frontend: <100ms
- ✅ Socket.io latencia: <30ms
- ✅ Memoria backend: ~60MB
- ✅ Memoria frontend: ~75MB
- ✅ Memoria MongoDB: ~75MB

### Escalabilidad

- ✅ Soporte para múltiples salas simultáneas
- ✅ Múltiples juegos concurrentes
- ✅ Sistema de salas aisladas
- ✅ Manejo de desconexiones

### Seguridad

- ✅ CORS configurado
- ✅ Validación de datos
- ✅ Sanitización de inputs
- ✅ Manejo de errores robusto

---

## 🐳 Docker

### Desarrollo Local

```bash
docker-compose up -d
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:4000>
- MongoDB: localhost:27017

### Producción

```bash
docker-compose -f docker-compose.prod.yml up -d
```

- Frontend optimizado con Nginx
- Backend con usuario no-root
- MongoDB con persistencia

---

## 📦 Paquetes y Dependencias

### Últimas Versiones (Enero 2026)

- React: 19.2.4
- Express: 5.2.1
- Socket.io: 4.8.3
- Mongoose: 9.1.5
- Vite: 7.3.1
- Tailwind CSS: 3.4.19
- Framer Motion: 12.29.2

---

## ✅ Testing

**Pruebas Automatizadas:**

- 6 pruebas de backend (100% pasadas)
- 8 pruebas de frontend (100% pasadas)
- Scripts disponibles en `/scripts/`

**Pruebas Manuales:**

- ✅ Crear sala
- ✅ Unirse a sala
- ✅ Seleccionar pack
- ✅ Iniciar juego
- ✅ Revelar roles
- ✅ Fase de discusión
- ✅ Sistema de votación
- ✅ Pantalla de resultados
- ✅ Modo personalizado

---

## 🔧 Configuración

### Variables de Entorno

**Backend (.env):**

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/imposter-premium
NODE_ENV=development
```

**Frontend (.env):**

```env
VITE_SOCKET_URL=http://localhost:4000
```

---

## 📝 Notas de la Beta

### Lo que funciona perfectamente ✅

- Creación y gestión de salas
- Sistema de Socket.io en tiempo real
- Todas las fases del juego
- Sistema de votación
- Modo personalizado
- Diseño y animaciones

### Mejoras futuras 🚀

- Configuración de juego desde UI (actualmente en código)
- Chat en tiempo real
- Sonidos
- Estadísticas persistentes
- Más idiomas

---

## 🎯 Para Usuarios Beta

### Cómo Probar

1. Ejecuta: `docker-compose up -d`
2. Abre: <http://localhost:3000>
3. Crea una sala con 3+ jugadores
4. Selecciona un pack
5. ¡Juega!

### Reportar Bugs

Si encuentras algún bug, incluye:

- Pasos para reproducir
- Navegador y versión
- Logs de la consola (F12)
- Logs del backend (docker-compose logs backend)

---

## 📄 Licencia

ISC - Proyecto personal y educativo

---

**¡Gracias por probar Imposter v1.2.0!** 🎉

Desarrollado con ❤️ por Tiago Cruz
