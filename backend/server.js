require("dotenv").config();
const express = require("express");
const compression = require("compression");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { connectDb } = require("./config/db");
const wordPackRoutes = require("./routes/wordPacks");
const { initializeGame, checkGameEnd } = require("./utils/gameLogic");
const WordPack = require("./models/WordPack");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(compression());
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());

// Rutas de API
app.use("/api/packs", wordPackRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: false,
  },
});

connectDb().then(() => {
  // El seed se ejecuta en npm start vía scripts/seed-standalone.js antes de arrancar el servidor
});

const rooms = new Map();
const games = new Map(); // Almacena el estado de los juegos activos
const roomClueTimers = new Map(); // timeouts de ronda de pistas por sala
const roomVotingTimers = new Map(); // timeouts de votación de bots por sala

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

/** Genera y envía pistas para todos los bots en la ronda actual */
function submitBotClues(io, code, games, roomClueTimers) {
  const gameState = games.get(code);
  if (!gameState || gameState.status !== 'clues') return;

  const round = gameState.clueRound;
  const words = gameState.packWords || [];
  const secretWord = gameState.secretWord;

  gameState.players.forEach((p) => {
    if (!p.isBot) return;
    if (gameState.cluesByRound[round]?.[p.id] !== undefined) return;

    let clue;
    if (p.role === 'civilian') {
      const others = words.filter((w) => w !== secretWord);
      clue = others.length > 0 ? others[Math.floor(Math.random() * others.length)] : secretWord;
    } else {
      clue = words.length > 0 ? words[Math.floor(Math.random() * words.length)] : (gameState.secretWord || '?');
    }
    if (!gameState.cluesByRound[round]) gameState.cluesByRound[round] = {};
    gameState.cluesByRound[round][p.id] = clue;
    io.to(code).emit('game:clue-received', { playerId: p.id, playerName: p.name, clue, round });
  });

  const allSubmitted = gameState.players.every((pl) => gameState.cluesByRound[round]?.[pl.id] !== undefined);
  if (allSubmitted) {
    const t = roomClueTimers.get(code);
    if (t) {
      clearTimeout(t);
      roomClueTimers.delete(code);
    }
    endClueRoundAndMaybeNext(io, code, games, roomClueTimers);
  }
}

/** Cierra la ronda de pistas actual, emite las pistas y pasa a la siguiente ronda o a discusión */
function endClueRoundAndMaybeNext(io, code, games, roomClueTimers) {
  const gameState = games.get(code);
  if (!gameState || gameState.status !== 'clues') return;

  const round = gameState.clueRound;
  const cluesThisRound = gameState.cluesByRound[round] || {};
  const cluesWithNames = {};
  gameState.players.forEach((p) => {
    if (cluesThisRound[p.id] !== undefined) {
      cluesWithNames[p.id] = { name: p.name, clue: cluesThisRound[p.id] };
    }
  });

  io.to(code).emit("game:clue-round-complete", { round, maxRounds: gameState.maxClueRounds, clues: cluesWithNames });

  if (round < gameState.maxClueRounds) {
    gameState.clueRound = round + 1;
    gameState.clueRoundEndsAt = Date.now() + (gameState.clueRoundSeconds * 1000);
    const clueRoundData = {
      round: gameState.clueRound,
      maxRounds: gameState.maxClueRounds,
      endsAt: gameState.clueRoundEndsAt,
      duration: gameState.clueRoundSeconds,
    };
    io.to(code).emit("game:clue-round-started", clueRoundData);

    const timer = setTimeout(() => {
      roomClueTimers.delete(code);
      endClueRoundAndMaybeNext(io, code, games, roomClueTimers);
    }, gameState.clueRoundSeconds * 1000);
    roomClueTimers.set(code, timer);

    if (gameState.players.some((p) => p.isBot)) {
      setTimeout(() => submitBotClues(io, code, games, roomClueTimers), 3000);
    }
  } else {
    gameState.status = 'discussion';
    gameState.discussionEndsAt = Date.now() + (gameState.discussionSeconds * 1000);
    const discussionData = {
      endsAt: gameState.discussionEndsAt,
      duration: gameState.discussionSeconds,
    };
    io.to(code).emit("game:discussion-started", discussionData);
  }
}

