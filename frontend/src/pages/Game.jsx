import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';

function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [gamePhase, setGamePhase] = useState('waiting'); // waiting, revealing, discussion, voting, results
  const [myRole, setMyRole] = useState(null); // { role, word, isImpostor }
  const [hasSeenRole, setHasSeenRole] = useState(false);
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // Lista completa de jugadores con nombres
  const [timeLeft, setTimeLeft] = useState(null);
  const [discussionEndsAt, setDiscussionEndsAt] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [showCardBack, setShowCardBack] = useState(true); // Control del flip de carta
  const [room, setRoom] = useState(null); // Información de la sala

  // Debug: Log cuando cambian los estados
  useEffect(() => {
    console.log(
      '🔄 Estado actual - gamePhase:',
      gamePhase,
      'myRole:',
      myRole,
      'hasSeenRole:',
      hasSeenRole,
    );
  }, [gamePhase, myRole, hasSeenRole]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Solicitar estado del juego al montar
    console.log('🎮 Solicitando estado del juego para sala:', code);
    socket.emit('game:get-state', { code }, (response) => {
      console.log('📥 Respuesta game:get-state:', response);
      if (response && response.ok) {
        console.log(
          '✅ Estado del juego recibido:',
          response.role.isImpostor ? 'IMPOSTOR' : response.role.word,
        );
        setMyRole(response.role);
        setGamePhase('revealing');
      } else {
        console.log(
          '⚠️ No se pudo obtener estado, esperando evento game:role...',
        );
      }
    });

    // Recibir rol asignado
    socket.on('game:role', (roleData) => {
      console.log(
        '🎭 Rol recibido:',
        roleData.isImpostor ? 'IMPOSTOR' : roleData.word,
      );
      setMyRole(roleData);
      setGamePhase('revealing');
      setShowCardBack(true);
      // Auto-flip después de 600ms
      setTimeout(() => setShowCardBack(false), 600);
    });
    
    // Recibir lista de jugadores
    socket.on('game:players-update', (playersList) => {
      setAllPlayers(playersList);
    });

    // Juego iniciado
    socket.on('game:started', (data) => {
      console.log('🎮 Juego iniciado:', data);
      setPlayers(Array(data.playerCount).fill(null));
      if (data.players) {
        setAllPlayers(data.players);
      }
      setShowCardBack(true); // Resetear carta al iniciar
    });

    // Fase de discusión
    const handleDiscussionStarted = (data) => {
      console.log('💬 Discusión iniciada:', data);
      console.log('🔄 Cambiando gamePhase a discussion');
      setGamePhase('discussion');
      setDiscussionEndsAt(data.endsAt);
      setHasSeenRole(false); // Reset para próxima ronda
    };

    socket.on('game:discussion-started', handleDiscussionStarted);

    // Log para debug: verificar que el listener está registrado
    console.log(
      '📡 Listener game:discussion-started registrado para sala:',
      code,
    );

    // Fase de votación
    socket.on('game:voting-started', () => {
      console.log('🗳️ Votación iniciada');
      setGamePhase('voting');
    });

    // Resultado de votación
    socket.on('game:vote-result', (result) => {
      console.log('📊 Resultado de votación:', result);
      alert(
        result.eliminated
          ? `${result.eliminated.name} fue eliminado!`
          : 'Empate! Nadie fue eliminado',
      );
    });

    // Juego terminado
    socket.on('game:finished', (result) => {
      console.log('🏁 Juego terminado:', result);
      setGamePhase('results');
      setGameResult(result);
    });

    console.log('✅ Todos los listeners registrados');

    // AHORA solicitar estado del juego (después de registrar listeners)
    console.log('🎮 Solicitando estado del juego para sala:', code);
    socket.emit('game:get-state', { code }, (response) => {
      console.log('📥 Respuesta game:get-state:', response);
      if (response && response.ok) {
        const wordOrRole = response.role.isImpostor
          ? 'IMPOSTOR'
          : response.role.word;
        console.log('✅ Estado del juego recibido:', wordOrRole);
        setMyRole(response.role);

        // Si el juego ya está en discussion, actualizar
        if (response.gameState.status === 'discussion') {
          console.log('⚡ El juego ya está en fase de discusión!');
          setGamePhase('discussion');
        } else {
          setGamePhase('revealing');
          setShowCardBack(true);
          setTimeout(() => setShowCardBack(false), 600);
        }
      } else {
        console.log('⚠️ No se pudo obtener estado:', response?.error);
      }
    });

    return () => {
      console.log('🧹 Limpiando listeners del juego');
      socket.off('game:role');
      socket.off('game:started');
      socket.off('game:discussion-started', handleDiscussionStarted);
      socket.off('game:voting-started');
      socket.off('game:vote-result');
      socket.off('game:finished');
    };
  }, [socket, isConnected, code]);

  // Temporizador de discusión
  useEffect(() => {
    if (gamePhase !== 'discussion' || !discussionEndsAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((discussionEndsAt - Date.now()) / 1000),
      );
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gamePhase, discussionEndsAt]);

  const handleRevealConfirm = () => {
    setHasSeenRole(true);
    console.log('📤 Confirmando rol para sala:', code);
    socket.emit('game:reveal-complete', { code }, (response) => {
      console.log('✅ Rol confirmado:', response);
      if (response && !response.ok) {
        console.error('❌ Error confirmando rol:', response.error);
      }
    });
  };

  const handleVote = (playerId) => {
    if (!playerId) return;

    console.log('📤 Votando por:', playerId);
    socket.emit('game:vote', { code, votedPlayerId: playerId }, (response) => {
      if (response && response.ok) {
        setSelectedVote(playerId);
        console.log('✅ Voto enviado');
      } else {
        console.error('❌ Error votando:', response?.error);
      }
    });
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  // ===== FASE: REVELACIÓN DE ROL =====
  if (gamePhase === 'revealing') {
    // Si ya vio su rol, mostrar pantalla de espera
    if (hasSeenRole) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black via-slate-950 to-black">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              ⏳
            </motion.div>
            <h2 className="text-2xl font-bold text-space-cyan mb-4">
              Esperando a los demás jugadores...
            </h2>
            <p className="text-gray-400 mb-4">
              Todos deben confirmar su rol antes de continuar
            </p>
            <div className="text-xs text-gray-500 mt-4 p-3 bg-space-blue/30 rounded-lg inline-block">
              Tu rol:{' '}
              {myRole?.isImpostor ? '🕵️ IMPOSTOR' : `🎯 ${myRole?.word}`}
            </div>
          </motion.div>
        </div>
      );
    }

    // Mostrar rol con animación premium de flip 3D
    const isImpostor = myRole?.isImpostor;
    const displayWord = myRole?.word || '';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl font-extrabold tracking-wide text-red-400 drop-shadow-lg mb-2">
            {isImpostor ? 'IMPOSTOR' : 'TU PALABRA'}
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
            Desliza tu mirada, no reveles tu carta
          </p>
        </motion.div>

        {/* Carta con flip 3D premium */}
        <div className="relative w-72 h-96 mb-8" style={{ perspective: '1200px' }}>
          <AnimatePresence mode="wait">
            {showCardBack ? (
              <motion.div
                key="card-back"
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: -180, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border-2 border-purple-500/50 shadow-[0_0_40px_rgba(139,92,246,0.5)] flex items-center justify-center cursor-pointer"
                onClick={() => setShowCardBack(false)}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="text-center" style={{ transform: 'translateZ(20px)' }}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    👁️‍🗨️
                  </motion.div>
                  <p className="text-slate-200 text-sm font-medium">
                    Toca para revelar tu rol
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="card-front"
                initial={{ rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 180, opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 border-slate-700 shadow-[0_0_40px_rgba(15,23,42,0.8)] flex flex-col items-center justify-center px-6"
                style={{ transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
              >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: 'spring', stiffness: 200 }}
                className="text-7xl mb-4"
              >
                {isImpostor ? '🕵️' : '🎯'}
              </motion.div>
              {isImpostor ? (
                <>
                  <p className="text-red-400 font-semibold text-xl mb-2">
                    Eres el IMPOSTOR
                  </p>
                  {displayWord && (
                    <p className="text-xs text-emerald-300 mb-4 px-4 py-2 bg-emerald-900/30 rounded-lg">
                      Pista: categoría{' '}
                      <span className="font-bold text-emerald-200">{displayWord}</span>
                    </p>
                  )}
                  <p className="text-xs text-slate-400 text-center px-4">
                    Finge que conoces la palabra secreta sin delatarte.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-400 mb-2">Tu palabra secreta es:</p>
                  <motion.p
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-4xl font-extrabold text-emerald-400 drop-shadow-lg mb-4 text-center"
                    style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
                  >
                    {displayWord}
                  </motion.p>
                  <p className="text-xs text-slate-400 text-center px-4">
                    Describe sin decirla. Hay {players.length > 5 ? '1-2' : '1'} impostor(es) intentando adivinarla.
                  </p>
                </>
              )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleRevealConfirm}
          className="w-full max-w-xs py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-black tracking-wide shadow-lg shadow-emerald-500/40 transition"
        >
          He visto mi rol
        </motion.button>
      </div>
    );
  }

  // Obtener información de la sala
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    socket.emit('room:get-info', { code }, (response) => {
      if (response && response.ok) {
        setRoom(response.room);
      }
    });
  }, [socket, isConnected, code]);

  // ===== FASE: DISCUSIÓN =====
  if (gamePhase === 'discussion') {
    const minutes = Math.floor((timeLeft || 0) / 60);
    const seconds = (timeLeft || 0) % 60;
    const isHost = room?.hostId === socket?.id;

    const handleStartVoting = () => {
      if (!isHost) return;
      socket.emit('game:start-voting', { code }, (response) => {
        if (response && response.ok) {
          console.log('✅ Votación iniciada por el host');
        } else {
          console.error('❌ Error iniciando votación:', response?.error);
        }
      });
    };

    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-glow mb-4">💬 Discusión</h1>
            <motion.div
              animate={timeLeft === 0 ? {} : { scale: [1, 1.05, 1] }}
              transition={{ duration: 1, repeat: timeLeft === 0 ? 0 : Infinity }}
              className="text-7xl font-bold text-space-cyan mb-4"
            >
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </motion.div>
            <p className="text-gray-400 mt-4 text-lg">
              Discutan y descubran quién es el impostor
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-2xl p-6 mb-6"
          >
            <div className="text-center">
              <div className="text-2xl mb-4">
                {myRole?.isImpostor ? (
                  <>
                    <span className="text-red-400">🕵️ Eres el IMPOSTOR</span>
                    {myRole?.word && (
                      <p className="text-sm text-emerald-300 mt-2">
                        Pista: {myRole.word}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-space-cyan">🎯 Tu palabra: <span className="font-bold text-emerald-400">{myRole?.word}</span></span>
                )}
              </div>
              <p className="text-gray-300 text-sm">
                {myRole?.isImpostor
                  ? 'Intenta descubrir la palabra sin revelar que eres el impostor'
                  : 'Habla sobre la palabra sin decirla directamente'}
              </p>
            </div>
          </motion.div>

          {isHost && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartVoting}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
            >
              🗳️ Iniciar Votación
            </motion.button>
          )}

          {timeLeft === 0 && !isHost && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-4 text-yellow-400"
            >
              ⏰ Tiempo agotado. Esperando que el host inicie la votación...
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ===== FASE: VOTACIÓN =====
  if (gamePhase === 'voting') {
    // Obtener jugadores activos (no eliminados) para votar
    const activePlayersForVote = allPlayers.length > 0 
      ? allPlayers.filter((p, idx) => !gameResult?.eliminatedPlayers?.includes(p.id))
      : players.map((_, idx) => ({ id: `player-${idx}`, name: `Jugador ${idx + 1}` }));

    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-glow mb-4">🗳️ Votación</h1>
            <p className="text-gray-400 text-lg">¿Quién crees que es el impostor?</p>
          </motion.div>

          <div className="glass-effect rounded-2xl p-6 space-y-4">
            <AnimatePresence>
              {activePlayersForVote.map((player, index) => {
                const playerId = player.id || `player-${index}`;
                const playerName = player.name || `Jugador ${index + 1}`;
                const isSelected = selectedVote === playerId;
                const isMe = player.id === socket?.id;

                return (
                  <motion.button
                    key={playerId}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => !isMe && handleVote(playerId)}
                    disabled={selectedVote !== null || isMe}
                    whileHover={selectedVote || isMe ? {} : { scale: 1.02, x: 5 }}
                    whileTap={selectedVote || isMe ? {} : { scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                        : isMe
                        ? 'border-gray-600 bg-gray-800/50 opacity-60 cursor-not-allowed'
                        : 'border-space-blue bg-space-blue/50 hover:border-space-cyan hover:bg-space-cyan/20'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {isMe ? '👤' : '🎭'}
                      </div>
                      <span className="text-white font-semibold text-lg">
                        {playerName}
                        {isMe && ' (Tú)'}
                      </span>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-2xl"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {selectedVote && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6 p-4 bg-emerald-500/20 rounded-xl border border-emerald-400/50"
            >
              <p className="text-emerald-300 font-semibold">
                ✓ Voto enviado. Esperando a los demás...
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // ===== FASE: RESULTADOS =====
  if (gamePhase === 'results' && gameResult) {
    const didIWin = myRole?.isImpostor
      ? gameResult.winner === 'impostors'
      : gameResult.winner === 'civilians';

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="max-w-2xl w-full"
        >
          <div className="glass-effect rounded-3xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-9xl mb-6"
            >
              {didIWin ? '🎉' : '😢'}
            </motion.div>
            
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-5xl font-bold mb-6 ${
                gameResult.winner === 'impostors'
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {gameResult.winner === 'impostors'
                ? '🕵️ Impostores Ganan!'
                : '🎯 Civiles Ganan!'}
            </motion.h1>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-space-cyan mb-8 p-4 bg-space-blue/30 rounded-xl"
            >
              La palabra secreta era:{' '}
              <span className="text-glow font-bold text-3xl text-emerald-400">
                {gameResult.secretWord}
              </span>
            </motion.div>

            {gameResult.eliminated && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
              >
                <p className="text-red-300 font-semibold text-lg">
                  ❌ {gameResult.eliminated.name} fue eliminado
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3 mb-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-4">📋 Roles Finales:</h3>
              <div className="grid gap-3">
                {gameResult.players.map((player, index) => {
                  const isImpostor = player.role === 'impostor';
                  return (
                    <motion.div
                      key={player.id || index}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className={`p-4 rounded-xl flex items-center justify-between ${
                        isImpostor
                          ? 'bg-red-500/20 border-2 border-red-500'
                          : 'bg-space-blue border-2 border-space-cyan/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {isImpostor ? '🕵️' : '🎯'}
                        </span>
                        <span className="text-white font-semibold text-lg">
                          {player.name || `Jugador ${index + 1}`}
                        </span>
                      </div>
                      <span className={`font-bold ${
                        isImpostor ? 'text-red-400' : 'text-emerald-400'
                      }`}>
                        {isImpostor ? 'IMPOSTOR' : player.word}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToLobby}
              className="w-full py-5 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-bold text-white text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
            >
              🏠 Volver al Inicio
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== ESPERANDO INICIO =====
  console.log('🖼️ Renderizando fase:', gamePhase);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="animate-pulse text-space-cyan text-xl mb-4">
          Esperando que el host inicie el juego...
        </div>
        <div className="text-gray-400 text-sm">Sala: {code}</div>
        <div className="text-xs text-gray-500 mt-4">
          Debug: Phase={gamePhase} | Role={myRole ? '✅' : '❌'} | Connected=
          {isConnected ? '✅' : '❌'}
        </div>
      </motion.div>
    </div>
  );
}

export default Game;
