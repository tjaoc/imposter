require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { connectDb } = require("./config/db");
const { seedWordPacks } = require("./seeds/wordPacks");
const wordPackRoutes = require("./routes/wordPacks");
const { initializeGame, processVotes, checkGameEnd } = require("./utils/gameLogic");
const WordPack = require("./models/WordPack");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

// Rutas de API
app.use("/api/packs", wordPackRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

connectDb().then(() => {
  // Seed de packs de palabras al iniciar
  seedWordPacks().catch(console.error);
});

const rooms = new Map();
const games = new Map(); // Almacena el estado de los juegos activos

const generateRoomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const getPublicRoomState = (room) => ({
  code: room.code,
  hostId: room.hostId,
  players: room.players.map((player) => ({
    id: player.id,
    name: player.name,
    isHost: player.id === room.hostId,
  })),
  createdAt: room.createdAt,
  settings: room.settings,
});

io.on("connection", (socket) => {
  console.log(`🔌 Cliente conectado: ${socket.id}`);
  
  socket.on("room:create", ({ name, settings }, callback) => {
    console.log(`📝 room:create solicitado por ${socket.id}, nombre: ${name}`);
    if (!name) {
      callback?.({ ok: false, error: "NAME_REQUIRED" });
      return;
    }

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const room = {
      code,
      hostId: socket.id,
      players: [{ id: socket.id, name }],
      createdAt: new Date().toISOString(),
      settings: {
        maxPlayers: settings?.maxPlayers ?? 12,
        impostorCount: settings?.impostorCount ?? 1,
        discussionSeconds: settings?.discussionSeconds ?? 120,
      },
    };

    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = name;

    console.log(`✅ Sala creada: ${code}, host: ${socket.id}, salas activas: ${rooms.size}`);
    callback?.({ ok: true, room: getPublicRoomState(room) });
    io.to(code).emit("room:updated", getPublicRoomState(room));
  });

  socket.on("room:join", ({ code, name }, callback) => {
    console.log(`🚪 room:join solicitado por ${socket.id}, sala: ${code}, nombre: ${name}`);
    const room = rooms.get(code);
    if (!room) {
      console.log(`❌ Sala ${code} no encontrada. Salas activas: ${rooms.size}, códigos: ${Array.from(rooms.keys()).join(', ')}`);
      callback?.({ ok: false, error: "ROOM_NOT_FOUND" });
      return;
    }

    if (!name) {
      callback?.({ ok: false, error: "NAME_REQUIRED" });
      return;
    }

    if (room.players.length >= room.settings.maxPlayers) {
      callback?.({ ok: false, error: "ROOM_FULL" });
      return;
    }

    const existing = room.players.find((player) => player.id === socket.id);
    if (!existing) {
      room.players.push({ id: socket.id, name });
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = name;

    console.log(`✅ Jugador ${socket.id} unido a sala ${code}, jugadores en sala: ${room.players.length}`);
    callback?.({ ok: true, room: getPublicRoomState(room) });
    io.to(code).emit("room:updated", getPublicRoomState(room));
  });

  socket.on("room:leave", () => {
    const code = socket.data.roomCode;
    if (!code) return;

    const room = rooms.get(code);
    if (!room) return;

    room.players = room.players.filter((player) => player.id !== socket.id);
    socket.leave(code);
    socket.data.roomCode = null;

    if (room.players.length === 0) {
      rooms.delete(code);
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    io.to(code).emit("room:updated", getPublicRoomState(room));
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);
    const code = socket.data.roomCode;
    if (!code) {
      console.log(`   No estaba en ninguna sala`);
      return;
    }

    const room = rooms.get(code);
    if (!room) {
      console.log(`   Sala ${code} ya no existe`);
      return;
    }

    room.players = room.players.filter((player) => player.id !== socket.id);
    console.log(`   Removido de sala ${code}, jugadores restantes: ${room.players.length}`);

    if (room.players.length === 0) {
      rooms.delete(code);
      console.log(`   ⚠️  Sala ${code} eliminada (vacía). Salas activas: ${rooms.size}`);
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
    }

    io.to(code).emit("room:updated", getPublicRoomState(room));
  });

  // ===== EVENTOS DEL JUEGO =====
  
  // Obtener estado del juego y rol del jugador
  socket.on("game:get-state", ({ code }, callback) => {
    console.log(`🎲 game:get-state solicitado por ${socket.id} para sala ${code}`);
    
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);
    
    if (!gameState) {
      console.log(`❌ Juego no encontrado para sala ${code}. Juegos activos: ${games.size}, códigos: ${Array.from(games.keys()).join(', ')}`);
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      console.log(`❌ Jugador ${socket.id} no está en el juego ${code}`);
      callback?.({ ok: false, error: "PLAYER_NOT_IN_GAME" });
      return;
    }

    console.log(`✅ Estado del juego enviado a ${socket.id}: ${player.role}`);
    callback?.({
      ok: true,
      role: {
        role: player.role,
        word: player.word,
        isImpostor: player.role === 'impostor',
      },
      gameState: {
        status: gameState.status,
        playerCount: gameState.players.length,
        impostorCount: gameState.impostorCount,
      }
    });
  });
  
  socket.on("game:start", async ({ packId }, callback) => {
    console.log(`🎮 game:start solicitado por ${socket.id}, pack: ${packId}`);
    const code = socket.data.roomCode;
    const room = rooms.get(code);
    
    if (!room) {
      callback?.({ ok: false, error: "ROOM_NOT_FOUND" });
      return;
    }
    
    if (room.hostId !== socket.id) {
      callback?.({ ok: false, error: "NOT_HOST" });
      return;
    }
    
    if (room.players.length < 3) {
      callback?.({ ok: false, error: "NOT_ENOUGH_PLAYERS" });
      return;
    }

    try {
      // Obtener palabra aleatoria del pack
      const pack = await WordPack.findById(packId);
      if (!pack || pack.words.length === 0) {
        callback?.({ ok: false, error: "PACK_INVALID" });
        return;
      }

      const secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      
      // Inicializar el juego
      const gameState = initializeGame(room, secretWord);
      games.set(code, gameState);

      console.log(`✅ Juego iniciado en sala ${code}, palabra: ${secretWord}, jugadores: ${gameState.players.length}`);

      // Notificar a todos que el juego comenzó (primero para que naveguen)
      io.to(code).emit("game:started", {
        playerCount: gameState.players.length,
        impostorCount: gameState.impostorCount,
      });

      // Esperar un momento para que todos naveguen a /game/CODIGO
      setTimeout(() => {
        // Enviar a cada jugador su rol individual
        gameState.players.forEach((player) => {
          console.log(`🎭 Enviando rol a ${player.id}: ${player.role}`);
          io.to(player.id).emit("game:role", {
            role: player.role,
            word: player.word,
            isImpostor: player.role === 'impostor',
          });
        });
      }, 1000);

      callback?.({ ok: true });
    } catch (error) {
      console.error('❌ Error iniciando juego:', error);
      callback?.({ ok: false, error: error.message });
    }
  });

  socket.on("game:reveal-complete", ({ code }, callback) => {
    console.log(`✅ game:reveal-complete de ${socket.id} para sala ${code}`);
    
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);
    
    if (!gameState) {
      console.log(`❌ Juego no encontrado para sala ${code}. Juegos activos: ${games.size}`);
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    // Marcar que este jugador vio su rol
    const player = gameState.players.find(p => p.id === socket.id);
    if (player) {
      player.hasSeenRole = true;
    }

    // Verificar si todos han visto su rol
    const allRevealed = gameState.players.every(p => p.hasSeenRole);
    console.log(`📊 Jugadores que vieron su rol: ${gameState.players.filter(p => p.hasSeenRole).length}/${gameState.players.length}, allRevealed: ${allRevealed}`);
    
    if (allRevealed) {
      console.log(`🚀 Todos confirmaron! Iniciando fase de discusión en sala ${code}`);
      // Iniciar fase de discusión
      gameState.status = 'discussion';
      gameState.discussionEndsAt = Date.now() + (gameState.discussionSeconds * 1000);
      
      const discussionData = {
        endsAt: gameState.discussionEndsAt,
        duration: gameState.discussionSeconds,
      };
      
      console.log(`💬 Emitiendo game:discussion-started para sala ${code}`);
      
      // Enviar a TODA la sala (broadcast)
      io.to(code).emit("game:discussion-started", discussionData);
      
      // TAMBIÉN enviar a cada jugador individualmente para asegurar que lo reciben
      gameState.players.forEach((player) => {
        console.log(`  📤 Enviando discussion-started a ${player.id}`);
        io.to(player.id).emit("game:discussion-started", discussionData);
      });
    }

    callback?.({ ok: true, allRevealed });
  });

  socket.on("game:vote", ({ code, votedPlayerId }, callback) => {
    console.log(`🗳️ Voto de ${socket.id} para ${votedPlayerId} en sala ${code}`);
    
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);
    
    if (!gameState) {
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    if (gameState.status !== 'voting') {
      callback?.({ ok: false, error: "NOT_VOTING_PHASE" });
      return;
    }

    // Registrar voto
    gameState.votes[socket.id] = votedPlayerId;
    console.log(`✅ Voto registrado. Total votos: ${Object.keys(gameState.votes).length}`);

    // Verificar si todos votaron
    const activePlayers = gameState.players.filter(
      p => !gameState.eliminatedPlayers.includes(p.id)
    );
    
    if (Object.keys(gameState.votes).length === activePlayers.length) {
      // Procesar votación
      const result = processVotes(gameState, gameState.votes);
      
      if (result.eliminated) {
        gameState.eliminatedPlayers.push(result.eliminated.id);
      }

      // Verificar si el juego terminó
      const endCheck = checkGameEnd(gameState);
      
      if (endCheck.finished) {
        gameState.status = 'finished';
        gameState.winner = endCheck.winner;
        
        io.to(code).emit("game:finished", {
          winner: endCheck.winner,
          secretWord: gameState.secretWord,
          players: gameState.players,
          eliminated: result.eliminated,
          votes: result.votes,
        });
      } else {
        // Siguiente ronda
        gameState.round += 1;
        gameState.votes = {};
        gameState.status = 'discussion';
        gameState.discussionEndsAt = Date.now() + (gameState.discussionSeconds * 1000);
        
        io.to(code).emit("game:vote-result", {
          eliminated: result.eliminated,
          votes: result.votes,
          isTie: result.isTie,
        });

        io.to(code).emit("game:discussion-started", {
          endsAt: gameState.discussionEndsAt,
          duration: gameState.discussionSeconds,
        });
      }
    }

    callback?.({ ok: true });
  });

  socket.on("game:start-voting", ({ code }, callback) => {
    console.log(`🗳️ game:start-voting solicitado para sala ${code}`);
    
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const room = rooms.get(code);
    const gameState = games.get(code);
    
    if (!room || !gameState) {
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    if (room.hostId !== socket.id) {
      callback?.({ ok: false, error: "NOT_HOST" });
      return;
    }

    gameState.status = 'voting';
    gameState.votes = {};
    
    io.to(code).emit("game:voting-started");
    callback?.({ ok: true });
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, rooms: rooms.size, games: games.size });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