/** Asigna votos aleatorios a los bots que aún no han votado */
function assignBotVotes(io, code, games) {
  const gameState = games.get(code);
  if (!gameState || gameState.status !== 'voting') return;

  const activePlayers = gameState.players.filter(
    (p) => !gameState.eliminatedPlayers.includes(p.id)
  );

  gameState.players.forEach((p) => {
    if (!p.isBot || gameState.votes[p.id] !== undefined) return;
    const others = activePlayers.filter((o) => o.id !== p.id);
    if (others.length === 0) return;
    gameState.votes[p.id] = others[Math.floor(Math.random() * others.length)].id;
  });
}

/** Procesa la votación si todos los civiles han votado; emite resultados o fin de partida */
function tryProcessVoting(io, code, games, rooms) {
  const gameState = games.get(code);
  if (!gameState || gameState.status !== 'voting') return;

  const currentActiveCivilians = gameState.players.filter(
    (p) => !gameState.eliminatedPlayers.includes(p.id) && p.role !== 'impostor'
  );
  const currentCivilianVoteIds = currentActiveCivilians.map((c) => c.id);
  const currentCivilianVotesCount = Object.keys(gameState.votes).filter((voterId) =>
    currentCivilianVoteIds.includes(voterId)
  ).length;
  if (currentCivilianVotesCount !== currentActiveCivilians.length || currentActiveCivilians.length === 0) {
    return;
  }

  const impostor = gameState.players.find((p) => p.role === 'impostor');
  const correctVoters = [];
  const incorrectVoters = [];

  currentActiveCivilians.forEach((civilian) => {
    const vote = gameState.votes[civilian.id];
    if (vote === impostor?.id) correctVoters.push(civilian.id);
    else if (vote) incorrectVoters.push(civilian.id);
  });

  const allCiviliansVotedForImpostor =
    !!impostor &&
    currentActiveCivilians.length > 0 &&
    currentActiveCivilians.every((civilian) => gameState.votes[civilian.id] === impostor.id);

  const impostorDiscovered = allCiviliansVotedForImpostor;

  const votesWithNames = {};
  gameState.players.forEach((player) => {
    const voteInfo = gameState.votes[player.id];
    if (voteInfo) {
      const voted = gameState.players.find((p) => p.id === voteInfo);
      if (voted) {
        votesWithNames[player.id] = {
          voterName: player.name,
          voterRole: player.role,
          votedId: voteInfo,
          votedName: voted.name,
        };
      }
    } else {
      votesWithNames[player.id] = {
        voterName: player.name,
        voterRole: player.role,
        votedId: null,
        votedName: null,
      };
    }
  });

  const voteCounts = {};
  currentActiveCivilians.forEach((civilian) => {
    const vote = gameState.votes[civilian.id];
    if (vote) voteCounts[vote] = (voteCounts[vote] || 0) + 1;
  });

  const endCheck = checkGameEnd(gameState);
  const room = rooms.get(code);

  if (endCheck.finished) {
    gameState.status = 'finished';
    gameState.winner = endCheck.winner;
    gameState.finishedData = {
      eliminated: impostorDiscovered ? impostor : null,
      votes: voteCounts,
      votesWithNames,
      impostorDiscovered,
      correctVoters,
      incorrectVoters,
    };
    const finishedData = {
      winner: endCheck.winner,
      secretWord: gameState.secretWord,
      players: gameState.players.map((p) => ({ id: p.id, name: p.name, role: p.role, word: p.word })),
      impostor: impostor ? { id: impostor.id, name: impostor.name } : null,
      eliminated: impostorDiscovered ? impostor : null,
      votes: voteCounts,
      votesWithNames,
      impostorDiscovered,
      correctVoters,
      incorrectVoters,
    };
    io.to(code).emit("game:finished", finishedData);
    gameState.players.forEach((player) => {
      io.to(player.id).emit("game:finished", finishedData);
    });
  } else {
    gameState.status = 'vote-results';
    const voteResultData = {
      eliminated: impostorDiscovered ? impostor : null,
      votes: voteCounts,
      isTie: false,
      votesWithNames,
      players: gameState.players.map((p) => ({ id: p.id, name: p.name, role: p.role, word: p.word })),
      impostor: impostor ? { id: impostor.id, name: impostor.name } : null,
      secretWord: gameState.secretWord,
      hostId: room?.hostId || null,
      originalHostId: room?.originalHostId || null,
      impostorDiscovered,
      correctVoters,
      incorrectVoters,
    };
    io.to(code).emit("game:vote-result", voteResultData);
    gameState.players.forEach((player) => {
      io.to(player.id).emit("game:vote-result", voteResultData);
    });
  }
}

