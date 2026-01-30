/**
 * Lógica del juego Imposter
 */

/**
 * Asignar roles a los jugadores
 * @param {Array} players - Lista de jugadores
 * @param {string} secretWord - Palabra secreta
 * @param {string} [hintWord] - Pista/categoría para el impostor
 * @param {number} impostorCount - Número de impostores
 * @returns {Array} Jugadores con roles asignados
 */
function assignRoles(players, secretWord, impostorCount = 1, hintWord = null) {
  if (players.length < 3) {
    throw new Error('Se necesitan al menos 3 jugadores');
  }

  if (impostorCount >= players.length) {
    throw new Error('Número de impostores inválido');
  }

  // Copiar array para no mutar el original
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  
  // Los primeros N jugadores son impostores
  const impostors = shuffled.slice(0, impostorCount);
  const civilians = shuffled.slice(impostorCount);

  return shuffled.map((player) => {
    const isImpostor = impostors.includes(player);

    return {
      ...player,
      role: isImpostor ? 'impostor' : 'civilian',
      // Los civiles ven la palabra secreta, el impostor ve solo una pista/categoría
      word: isImpostor ? hintWord : secretWord,
    };
  });
}

/**
 * Generar estado inicial del juego
 * @param {Object} room - Sala de juego
 * @param {string} secretWord - Palabra secreta
 * @param {string} [hintWord] - Pista/categoría para el impostor
 * @returns {Object} Estado del juego
 */
function initializeGame(room, secretWord, hintWord = null) {
  const playersWithRoles = assignRoles(
    room.players,
    secretWord,
    room.settings.impostorCount,
    hintWord
  );

  return {
    code: room.code,
    status: 'revealing', // revealing -> discussion -> voting -> results
    players: playersWithRoles,
    secretWord,
    impostorCount: room.settings.impostorCount,
    discussionSeconds: room.settings.discussionSeconds,
    discussionEndsAt: null,
    votes: {},
    round: 1,
    eliminatedPlayers: [],
    winner: null,
  };
}

/**
 * Procesar votación
 * @param {Object} gameState - Estado actual del juego
 * @param {Object} votes - Votos {playerId: votedPlayerId}
 * @returns {Object} Resultado de la votación
 */
function processVotes(gameState, votes) {
  const voteCounts = {};
  const activePlayers = gameState.players.filter(
    (p) => !gameState.eliminatedPlayers.includes(p.id)
  );

  // Contar solo votos de civiles; el voto del impostor no cuenta para la eliminación
  const civilianIds = new Set(
    activePlayers.filter((p) => p.role === 'civilian').map((p) => p.id)
  );
  Object.entries(votes).forEach(([voterId, votedId]) => {
    if (civilianIds.has(voterId) && votedId) {
      voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
    }
  });

  // Encontrar al jugador con más votos
  let maxVotes = 0;
  let eliminatedId = null;
  let isTie = false;

  Object.entries(voteCounts).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      eliminatedId = playerId;
      isTie = false;
    } else if (count === maxVotes && count > 0) {
      isTie = true;
    }
  });

  // Si hay empate, nadie es eliminado
  if (isTie || !eliminatedId) {
    return {
      eliminated: null,
      votes: voteCounts,
      isTie: true,
    };
  }

  const eliminatedPlayer = activePlayers.find((p) => p.id === eliminatedId);

  return {
    eliminated: eliminatedPlayer,
    votes: voteCounts,
    isTie: false,
  };
}

/**
 * Verificar si el juego ha terminado
 * @param {Object} gameState - Estado actual del juego
 * @returns {Object} {finished: boolean, winner: 'impostors'|'civilians'|null}
 */
function checkGameEnd(gameState) {
  const activePlayers = gameState.players.filter(
    (p) => !gameState.eliminatedPlayers.includes(p.id)
  );

  const activeImpostors = activePlayers.filter((p) => p.role === 'impostor');
  const activeCivilians = activePlayers.filter((p) => p.role === 'civilian');

  // Los impostores ganan si no quedan civiles o si quedan igual o más impostores que civiles
  if (activeCivilians.length === 0 || activeImpostors.length >= activeCivilians.length) {
    return { finished: true, winner: 'impostors' };
  }

  // Los civiles ganan si eliminan a todos los impostores
  if (activeImpostors.length === 0) {
    return { finished: true, winner: 'civilians' };
  }

  // El juego continúa
  return { finished: false, winner: null };
}

module.exports = {
  assignRoles,
  initializeGame,
  processVotes,
  checkGameEnd,
};
