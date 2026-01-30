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
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "*";
app.use(cors({ origin: corsOrigin, credentials: corsOrigin !== "*" }));
app.use(express.json());

// Rutas de API
app.use("/api/packs", wordPackRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: corsOrigin !== "*",
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
  originalHostId: room.originalHostId, // Incluir el creador original
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
      originalHostId: socket.id, // ID del creador original de la sala (nunca cambia)
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
    } else {
      // Si el jugador ya existe, mantener su nombre original (no actualizar)
      // Esto preserva los nombres cuando se crea una nueva partida
      console.log(`   ℹ️ Jugador ${socket.id} ya existe en la sala con nombre: ${existing.name}, manteniendo nombre original`);
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = name;

    console.log(`✅ Jugador ${socket.id} unido a sala ${code}, jugadores en sala: ${room.players.length}`);
    callback?.({ ok: true, room: getPublicRoomState(room) });
    io.to(code).emit("room:updated", getPublicRoomState(room));
  });

  socket.on("room:get-info", ({ code }, callback) => {
    const room = rooms.get(code);
    if (!room) {
      callback?.({ ok: false, error: "ROOM_NOT_FOUND" });
      return;
    }
    callback?.({ ok: true, room: getPublicRoomState(room) });
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

    // Obtener información de la sala para incluir hostId
    const room = rooms.get(code);

    const response = {
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
        // Incluir lista de jugadores
        players: gameState.players.map(p => ({
          id: p.id,
          name: p.name,
          role: p.role,
        })),
      }
    };

    // Incluir discussionEndsAt si el juego está en fase de discusión
    if (gameState.status === 'discussion' && gameState.discussionEndsAt) {
      response.gameState.discussionEndsAt = gameState.discussionEndsAt;
    }

    // Si el juego terminó, incluir información del resultado
    if (gameState.status === 'finished') {
      response.gameState.winner = gameState.winner;
      response.gameState.secretWord = gameState.secretWord;
      response.gameState.finishedPlayers = gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        word: p.word,
      }));
      // Incluir información de votos y resultados si está disponible
      if (gameState.finishedData) {
        response.gameState.eliminated = gameState.finishedData.eliminated;
        response.gameState.votes = gameState.finishedData.votes;
        response.gameState.votesWithNames = gameState.finishedData.votesWithNames;
        response.gameState.impostorDiscovered = gameState.finishedData.impostorDiscovered;
      }
    }

    // Incluir información del host si la sala existe
    if (room) {
      response.gameState.hostId = room.hostId;
      response.gameState.originalHostId = room.originalHostId; // Incluir el creador original
      response.gameState.isHost = room.hostId === socket.id;
      response.gameState.isOriginalHost = room.originalHostId === socket.id; // Verificar si es el creador original
    }

    callback?.(response);
  });

  socket.on("game:start", async ({ packId, selectedPacks, hintForImpostors = true, discussionSeconds = 240, impostorCount, locale: clientLocale }, callback) => {
    console.log(`🎮 game:start solicitado por ${socket.id}, pack: ${packId}, hint: ${hintForImpostors}, duration: ${discussionSeconds}, locale: ${clientLocale}`);
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
      // Obtener pack; si el cliente pidió un idioma (ej. pt), preferir el mismo slug en ese idioma para palabras/categoría
      let pack = await WordPack.findById(packId);
      if (!pack || pack.words.length === 0) {
        callback?.({ ok: false, error: "PACK_INVALID" });
        return;
      }
      const requestedLocale = clientLocale && String(clientLocale).trim().toLowerCase();
      if (requestedLocale && !new RegExp(`^${requestedLocale}`).test(pack.locale || '')) {
        const packInLocale = await WordPack.findOne({ slug: pack.slug, locale: new RegExp(`^${requestedLocale}`) });
        if (packInLocale && packInLocale.words && packInLocale.words.length > 0) {
          pack = packInLocale;
        }
      }
      const secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      const impostorHint = hintForImpostors ? (pack.name || 'Categoría secreta') : null;

      // Actualizar configuración de la sala
      if (impostorCount) {
        room.settings.impostorCount = Math.min(Math.max(1, impostorCount), room.players.length - 1);
      } else {
        room.settings.impostorCount = Math.min(room.settings.impostorCount || 1, room.players.length - 1);
      }
      room.settings.discussionSeconds = discussionSeconds;
      room.settings.hintForImpostors = hintForImpostors;
      // Guardar los packs seleccionados y el locale para futuras partidas
      if (selectedPacks && Array.isArray(selectedPacks) && selectedPacks.length > 0) {
        room.settings.selectedPacks = selectedPacks;
      }
      if (requestedLocale) {
        room.settings.locale = requestedLocale;
      }

      // Inicializar el juego
      const gameState = initializeGame(room, secretWord, impostorHint);
      games.set(code, gameState);

      console.log(`✅ Juego iniciado en sala ${code}, palabra: ${secretWord}, jugadores: ${gameState.players.length}, impostores: ${gameState.impostorCount}`);

      // Notificar a todos que el juego comenzó (primero para que naveguen)
      io.to(code).emit("game:started", {
        playerCount: gameState.players.length,
        impostorCount: gameState.impostorCount,
        players: gameState.players.map(p => ({ id: p.id, name: p.name })),
      });

      // Enviar lista de jugadores a todos
      io.to(code).emit("game:players-update", gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
      })));

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
      console.log(`❌ Juego no encontrado para sala ${code}`);
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    console.log(`📊 Estado del juego: ${gameState.status}, esperado: 'voting'`);
    console.log(`   Código de sala: ${code}`);
    console.log(`   Jugadores en juego: ${gameState.players.length}`);

    // No permitir votar si el juego ya terminó
    if (gameState.status === 'finished') {
      console.log(`❌ El juego ya terminó. No se pueden registrar más votos.`);
      callback?.({ ok: false, error: "GAME_FINISHED", currentStatus: gameState.status });
      return;
    }

    // Permitir votar solo si el estado es 'voting' o 'discussion'
    // NO permitir votar si está en 'vote-results', 'finished', o cualquier otro estado
    if (gameState.status !== 'voting' && gameState.status !== 'discussion') {
      console.log(`❌ El juego no está en fase de votación. Estado actual: ${gameState.status}`);
      callback?.({ ok: false, error: "NOT_VOTING_PHASE", currentStatus: gameState.status });
      return;
    }

    // Si está en 'discussion', cambiar a 'voting' automáticamente y notificar
    if (gameState.status === 'discussion') {
      console.log(`⚠️ El juego está en 'discussion', cambiando a 'voting' automáticamente`);
      gameState.status = 'voting';
      gameState.votes = {};

      // Notificar a todos que la votación ha comenzado
      const playersList = gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
      }));

      io.to(code).emit("game:players-update", playersList);
      io.to(code).emit("game:voting-started", { players: playersList });
    }

    // Verificar si el jugador es impostor - los impostores no pueden votar
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      console.log(`❌ Jugador ${socket.id} no encontrado en el juego`);
      callback?.({ ok: false, error: "PLAYER_NOT_FOUND" });
      return;
    }

    console.log(`👤 Jugador encontrado: ${player.name}, rol: ${player.role}`);

    // Registrar voto (también para impostores, pero no se contará en el procesamiento)
    gameState.votes[socket.id] = votedPlayerId;

    // Verificar si todos los civiles votaron (no los impostores) - hacer esto ANTES de verificar si es impostor
    const activeCivilians = gameState.players.filter(
      p => !gameState.eliminatedPlayers.includes(p.id) && p.role !== 'impostor'
    );

    // Contar solo los votos de los civiles (excluir impostores)
    const civilianVoteIds = activeCivilians.map(c => c.id);
    const civilianVotesCount = Object.keys(gameState.votes).filter(voterId => civilianVoteIds.includes(voterId)).length;

    console.log(`📊 ===== VERIFICACIÓN DE VOTOS =====`);
    console.log(`   Votación: ${civilianVotesCount}/${activeCivilians.length} civiles han votado`);
    console.log(`   Votos registrados (todos):`, Object.keys(gameState.votes));
    console.log(`   Votos de civiles:`, Object.keys(gameState.votes).filter(voterId => civilianVoteIds.includes(voterId)));
    console.log(`   Civiles activos (${activeCivilians.length}):`, activeCivilians.map(p => `${p.name} (${p.id})`));
    console.log(`   IDs de civiles activos:`, civilianVoteIds);

    // Verificar si todos los civiles han votado (solo contar votos de civiles)
    const allCiviliansVoted = civilianVotesCount === activeCivilians.length && activeCivilians.length > 0;
    console.log(`   ¿Todos los civiles votaron? ${allCiviliansVoted} (${civilianVotesCount}/${activeCivilians.length})`);
    console.log(`   Condición: ${civilianVotesCount} === ${activeCivilians.length} && ${activeCivilians.length} > 0`);
    console.log(`   ====================================`);

    // Si es impostor, registrar el voto pero no contarlo en el procesamiento
    if (player.role === 'impostor') {
      console.log(`🎭 Impostor ${socket.id} (${player.name}) "fingió" votar por ${votedPlayerId} (voto registrado pero no contado)`);
      callback?.({ ok: true, isImpostorVote: true });

      // Si todos los civiles ya votaron, procesar la votación inmediatamente (no esperar más)
      if (allCiviliansVoted) {
        console.log(`🎯 Todos los civiles ya votaron! Procesando votación inmediatamente (el impostor votó después)...`);
        // Continuar con el procesamiento (no hacer return aquí)
      } else {
        // Si no todos los civiles votaron, no procesar aún
        return;
      }
    } else {
      console.log(`✅ Voto registrado de ${player.name} (${socket.id}) para ${votedPlayerId}`);
      console.log(`   Total votos registrados (incluyendo impostores): ${Object.keys(gameState.votes).length}`);
      console.log(`   Este es un CIVIL votando. Verificando si todos los civiles votaron...`);
      console.log(`   allCiviliansVoted = ${allCiviliansVoted}`);
      // Responder al callback primero
      callback?.({ ok: true });
    }

    // Función auxiliar para procesar la votación
    // IMPORTANTE: Capturar las variables necesarias para evitar problemas de scope
    const processVoting = () => {
      // Recalcular activeCivilians y civilianVoteIds dentro de la función para asegurar que están actualizados
      const currentActiveCivilians = gameState.players.filter(
        p => !gameState.eliminatedPlayers.includes(p.id) && p.role !== 'impostor'
      );
      const currentCivilianVoteIds = currentActiveCivilians.map(c => c.id);

      // Verificar nuevamente que todos los civiles votaron
      const currentCivilianVotesCount = Object.keys(gameState.votes).filter(voterId => currentCivilianVoteIds.includes(voterId)).length;
      console.log(`🔍 Re-verificando en processVoting: ${currentCivilianVotesCount}/${currentActiveCivilians.length} civiles votaron`);

      if (currentCivilianVotesCount !== currentActiveCivilians.length || currentActiveCivilians.length === 0) {
        console.log(`⚠️ El conteo cambió o no hay civiles. No procesando aún. ${currentCivilianVotesCount}/${currentActiveCivilians.length}`);
        return;
      }

      console.log(`🎯 ===== TODOS LOS CIVILES VOTARON! Procesando votación INMEDIATAMENTE =====`);
      console.log(`   No esperando al impostor - procesando ahora con ${currentCivilianVotesCount} votos de civiles`);

      // Filtrar solo los votos de los civiles para el procesamiento (excluir impostores)
      const civilianVotes = {};
      currentActiveCivilians.forEach((civilian) => {
        if (gameState.votes[civilian.id]) {
          civilianVotes[civilian.id] = gameState.votes[civilian.id];
        }
      });
      console.log(`📊 Votos de civiles para procesar:`, civilianVotes);
      console.log(`   IDs de civiles que votaron:`, Object.keys(civilianVotes));
      console.log(`   IDs de civiles activos:`, currentActiveCivilians.map(c => c.id));

      // Identificar al impostor
      const impostor = gameState.players.find(p => p.role === 'impostor');

      // Verificar quién acertó (votó por el impostor)
      const correctVoters = [];
      const incorrectVoters = [];

      currentActiveCivilians.forEach(civilian => {
        const vote = gameState.votes[civilian.id];
        if (vote === impostor?.id) {
          correctVoters.push(civilian.id);
        } else if (vote) {
          incorrectVoters.push(civilian.id);
        }
      });

      // Verificar si todos los civiles acertaron (solo votos de civiles; el voto del impostor no cuenta)
      const allCiviliansVotedForImpostor = !!impostor &&
        currentActiveCivilians.length > 0 &&
        currentActiveCivilians.every(civilian => {
          const vote = gameState.votes[civilian.id];
          return vote === impostor.id;
        });

      const impostorDiscovered = allCiviliansVotedForImpostor;

      if (impostorDiscovered) {
        console.log(`🎯 ¡El impostor fue descubierto! Todos los civiles acertaron.`);
      } else {
        console.log(`📊 Resultados: ${correctVoters.length} acertaron, ${incorrectVoters.length} no acertaron`);
      }

      // NO eliminar a nadie - solo registrar resultados
      // gameState.eliminatedPlayers NO se modifica

      // Verificar si el juego terminó
      const endCheck = checkGameEnd(gameState);
      console.log(`🔍 Verificación de fin de juego:`, endCheck);

      if (endCheck.finished) {
        gameState.status = 'finished';
        gameState.winner = endCheck.winner;

        console.log(`🏁 Juego terminado. Ganador: ${endCheck.winner}`);
        console.log(`📤 Emitiendo game:finished a sala ${code}`);

        // Preparar información de votos con nombres de jugadores (incluyendo impostores)
        const votesWithNames = {};
        // Incluir todos los jugadores, incluso si no votaron
        gameState.players.forEach((player) => {
          const voteInfo = gameState.votes[player.id];
          if (voteInfo) {
            const voted = gameState.players.find(p => p.id === voteInfo);
            if (voted) {
              votesWithNames[player.id] = {
                voterName: player.name,
                voterRole: player.role,
                votedId: voteInfo,
                votedName: voted.name,
              };
            }
          } else {
            // Si no votó, incluir información para mostrar "No votó"
            votesWithNames[player.id] = {
              voterName: player.name,
              voterRole: player.role,
              votedId: null,
              votedName: null,
            };
          }
        });

        // Contar votos para crear el objeto result
        const voteCounts = {};
        currentActiveCivilians.forEach(civilian => {
          const vote = gameState.votes[civilian.id];
          if (vote) {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
          }
        });

        // Guardar información de resultados en gameState para game:get-state
        gameState.finishedData = {
          eliminated: impostorDiscovered ? impostor : null, // Solo mostrar impostor si fue descubierto
          votes: voteCounts, // Usar voteCounts en lugar de result.votes
          votesWithNames: votesWithNames,
          impostorDiscovered: impostorDiscovered, // Indicar si el impostor fue descubierto
          correctVoters: correctVoters, // IDs de jugadores que acertaron
          incorrectVoters: incorrectVoters, // IDs de jugadores que no acertaron
        };

        const finishedData = {
          winner: endCheck.winner,
          secretWord: gameState.secretWord,
          players: gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            word: p.word,
          })),
          impostor: impostor ? { id: impostor.id, name: impostor.name } : null,
          eliminated: impostorDiscovered ? impostor : null, // Solo mostrar impostor si fue descubierto
          votes: voteCounts, // Solo votos de civiles
          votesWithNames: votesWithNames, // Votos con información completa
          impostorDiscovered: impostorDiscovered, // true solo si todos los civiles votaron por el impostor
          correctVoters: correctVoters, // IDs de civiles que acertaron
          incorrectVoters: incorrectVoters, // IDs de civiles que no acertaron
        };

        // Emitir a toda la sala
        console.log(`📤 Emitiendo game:finished a toda la sala ${code} (${gameState.players.length} jugadores)`);
        io.to(code).emit("game:finished", finishedData);

        // También emitir individualmente para asegurar que todos lo reciben
        gameState.players.forEach((player) => {
          console.log(`  📤 Enviando game:finished individualmente a ${player.id} (${player.name})`);
          io.to(player.id).emit("game:finished", finishedData);
        });
        console.log(`✅ Todos los eventos game:finished enviados`);
      } else {
        // Siguiente ronda - pero primero mostrar resultados de la votación
        console.log(`🔄 Iniciando siguiente ronda...`);

        // Preparar información de votos con nombres de jugadores (incluyendo impostores)
        const votesWithNames = {};
        // Incluir todos los jugadores, incluso si no votaron
        gameState.players.forEach((player) => {
          const voteInfo = gameState.votes[player.id];
          if (voteInfo) {
            const voted = gameState.players.find(p => p.id === voteInfo);
            if (voted) {
              votesWithNames[player.id] = {
                voterName: player.name,
                voterRole: player.role,
                votedId: voteInfo,
                votedName: voted.name,
              };
            }
          } else {
            // Si no votó, incluir información para mostrar "No votó"
            votesWithNames[player.id] = {
              voterName: player.name,
              voterRole: player.role,
              votedId: null,
              votedName: null,
            };
          }
        });

        // Identificar quién es el impostor para mostrar si acertaron
        const impostor = gameState.players.find(p => p.role === 'impostor');

        // Verificar quién acertó (votó por el impostor)
        const activeCivilians = gameState.players.filter(
          p => !gameState.eliminatedPlayers.includes(p.id) && p.role !== 'impostor'
        );
        
        const correctVoters = [];
        const incorrectVoters = [];
        
        // Contar votos para crear el objeto voteCounts
        const voteCounts = {};
        activeCivilians.forEach(civilian => {
          const vote = gameState.votes[civilian.id];
          if (vote) {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
            if (vote === impostor?.id) {
              correctVoters.push(civilian.id);
            } else {
              incorrectVoters.push(civilian.id);
            }
          }
        });
        
        // Verificar si todos los civiles acertaron (solo votos de civiles; el voto del impostor no cuenta)
        const allCiviliansVotedForImpostor = !!impostor &&
          activeCivilians.length > 0 &&
          activeCivilians.every(civilian => {
            const vote = gameState.votes[civilian.id];
            return vote === impostor.id;
          });
        
        const impostorDiscovered = allCiviliansVotedForImpostor;

        // Cambiar estado a 'vote-results' ANTES de emitir eventos
        gameState.status = 'vote-results';

        console.log(`📤 Emitiendo game:vote-result a sala ${code} (${gameState.players.length} jugadores)`);
        const room = rooms.get(code);
        
        if (impostorDiscovered) {
          console.log(`🎯 ¡El impostor fue descubierto en esta ronda! Todos los civiles acertaron.`);
        } else {
          console.log(`📊 Resultados: ${correctVoters.length} acertaron, ${incorrectVoters.length} no acertaron`);
        }

        const voteResultData = {
          eliminated: impostorDiscovered ? impostor : null, // Solo mostrar impostor si fue descubierto
          votes: voteCounts, // Usar voteCounts en lugar de result.votes
          isTie: false, // No hay empates
          votesWithNames: votesWithNames, // Incluir votos con nombres
          players: gameState.players.map(p => ({
            id: p.id,
            name: p.name,
            role: p.role,
            word: p.word,
          })),
          impostor: impostor ? {
            id: impostor.id,
            name: impostor.name,
          } : null,
          secretWord: gameState.secretWord,
          hostId: room?.hostId || null, // Incluir hostId para que el frontend sepa quién es el host
          originalHostId: room?.originalHostId || null, // Incluir originalHostId para identificar al creador original
          impostorDiscovered: impostorDiscovered, // Indicar si el impostor fue descubierto
          correctVoters: correctVoters, // IDs de jugadores que acertaron
          incorrectVoters: incorrectVoters, // IDs de jugadores que no acertaron
        };

        // Emitir a toda la sala
        io.to(code).emit("game:vote-result", voteResultData);

        // También emitir individualmente para asegurar que todos lo reciben
        gameState.players.forEach((player) => {
          console.log(`  📤 Enviando game:vote-result individualmente a ${player.id} (${player.name})`);
          io.to(player.id).emit("game:vote-result", voteResultData);
        });
        console.log(`✅ Todos los eventos game:vote-result enviados`);

        // NO continuar automáticamente - esperar a que el host inicie nueva partida o vuelva al inicio
      }
    };

    // Procesar votación si todos los civiles votaron (después de responder callback para no bloquear)
    // IMPORTANTE: Procesar inmediatamente cuando todos los civiles votaron, sin esperar al impostor
    if (allCiviliansVoted) {
      console.log(`✅ Condición cumplida: allCiviliansVoted = ${allCiviliansVoted}`);
      console.log(`   Programando processVoting con setImmediate...`);
      // Usar setImmediate para asegurar que el callback se envíe primero
      setImmediate(() => {
        console.log(`⏰ setImmediate ejecutado, llamando processVoting...`);
        processVoting();
      });
    } else {
      console.log(`⏸️ No se procesa aún: allCiviliansVoted = ${allCiviliansVoted}, esperando más votos...`);
    }
  });

  socket.on("game:start-voting", ({ code }, callback) => {
    console.log(`🗳️ game:start-voting solicitado para sala ${code} por ${socket.id}`);

    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);

    console.log(`🔍 Verificando juego - Juego existe: ${!!gameState}, Juegos activos: ${games.size}`);

    if (!gameState) {
      console.log(`❌ Juego no encontrado - Código: ${code}`);
      console.log(`   Juegos disponibles: ${Array.from(games.keys()).join(', ')}`);
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    // Verificar que el jugador esté en el juego
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      callback?.({ ok: false, error: "PLAYER_NOT_IN_GAME" });
      return;
    }

    // Cualquier jugador puede iniciar la votación (no solo el host)
    console.log(`📊 Estado actual del juego: ${gameState.status}, esperado: 'discussion'`);
    if (gameState.status !== 'discussion') {
      console.log(`❌ No se puede iniciar votación - el juego está en fase: ${gameState.status}`);
      callback?.({ ok: false, error: "NOT_DISCUSSION_PHASE", currentStatus: gameState.status });
      return;
    }

    // Cambiar estado ANTES de emitir eventos para evitar problemas de sincronización
    gameState.status = 'voting';
    gameState.votes = {};

    console.log(`✅ Votación iniciada por ${socket.id} en sala ${code}`);
    console.log(`📊 Estado del juego actualizado a: ${gameState.status}`);
    console.log(`📤 Emitiendo game:voting-started a sala ${code} (${gameState.players.length} jugadores)`);

    // Preparar lista de jugadores para votación
    const playersList = gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
    }));

    // Enviar lista de jugadores primero
    io.to(code).emit("game:players-update", playersList);

    // Enviar evento de votación inmediatamente (el estado ya está actualizado)
    gameState.players.forEach((player) => {
      console.log(`  📤 Enviando voting-started a ${player.id}`);
      io.to(player.id).emit("game:voting-started", { players: playersList });
    });

    // También emitir a toda la sala
    io.to(code).emit("game:voting-started", { players: playersList });

    callback?.({ ok: true });
  });

  // Nueva partida (después de resultados de votación)
  socket.on("game:new-game", async ({ code: providedCode }, callback) => {
    // Usar socket.data.roomCode como fuente principal, con fallback al código proporcionado
    let code = socket.data.roomCode || providedCode;
    console.log(`🎮 game:new-game solicitado por ${socket.id}`);
    console.log(`   📋 socket.data.roomCode: ${socket.data.roomCode}`);
    console.log(`   📋 providedCode: ${providedCode}`);
    console.log(`   📋 code inicial: ${code}`);
    console.log(`   📋 Salas activas: ${rooms.size}, códigos: ${Array.from(rooms.keys()).join(', ')}`);

    if (!code) {
      console.log(`   ❌ No se pudo determinar el código de la sala`);
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    let room = rooms.get(code);

    // Si la sala no existe, no podemos continuar
    if (!room) {
      console.log(`   ❌ Sala ${code} no encontrada`);
      console.log(`   💡 Sugerencia: La sala puede haberse eliminado. Los jugadores deben volver a crear o unirse a una sala.`);
      callback?.({ ok: false, error: "ROOM_NOT_FOUND", message: "La sala ya no existe. Por favor, vuelve a crear o unirte a una sala desde el inicio." });
      return;
    }

    // SIEMPRE asegurarse de que el socket esté unido a la sala y tenga roomCode establecido
    if (!socket.data.roomCode || socket.data.roomCode !== code) {
      console.log(`   🔧 Estableciendo socket.data.roomCode a ${code} y uniendo a la sala`);
      socket.data.roomCode = code;
      socket.join(code);
    }

    // También asegurarse de que el jugador esté en la lista de jugadores de la sala
    const existingPlayer = room.players.find(p => p.id === socket.id);
    if (!existingPlayer) {
      // Si el jugador no existe, buscar si hay un jugador con el mismo socket.id en la lista
      // Esto puede pasar si se desconectó y se reconectó
      // En ese caso, intentar usar el nombre del socket.data o buscar en la lista de jugadores
      const playerName = socket.data.playerName || 'Jugador';
      console.log(`   🔧 Agregando jugador ${socket.id} a la sala (puede haber sido desconectado) con nombre: ${playerName}`);
      room.players.push({
        id: socket.id,
        name: playerName
      });
      io.to(code).emit("room:updated", getPublicRoomState(room));
    } else {
      // Si el jugador ya existe, asegurarse de que socket.data.playerName esté actualizado
      if (existingPlayer.name && existingPlayer.name !== 'Jugador') {
        socket.data.playerName = existingPlayer.name;
        console.log(`   🔧 Actualizando socket.data.playerName a: ${existingPlayer.name}`);
      }
    }

    console.log(`   ✅ Sala encontrada: ${code}, hostId: ${room.hostId}, originalHostId: ${room.originalHostId}, solicitante: ${socket.id}`);

    // Solo el creador original de la sala puede iniciar una nueva partida
    if (room.originalHostId !== socket.id) {
      console.log(`   ❌ El solicitante ${socket.id} no es el creador original ${room.originalHostId}`);
      callback?.({ ok: false, error: "NOT_ORIGINAL_HOST" });
      return;
    }

    if (room.players.length < 3) {
      callback?.({ ok: false, error: "NOT_ENOUGH_PLAYERS" });
      return;
    }

    try {
      // Obtener packs seleccionados de la sala (si hay múltiples, seleccionar uno aleatorio)
      let packIds = room.settings?.selectedPacks || [];

      // Si no hay packs seleccionados, obtener todos los packs disponibles
      if (packIds.length === 0) {
        const allPacks = await WordPack.find({});
        packIds = allPacks.map(p => p._id.toString());
      }

      if (packIds.length === 0) {
        callback?.({ ok: false, error: "NO_PACKS_AVAILABLE" });
        return;
      }

      // Seleccionar un pack aleatorio de los seleccionados
      const randomPackId = packIds[Math.floor(Math.random() * packIds.length)];
      let pack = await WordPack.findById(randomPackId);

      if (!pack || pack.words.length === 0) {
        callback?.({ ok: false, error: "PACK_INVALID" });
        return;
      }

      // Preferir el mismo slug en el idioma de la sala (ej. pt) para palabras/categoría
      const savedLocale = room.settings?.locale && String(room.settings.locale).trim().toLowerCase();
      if (savedLocale && !new RegExp(`^${savedLocale}`).test(pack.locale || '')) {
        const packInLocale = await WordPack.findOne({ slug: pack.slug, locale: new RegExp(`^${savedLocale}`) });
        if (packInLocale && packInLocale.words && packInLocale.words.length > 0) {
          pack = packInLocale;
        }
      }

      // Obtener palabra aleatoria del pack
      const secretWord = pack.words[Math.floor(Math.random() * pack.words.length)];
      const impostorHint = room.settings?.hintForImpostors !== false ? (pack.name || 'Categoría secreta') : null;

      // Verificar que los jugadores tengan nombres correctos antes de inicializar
      console.log(`📋 Jugadores en sala antes de nueva partida:`, room.players.map(p => ({ id: p.id, name: p.name })));

      // Reiniciar el juego con nueva palabra
      const gameState = initializeGame(room, secretWord, impostorHint);
      games.set(code, gameState);

      console.log(`✅ Nueva partida iniciada en sala ${code}, palabra: ${secretWord}, jugadores: ${gameState.players.length}, impostores: ${gameState.impostorCount}`);
      console.log(`📋 Jugadores en nueva partida:`, gameState.players.map(p => ({ id: p.id, name: p.name, role: p.role })));

      // Notificar a todos que el juego comenzó
      io.to(code).emit("game:started", {
        playerCount: gameState.players.length,
        impostorCount: gameState.impostorCount,
        players: gameState.players.map(p => ({ id: p.id, name: p.name })),
      });

      // Enviar lista de jugadores a todos
      io.to(code).emit("game:players-update", gameState.players.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
      })));

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
      console.error('❌ Error iniciando nueva partida:', error);
      callback?.({ ok: false, error: error.message });
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, rooms: rooms.size, games: games.size });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${PORT}`);
});