io.on("connection", (socket) => {
  socket.on("room:create", ({ name, settings }, callback) => {
    if (!name) {
      callback?.({ ok: false, error: "NAME_REQUIRED" });
      return;
    }

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const botCount = Math.max(0, Math.min(10, Number(settings?.botCount) || 0));
    const players = [{ id: socket.id, name }];
    for (let i = 1; i <= botCount; i++) {
      players.push({ id: `bot-${code}-${i}`, name: `Bot ${i}`, isBot: true });
    }

    const room = {
      code,
      hostId: socket.id,
      originalHostId: socket.id, // ID del creador original de la sala (nunca cambia)
      players,
      createdAt: new Date().toISOString(),
      settings: {
        maxPlayers: settings?.maxPlayers ?? 12,
        impostorCount: settings?.impostorCount ?? 1,
        discussionSeconds: settings?.discussionSeconds ?? 120,
        botCount,
      },
    };

    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = name;
    callback?.({ ok: true, room: getPublicRoomState(room) });
    io.to(code).emit("room:updated", getPublicRoomState(room));
  });

  socket.on("room:join", ({ code, name }, callback) => {
    const room = rooms.get(code);
    if (!room) {
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
    }

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = name;
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
    const code = socket.data.roomCode;
    if (!code) {
      return;
    }

    const room = rooms.get(code);
    if (!room) {
      return;
    }

    room.players = room.players.filter((player) => player.id !== socket.id);
    if (room.players.length === 0) {
      rooms.delete(code);
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
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);

    if (!gameState) {
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      callback?.({ ok: false, error: "PLAYER_NOT_IN_GAME" });
      return;
    }
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

    // Incluir datos de fase de pistas
    if (gameState.status === 'clues') {
      response.gameState.clueRound = gameState.clueRound;
      response.gameState.maxClueRounds = gameState.maxClueRounds;
      response.gameState.clueRoundEndsAt = gameState.clueRoundEndsAt;
      response.gameState.clueRoundSeconds = gameState.clueRoundSeconds;
      response.gameState.cluesByRound = gameState.cluesByRound;
    }

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
      const requestedLocale = clientLocale && String(clientLocale).trim().toLowerCase();
      let pack;

      if (packId === "random") {
        const localeRegex = requestedLocale ? new RegExp(`^${requestedLocale}`) : /./;
        const allPacks = await WordPack.find({
          locale: localeRegex,
          slug: { $ne: "personalizado" },
          words: { $exists: true, $ne: [] },
        });
        if (!allPacks || allPacks.length === 0) {
          callback?.({ ok: false, error: "PACK_INVALID" });
          return;
        }
        pack = allPacks[Math.floor(Math.random() * allPacks.length)];
      } else {
        pack = await WordPack.findById(packId);
        if (!pack || pack.words.length === 0) {
          callback?.({ ok: false, error: "PACK_INVALID" });
          return;
        }
        if (requestedLocale && !new RegExp(`^${requestedLocale}`).test(pack.locale || "")) {
          const packInLocale = await WordPack.findOne({ slug: pack.slug, locale: new RegExp(`^${requestedLocale}`) });
          if (packInLocale && packInLocale.words && packInLocale.words.length > 0) {
            pack = packInLocale;
          }
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

      // Inicializar el juego (incluye bots si los hay)
      const gameState = initializeGame(room, secretWord, impostorHint);
      gameState.packWords = pack.words || []; // Para que los bots generen pistas
      games.set(code, gameState);
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
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);

    if (!gameState) {
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }

    // Marcar que este jugador vio su rol
    const player = gameState.players.find(p => p.id === socket.id);
    if (player) {
      player.hasSeenRole = true;
    }

    // Verificar si todos (humanos) han visto su rol; bots no envían reveal-complete
    const humanPlayers = gameState.players.filter(p => !p.isBot);
    const allRevealed = humanPlayers.length > 0 && humanPlayers.every(p => p.hasSeenRole);
    if (allRevealed) {
      // Iniciar fase de pistas (3 rondas de 30 s), luego discusión
      gameState.status = 'clues';
      gameState.clueRound = 1;
      gameState.clueRoundEndsAt = Date.now() + (gameState.clueRoundSeconds * 1000);

      const clueRoundData = {
        round: 1,
        maxRounds: gameState.maxClueRounds,
        endsAt: gameState.clueRoundEndsAt,
        duration: gameState.clueRoundSeconds,
      };
      io.to(code).emit("game:clue-round-started", clueRoundData);

      const timer = setTimeout(() => {
        roomClueTimers.delete(code);
        endClueRoundAndMaybeNext(io, code, games, roomClueTimers);
      }, gameState.clueRoundSeconds * 1000);
      roomClueTimers.set(code, timer);

      // Bots envían pista a los 3 s si hay bots
      if (gameState.players.some((p) => p.isBot)) {
        setTimeout(() => submitBotClues(io, code, games, roomClueTimers), 3000);
      }
    }

    callback?.({ ok: true, allRevealed });
  });

  // Enviar pista en la ronda actual
  socket.on("game:submit-clue", ({ code, clue }, callback) => {
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }
    const gameState = games.get(code);
    if (!gameState) {
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }
    if (gameState.status !== 'clues') {
      callback?.({ ok: false, error: "NOT_CLUES_PHASE", currentStatus: gameState.status });
      return;
    }
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player || player.isBot) {
      callback?.({ ok: false, error: "PLAYER_NOT_FOUND" });
      return;
    }
    const text = typeof clue === 'string' ? clue.trim().slice(0, 200) : '';
    const round = gameState.clueRound;
    if (!gameState.cluesByRound[round]) gameState.cluesByRound[round] = {};
    gameState.cluesByRound[round][socket.id] = text;
    io.to(code).emit("game:clue-received", {
      playerId: socket.id,
      playerName: player.name,
      clue: text,
      round,
    });
    callback?.({ ok: true });

    // Si todos los humanos han enviado pista, generar pistas de bots y comprobar si cerrar ronda
    const humans = gameState.players.filter(p => !p.isBot);
    const humanSubmitted = humans.filter(h => gameState.cluesByRound[round][h.id] !== undefined);
    if (humanSubmitted.length === humans.length) {
      submitBotClues(io, code, games, roomClueTimers);
    }
  });

  socket.on("game:vote", ({ code, votedPlayerId }, callback) => {
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);

    if (!gameState) {
      callback?.({ ok: false, error: "GAME_NOT_FOUND" });
      return;
    }
    // No permitir votar si el juego ya terminó
    if (gameState.status === 'finished') {
      callback?.({ ok: false, error: "GAME_FINISHED", currentStatus: gameState.status });
      return;
    }

    // Permitir votar solo si el estado es 'voting' o 'discussion'
    // NO permitir votar si está en 'vote-results', 'finished', o cualquier otro estado
    if (gameState.status !== 'voting' && gameState.status !== 'discussion') {
      callback?.({ ok: false, error: "NOT_VOTING_PHASE", currentStatus: gameState.status });
      return;
    }

    // Si está en 'discussion', cambiar a 'voting' automáticamente y notificar
    if (gameState.status === 'discussion') {
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

      if (gameState.players.some((p) => p.isBot)) {
        const prev = roomVotingTimers.get(code);
        if (prev) clearTimeout(prev);
        roomVotingTimers.set(
          code,
          setTimeout(() => {
            roomVotingTimers.delete(code);
            assignBotVotes(io, code, games);
            tryProcessVoting(io, code, games, rooms);
          }, 12000)
        );
      }
    }

    // Verificar si el jugador es impostor - los impostores no pueden votar
    const player = gameState.players.find(p => p.id === socket.id);
    if (!player) {
      callback?.({ ok: false, error: "PLAYER_NOT_FOUND" });
      return;
    }
    // Registrar voto (también para impostores, pero no se contará en el procesamiento)
    gameState.votes[socket.id] = votedPlayerId;

    // Verificar si todos los civiles votaron (no los impostores) - hacer esto ANTES de verificar si es impostor
    const activeCivilians = gameState.players.filter(
      p => !gameState.eliminatedPlayers.includes(p.id) && p.role !== 'impostor'
    );

    // Contar solo los votos de los civiles (excluir impostores)
    const civilianVoteIds = activeCivilians.map(c => c.id);
    const civilianVotesCount = Object.keys(gameState.votes).filter(voterId => civilianVoteIds.includes(voterId)).length;
    // Verificar si todos los civiles han votado (solo contar votos de civiles)
    const allCiviliansVoted = civilianVotesCount === activeCivilians.length && activeCivilians.length > 0;
    // Si es impostor, registrar el voto pero no contarlo en el procesamiento
    if (player.role === 'impostor') {
      callback?.({ ok: true, isImpostorVote: true });

      // Si todos los civiles ya votaron, procesar la votación inmediatamente (no esperar más)
      if (allCiviliansVoted) {
        // Continuar con el procesamiento (no hacer return aquí)
      } else {
        // Si no todos los civiles votaron, no procesar aún
        return;
      }
    } else {
      // Responder al callback primero
      callback?.({ ok: true });
    }

    // Procesar votación si todos los civiles votaron (después de responder callback para no bloquear)
    if (allCiviliansVoted) {
      const t = roomVotingTimers.get(code);
      if (t) {
        clearTimeout(t);
        roomVotingTimers.delete(code);
      }
      setImmediate(() => tryProcessVoting(io, code, games, rooms));
    }
  });

  socket.on("game:start-voting", ({ code }, callback) => {
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    const gameState = games.get(code);
    if (!gameState) {
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
    if (gameState.status !== 'discussion') {
      callback?.({ ok: false, error: "NOT_DISCUSSION_PHASE", currentStatus: gameState.status });
      return;
    }

    // Cambiar estado ANTES de emitir eventos para evitar problemas de sincronización
    gameState.status = 'voting';
    gameState.votes = {};
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
      io.to(player.id).emit("game:voting-started", { players: playersList });
    });

    // También emitir a toda la sala
    io.to(code).emit("game:voting-started", { players: playersList });

    if (gameState.players.some((p) => p.isBot)) {
      const prev = roomVotingTimers.get(code);
      if (prev) clearTimeout(prev);
      roomVotingTimers.set(
        code,
        setTimeout(() => {
          roomVotingTimers.delete(code);
          assignBotVotes(io, code, games);
          tryProcessVoting(io, code, games, rooms);
        }, 12000)
      );
    }

    callback?.({ ok: true });
  });

  // Nueva partida (después de resultados de votación)
  socket.on("game:new-game", async ({ code: providedCode }, callback) => {
    // Usar socket.data.roomCode como fuente principal, con fallback al código proporcionado
    let code = socket.data.roomCode || providedCode;
    if (!code) {
      callback?.({ ok: false, error: "CODE_REQUIRED" });
      return;
    }

    let room = rooms.get(code);

    // Si la sala no existe, no podemos continuar
    if (!room) {
      callback?.({ ok: false, error: "ROOM_NOT_FOUND", message: "La sala ya no existe. Por favor, vuelve a crear o unirte a una sala desde el inicio." });
      return;
    }

    // SIEMPRE asegurarse de que el socket esté unido a la sala y tenga roomCode establecido
    if (!socket.data.roomCode || socket.data.roomCode !== code) {
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
      room.players.push({
        id: socket.id,
        name: playerName
      });
      io.to(code).emit("room:updated", getPublicRoomState(room));
    } else {
      // Si el jugador ya existe, asegurarse de que socket.data.playerName esté actualizado
      if (existingPlayer.name && existingPlayer.name !== 'Jugador') {
        socket.data.playerName = existingPlayer.name;
      }
    }
    // Solo el creador original de la sala puede iniciar una nueva partida
    if (room.originalHostId !== socket.id) {
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

      const gameState = initializeGame(room, secretWord, impostorHint);
      gameState.packWords = pack.words || []; // Para pistas de bots
      games.set(code, gameState);
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
});
