/**
 * Lógica del juego local (un dispositivo) - espejo de backend/utils/gameLogic.js
 */

/** Barajado uniforme (Fisher–Yates). */
function shuffleArray (items) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignRoles (players, secretWord, impostorCount = 1, hintWord = null) {
  if (players.length < 3) {
    throw new Error('Se necesitan al menos 3 jugadores');
  }
  if (impostorCount >= players.length) {
    throw new Error('Número de impostores inválido');
  }

  const impostorIds = new Set(
    shuffleArray(players.map((p) => p.id)).slice(0, impostorCount)
  );

  return shuffleArray(players).map((player) => {
    const isImpostor = impostorIds.has(player.id);
    return {
      ...player,
      role: isImpostor ? 'impostor' : 'civilian',
      word: isImpostor ? hintWord : secretWord,
    };
  });
}

export function processVotes (gameState, votes) {
  const voteCounts = {};
  const activePlayers = gameState.players.filter(
    (p) => !gameState.eliminatedPlayers.includes(p.id)
  );
  const impostorIds = new Set(
    gameState.players.filter((p) => p.role === 'impostor').map((p) => p.id)
  );
  const civilianVotes = Object.fromEntries(
    Object.entries(votes).filter(([voterId]) => !impostorIds.has(voterId))
  );

  Object.values(civilianVotes).forEach((votedId) => {
    voteCounts[votedId] = (voteCounts[votedId] || 0) + 1;
  });

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

  if (isTie || !eliminatedId) {
    return { eliminated: null, votes: voteCounts, isTie: true };
  }

  const eliminatedPlayer = activePlayers.find((p) => p.id === eliminatedId);
  return { eliminated: eliminatedPlayer, votes: voteCounts, isTie: false };
}

export function checkGameEnd (gameState) {
  const activePlayers = gameState.players.filter(
    (p) => !gameState.eliminatedPlayers.includes(p.id)
  );
  const activeImpostors = activePlayers.filter((p) => p.role === 'impostor');
  const activeCivilians = activePlayers.filter((p) => p.role === 'civilian');

  if (activeCivilians.length === 0 || activeImpostors.length >= activeCivilians.length) {
    return { finished: true, winner: 'impostors' };
  }
  if (activeImpostors.length === 0) {
    return { finished: true, winner: 'civilians' };
  }
  return { finished: false, winner: null };
}
