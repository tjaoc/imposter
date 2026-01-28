# ⚡ Quick Start - Imposter v1.0.0-beta

Guía rápida para empezar a jugar en 5 minutos.

---

## 🚀 Inicio Rápido con Docker (Recomendado)

### Paso 1: Levantar servicios
```bash
cd /Users/tcruz/Desarrollo/05_Personal/spy
docker-compose up -d
```

### Paso 2: Verificar que todo funciona
```bash
curl http://localhost:4000/health
curl http://localhost:3000
```

Deberías ver:
```json
{"ok":true,"rooms":0,"games":0}
```

### Paso 3: Abrir la app
Abre tu navegador en: **http://localhost:3000**

---

## 🎮 Cómo Jugar (Primeros Pasos)

### Necesitas 3+ jugadores

#### Jugador 1 (Host):
1. Ve a http://localhost:3000
2. Ingresa tu nombre (ej: "Host")
3. Clic en **"Crear Sala"**
4. Anota el código de 6 letras (ej: ABC123)
5. **ESPERA** a que los demás se unan
6. Selecciona un pack de palabras
7. Clic en **"Iniciar Juego"**

#### Jugador 2 y 3:
1. Ve a http://localhost:3000
2. Ingresa tu nombre
3. Ingresa el código de la sala (ej: ABC123)
4. Clic en **"Unirse a Sala"**
5. Espera a que el host inicie el juego

### Durante el Juego

#### 1. Revelación de Roles
- Verás tu **palabra secreta** (ej: "Pizza") 🎯
- O verás **"IMPOSTOR"** (sin palabra) 🕵️
- Clic en **"Continuar"**

#### 2. Discusión (2 minutos)
- Habla sobre la palabra **SIN decirla directamente**
- Si eres impostor, **intenta descubrirla**
- Observa quién actúa sospechoso

#### 3. Votación
- Vota a quién crees que es el impostor
- El más votado es eliminado

#### 4. Resultados
- Se revela quién era el impostor
- Se muestra la palabra secreta
- ¡Gana el mejor equipo!

---

## 🛠️ Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose logs -f
```

### Ver estado de servicios
```bash
docker-compose ps
```

### Reiniciar un servicio
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Detener todo
```bash
docker-compose down
```

### Limpiar y empezar de nuevo
```bash
./scripts/docker-clean.sh
./scripts/docker-dev.sh
```

---

## 🎯 Packs Disponibles

1. 🎬 **Cine y Series** - Películas, actores, personajes
2. ⚽ **Deportes** - Equipos, jugadores, competiciones
3. ✈️ **Viajes y Lugares** - Ciudades, monumentos, países
4. 🍕 **Comida y Bebida** - Platos, bebidas, postres
5. 🦁 **Animales** - Fauna de todo el mundo
6. 💻 **Tecnología** - Marcas, gadgets, apps
7. 🎵 **Música** - Artistas, géneros musicales
8. 👨‍⚕️ **Profesiones** - Oficios y trabajos
9. 🔞 **Adultos** - Contenido +18
10. ✏️ **Personalizado** - Tus propias palabras

---

## ❓ Solución de Problemas

### Puerto 3000 o 4000 ocupado
```bash
# Ver qué proceso usa el puerto
lsof -i :3000
lsof -i :4000

# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Cambiar 3000 por otro
```

### Los contenedores no inician
```bash
# Verificar Docker está corriendo
docker info

# Reconstruir imágenes
docker-compose build --no-cache
docker-compose up -d
```

### "Sala no encontrada"
- Las salas se eliminan cuando todos se desconectan
- Crea una sala nueva
- No navegues directamente a `/room/CODIGO` sin crear la sala primero

### El juego no inicia
- Necesitas **mínimo 3 jugadores**
- El host debe **seleccionar un pack** antes de iniciar
- Todos deben estar en la sala antes de iniciar

---

## 📚 Más Información

- [README.md](./README.md) - Documentación completa
- [DOCKER.md](./DOCKER.md) - Guía de Docker
- [GAME_FEATURES.md](./GAME_FEATURES.md) - Funcionalidades del juego
- [CHANGELOG.md](./CHANGELOG.md) - Historial de cambios
- [VERSION.md](./VERSION.md) - Detalles de esta versión

---

## 🎉 ¡Listo para Jugar!

La app está corriendo en:
- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000

**¡Disfruta del juego!** 🎮

---

**Versión:** 1.0.0-beta  
**Desarrollado por:** Tiago Cruz  
**Fecha:** 28 de Enero, 2026
