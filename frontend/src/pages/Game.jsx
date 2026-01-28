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
  const [timeLeft, setTimeLeft] = useState(null);
  const [discussionEndsAt, setDiscussionEndsAt] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [gameResult, setGameResult] = useState(null);

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
    });

    // Juego iniciado
    socket.on('game:started', (data) => {
      console.log('🎮 Juego iniciado:', data);
      setPlayers(Array(data.playerCount).fill(null));
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
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold text-space-cyan mb-4">
              Esperando a los demás jugadores...
            </h2>
            <p className="text-gray-400">
              Todos deben confirmar su rol antes de continuar
            </p>
            <div className="text-xs text-gray-500 mt-4">
              Tu rol:{' '}
              {myRole?.isImpostor ? '🕵️ IMPOSTOR' : `🎯 ${myRole?.word}`}
            </div>
          </motion.div>
        </div>
      );
    }

    // Mostrar rol
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="glass-effect rounded-2xl p-8 text-center">
            <motion.div
              initial={{ rotateY: 180 }}
              animate={{ rotateY: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {myRole?.isImpostor ? (
                <>
                  <div className="text-8xl mb-6">🕵️</div>
                  <h1 className="text-4xl font-bold text-red-500 mb-4">
                    IMPOSTOR
                  </h1>
                  <p className="text-gray-300 mb-6">
                    No sabes la palabra secreta. Intenta descubrirla sin que te
                    descubran.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-8xl mb-6">🎯</div>
                  <h1 className="text-2xl font-bold text-space-cyan mb-4">
                    Tu palabra es:
                  </h1>
                  <div className="text-5xl font-bold text-glow mb-6">
                    {myRole?.word}
                  </div>
                  <p className="text-gray-300 mb-6">
                    Hay {players.length > 5 ? '1-2' : '1'} impostor(es) que no
                    saben esta palabra.
                  </p>
                </>
              )}
            </motion.div>

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRevealConfirm}
              className="w-full py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-lg font-semibold text-white"
            >
              Continuar
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== FASE: DISCUSIÓN =====
  if (gamePhase === 'discussion') {
    const minutes = Math.floor((timeLeft || 0) / 60);
    const seconds = (timeLeft || 0) % 60;

    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-glow mb-4">💬 Discusión</h1>
            <div className="text-6xl font-bold text-space-cyan">
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </div>
            <p className="text-gray-400 mt-4">
              Discutan y descubran quién es el impostor
            </p>
          </motion.div>

          <div className="glass-effect rounded-2xl p-6">
            <div className="text-center">
              <div className="text-2xl mb-4">
                {myRole?.isImpostor
                  ? '🕵️ Eres el IMPOSTOR'
                  : `🎯 Tu palabra: ${myRole?.word}`}
              </div>
              <p className="text-gray-300">
                {myRole?.isImpostor
                  ? 'Intenta descubrir la palabra sin revelar que eres el impostor'
                  : 'Habla sobre la palabra sin decirla directamente'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== FASE: VOTACIÓN =====
  if (gamePhase === 'voting') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-glow mb-4">🗳️ Votación</h1>
            <p className="text-gray-400">¿Quién crees que es el impostor?</p>
          </motion.div>

          <div className="glass-effect rounded-2xl p-6 space-y-3">
            {players.map((player, index) => (
              <motion.button
                key={index}
                onClick={() => handleVote(`player-${index}`)}
                disabled={selectedVote !== null}
                whileHover={{ scale: selectedVote ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  selectedVote === `player-${index}`
                    ? 'border-space-cyan bg-space-cyan/20'
                    : 'border-space-blue bg-space-blue hover:border-space-cyan/50'
                } disabled:opacity-50`}
              >
                <span className="text-white font-semibold">
                  Jugador {index + 1}
                  {selectedVote === `player-${index}` && ' ✓'}
                </span>
              </motion.button>
            ))}
          </div>

          {selectedVote && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mt-6 text-space-cyan"
            >
              Voto enviado. Esperando a los demás...
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl w-full"
        >
          <div className="glass-effect rounded-2xl p-8 text-center">
            <div className="text-8xl mb-6">{didIWin ? '🎉' : '😢'}</div>
            <h1 className="text-4xl font-bold mb-4">
              {gameResult.winner === 'impostors'
                ? '🕵️ Impostores Ganan!'
                : '🎯 Civiles Ganan!'}
            </h1>

            <div className="text-2xl text-space-cyan mb-6">
              La palabra secreta era:{' '}
              <span className="text-glow font-bold">
                {gameResult.secretWord}
              </span>
            </div>

            {gameResult.eliminated && (
              <p className="text-gray-300 mb-6">
                {gameResult.eliminated.name} fue eliminado
              </p>
            )}

            <div className="space-y-4 mb-8">
              <h3 className="text-xl font-semibold text-white">Roles:</h3>
              {gameResult.players.map((player, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    player.role === 'impostor'
                      ? 'bg-red-500/20 border border-red-500'
                      : 'bg-space-blue'
                  }`}
                >
                  <span className="text-white font-semibold">
                    {player.name}
                  </span>
                  <span className="ml-2">
                    {player.role === 'impostor'
                      ? '🕵️ IMPOSTOR'
                      : `🎯 ${player.word}`}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleBackToLobby}
              className="w-full py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Volver al inicio
            </button>
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
