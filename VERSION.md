# 🎮 Imposter - Version 1.0.3

**Fecha de lanzamiento:** 30 de Enero, 2026  
**Estado:** ✅ Estable

---

## 🎯 Resumen de la Versión

Esta es la **primera versión beta completa** del juego Imposter, una versión de alta calidad del popular juego "Who is the Spy?"

### ✨ Características Principales

- ✅ **10 packs de palabras desbloqueados** (370+ palabras)
- ✅ **Modo personalizado** - Añade tus propias palabras
- ✅ **Sin anuncios** - Experiencia premium sin interrupciones
- ✅ **Multijugador en tiempo real** - Socket.io para sincronización perfecta
- ✅ **Diseño dark mode elegante** - Estética espacial/misteriosa
- ✅ **Animaciones fluidas** - Framer Motion en todas las transiciones
- ✅ **PWA configurada** - Instalar y jugar offline
- ✅ **Responsive** - Funciona en móviles y desktop
- ✅ **Optimizado móvil/tablet (v1.0.2)** - iPhone, Android, iPad y tablets Android: safe areas, teclado, max-width en tablet, PWA orientation any

---

## 🎮 Cómo Funciona

### Sistema de Juego

1. **Mínimo 3 jugadores** - Máximo 12
2. **1-2 impostores** - El resto son civiles
3. **Palabra secreta** - Solo los civiles la conocen
4. **Discusión de 2 minutos** - Descubre quién es el impostor
5. **Votación** - Elimina a los sospechosos
6. **Múltiples rondas** - Hasta que haya un ganador

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

**¡Gracias por probar Imposter v1.0.3!** 🎉

Desarrollado con ❤️ por Tiago Cruz
