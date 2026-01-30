import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../hooks/useTranslation';
import { capitalizeWord } from '../utils/formatWord';

function Game() {
  const { t } = useTranslation();
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
  const [voteResultsCountdown, setVoteResultsCountdown] = useState(null); // Timer para resultados de votación

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Recibir rol asignado
    socket.on('game:role', (roleData) => {
      setMyRole(roleData);
      setGamePhase('revealing');
      setShowCardBack(true);
      // Auto-flip después de 600ms
      setTimeout(() => setShowCardBack(false), 600);
    });

    // Recibir lista de jugadores
    socket.on('game:players-update', (playersList) => {
      if (playersList && Array.isArray(playersList) && playersList.length > 0) {
        setAllPlayers(playersList);
      } else {
        console.warn('⚠️ Lista de jugadores vacía o inválida:', playersList);
      }
    });

    // Juego iniciado (nueva partida desde resultados o desde vote-results)
    socket.on('game:started', (data) => {
      const isPostGamePhase = [
        'vote-results',
        'results',
        'discussion',
      ].includes(gamePhase);
      if (isPostGamePhase) {
        setGamePhase('revealing');
        setGameResult(null);
        setSelectedVote(null);
        setVoteResultsCountdown(null);
        setHasSeenRole(false);
      }
      setPlayers(Array(data.playerCount).fill(null));
      if (data.players) {
        setAllPlayers(data.players);
      }
      setShowCardBack(true); // Resetear carta al iniciar
    });

    // Fase de discusión
    const handleDiscussionStarted = (data) => {
      // Si estamos en vote-results, cambiar a discussion inmediatamente
      // El backend ya esperó 5 segundos antes de emitir este evento
      if (gamePhase === 'vote-results') {
        setGamePhase('discussion');
        setDiscussionEndsAt(data.endsAt);
        const remaining = Math.max(
          0,
          Math.floor((data.endsAt - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
        setHasSeenRole(false);
        setVoteResultsCountdown(null); // Limpiar timer
        return;
      }

      setGamePhase('discussion');
      setDiscussionEndsAt(data.endsAt);
      // Inicializar timeLeft inmediatamente
      const remaining = Math.max(
        0,
        Math.floor((data.endsAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      setHasSeenRole(false); // Reset para próxima ronda
    };

    socket.on('game:discussion-started', handleDiscussionStarted);

    // Fase de votación
    socket.on('game:voting-started', (data) => {
      setGamePhase('voting');
      setSelectedVote(null);
      if (data && data.players && Array.isArray(data.players)) {
        setAllPlayers(data.players);
      } else {
        socket.emit('game:get-state', { code }, (stateResponse) => {
          if (
            stateResponse &&
            stateResponse.ok &&
            stateResponse.gameState.players
          ) {
            setAllPlayers(stateResponse.gameState.players);
          }
        });
      }
    });

    // Resultado de votación
    socket.on('game:vote-result', (result) => {
      setSelectedVote(null);

      // Preparar datos del resultado (impostorDiscovered/correctVoters vienen del servidor; solo votos de civiles cuentan)
      const voteResultData = {
        eliminated: result.eliminated,
        votes: result.votes,
        votesWithNames: result.votesWithNames || {},
        players: result.players || [],
        impostor: result.impostor,
        secretWord: result.secretWord,
        isTie: result.isTie,
        impostorDiscovered: result.impostorDiscovered === true,
        correctVoters: result.correctVoters || [],
        incorrectVoters: result.incorrectVoters || [],
      };

      // Actualizar hostId y originalHostId si viene en el resultado
      if (result.hostId || result.originalHostId) {
        setRoom((prevRoom) => ({
          ...(prevRoom || {}),
          hostId: result.hostId || prevRoom?.hostId,
          originalHostId: result.originalHostId || prevRoom?.originalHostId,
          code: code,
        }));
      }

      socket.emit('game:get-state', { code }, (stateResponse) => {
        if (
          stateResponse &&
          stateResponse.ok &&
          (stateResponse.gameState.hostId ||
            stateResponse.gameState.originalHostId)
        ) {
          setRoom((prevRoom) => ({
            ...(prevRoom || {}),
            hostId: stateResponse.gameState.hostId || prevRoom?.hostId,
            originalHostId:
              stateResponse.gameState.originalHostId ||
              prevRoom?.originalHostId,
            code: code,
          }));
        }
      });

      // Cambiar a fase de resultados de votación para mostrar quién votó por quién
      setGameResult(voteResultData);
      setGamePhase('vote-results');
      setVoteResultsCountdown(5); // Iniciar timer de 5 segundos
    });

    // Juego terminado
    socket.on('game:finished', (result) => {
      // Limpiar voto seleccionado PRIMERO
      setSelectedVote(null);
      // Limpiar timeLeft
      setTimeLeft(null);

      // Obtener información completa de la sala para obtener originalHostId
      socket.emit('room:get-info', { code }, (roomResponse) => {
        if (roomResponse && roomResponse.ok && roomResponse.room) {
          setRoom({
            ...roomResponse.room,
            code: code,
          });
        } else {
          // Fallback: obtener del game:get-state
          socket.emit('game:get-state', { code }, (stateResponse) => {
            if (
              stateResponse &&
              stateResponse.ok &&
              (stateResponse.gameState.hostId ||
                stateResponse.gameState.originalHostId)
            ) {
              setRoom((prevRoom) => ({
                ...(prevRoom || {}),
                hostId: stateResponse.gameState.hostId || prevRoom?.hostId,
                originalHostId:
                  stateResponse.gameState.originalHostId ||
                  prevRoom?.originalHostId,
                code: code,
              }));
            }
          });
        }
      });

      // Cambiar fase
      setGamePhase('results');
      // Establecer resultado
      setGameResult(result);
    });
    // AHORA solicitar estado del juego (después de registrar listeners)
    socket.emit('game:get-state', { code }, (response) => {
      try {
        if (response && response.ok) {
          const wordOrRole = response.role.isImpostor
            ? 'IMPOSTOR'
            : response.role.word;
          setMyRole(response.role);

          // Guardar información del host si está disponible
          if (response.gameState.hostId) {
            // Si no tenemos room o el hostId es diferente, actualizar
            if (!room || room.hostId !== response.gameState.hostId) {
              setRoom({
                ...(room || {}),
                hostId: response.gameState.hostId,
                code: code,
              });
            }
          }

          // Actualizar lista de jugadores si viene en la respuesta
          if (
            response.gameState.players &&
            Array.isArray(response.gameState.players)
          ) {
            setAllPlayers(response.gameState.players);
          }

          // Si el juego ya terminó, cambiar a fase de resultados
          if (response.gameState.status === 'finished') {
            setGamePhase('results');
            // Si viene información del resultado, establecerla
            if (response.gameState.winner) {
              const resultData = {
                winner: response.gameState.winner,
                secretWord: response.gameState.secretWord,
                players:
                  response.gameState.finishedPlayers ||
                  response.gameState.players ||
                  [],
                eliminated: response.gameState.eliminated,
                votes: response.gameState.votes,
                votesWithNames: response.gameState.votesWithNames,
              };
              setGameResult(resultData);
            }
          }
          // Si el juego ya está en discussion, actualizar
          else if (response.gameState.status === 'discussion') {
            setGamePhase('discussion');
            // Inicializar discussionEndsAt si está disponible
            if (response.gameState.discussionEndsAt) {
              setDiscussionEndsAt(response.gameState.discussionEndsAt);
              // Inicializar timeLeft inmediatamente
              const remaining = Math.max(
                0,
                Math.floor(
                  (response.gameState.discussionEndsAt - Date.now()) / 1000
                )
              );
              setTimeLeft(remaining);
            }
          } else if (response.gameState.status === 'voting') {
            // Si el juego ya está en votación, cambiar fase y solicitar lista de jugadores
            setGamePhase('voting');
            // Solicitar lista de jugadores si no la tenemos
            if (allPlayers.length === 0) {
              socket.emit('game:get-state', { code }, (stateResponse) => {
                if (stateResponse && stateResponse.ok) {
                  // La lista de jugadores debería venir en otro evento, pero intentemos obtenerla
                }
              });
            }
          } else {
            setGamePhase('revealing');
            setShowCardBack(true);
            setTimeout(() => setShowCardBack(false), 600);
          }
        } else {
        }
      } catch (error) {
        console.error('❌ Error procesando respuesta game:get-state:', error);
      }
    });

    return () => {
      try {
        socket.off('game:role');
        socket.off('game:started');
        socket.off('game:discussion-started', handleDiscussionStarted);
        socket.off('game:voting-started');
        socket.off('game:vote-result');
        socket.off('game:finished');
      } catch (error) {
        console.warn('⚠️ Error limpiando listeners:', error);
      }
    };
  }, [socket, isConnected, code]);

  // Timer para resultados de votación
  useEffect(() => {
    if (
      gamePhase === 'vote-results' &&
      voteResultsCountdown !== null &&
      voteResultsCountdown > 0
    ) {
      const timer = setTimeout(() => {
        setVoteResultsCountdown(voteResultsCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gamePhase === 'vote-results' && voteResultsCountdown === 0) {
      // Si el timer llegó a 0, verificar si recibimos game:discussion-started
      // Si no, solicitar el estado del juego
      socket?.emit('game:get-state', { code }, (response) => {
        if (
          response &&
          response.ok &&
          response.gameState.status === 'discussion'
        ) {
          setGamePhase('discussion');
          if (response.gameState.discussionEndsAt) {
            setDiscussionEndsAt(response.gameState.discussionEndsAt);
            const remaining = Math.max(
              0,
              Math.floor(
                (response.gameState.discussionEndsAt - Date.now()) / 1000
              )
            );
            setTimeLeft(remaining);
          }
          setHasSeenRole(false);
        }
      });
    }
  }, [gamePhase, voteResultsCountdown, socket, code]);

  // Verificación periódica del estado del juego cuando está en votación
  useEffect(() => {
    if (gamePhase !== 'voting' || !socket || !isConnected || !code) return;

    // Si estamos en votación y tenemos un voto seleccionado, verificar periódicamente el estado
    if (selectedVote) {
      let checkCount = 0;
      const checkInterval = setInterval(() => {
        checkCount++;
        socket.emit('game:get-state', { code }, (response) => {
          if (response && response.ok) {
            // Si el juego terminó, actualizar el estado
            if (response.gameState.status === 'finished') {
              setGamePhase('results');
              if (response.gameState.winner) {
                setGameResult({
                  winner: response.gameState.winner,
                  secretWord: response.gameState.secretWord,
                  players:
                    response.gameState.finishedPlayers ||
                    response.gameState.players ||
                    [],
                  eliminated: response.gameState.eliminated,
                  votes: response.gameState.votes,
                  votesWithNames: response.gameState.votesWithNames,
                });
              }
              setSelectedVote(null);
              clearInterval(checkInterval);
            } else if (response.gameState.status === 'vote-results') {
              // Si el juego está en vote-results, deberíamos haber recibido game:vote-result
              // No hacer nada aquí, esperar a que llegue game:vote-result
            } else if (
              response.gameState.status === 'discussion' &&
              gamePhase === 'voting'
            ) {
              // Si el juego volvió a discusión y estamos en voting, significa que hubo un resultado
              // pero no recibimos game:vote-result, así que limpiar y continuar
              setSelectedVote(null);
              setGamePhase('discussion');
              clearInterval(checkInterval);
            }
          }
        });
      }, 2000); // Verificar cada 2 segundos

      // Limpiar después de 30 segundos si no hay respuesta (fallback)
      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 30000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [gamePhase, selectedVote, socket, isConnected, code]);

  // Temporizador de discusión
  useEffect(() => {
    if (gamePhase !== 'discussion' || !discussionEndsAt) {
      // Si no estamos en discusión, limpiar timeLeft
      if (gamePhase !== 'discussion') {
        setTimeLeft(null);
      }
      return;
    }

    // Inicializar timeLeft inmediatamente
    const initialRemaining = Math.max(
      0,
      Math.floor((discussionEndsAt - Date.now()) / 1000)
    );
    setTimeLeft(initialRemaining);

    let hasTriggeredAutoStart = false; // Flag para evitar múltiples llamadas

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((discussionEndsAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);

      if (remaining === 0 && !hasTriggeredAutoStart) {
        hasTriggeredAutoStart = true;
        clearInterval(interval);
        // Intentar iniciar votación automáticamente - el backend verificará si es host
        if (socket && isConnected && code) {
          socket.emit('game:start-voting', { code }, (voteResponse) => {
            if (voteResponse && voteResponse.ok) {
            } else {
              if (voteResponse?.error === 'NOT_HOST') {
              } else if (voteResponse?.error === 'GAME_NOT_FOUND') {
                console.error(
                  '❌ Juego no encontrado. Code usado:',
                  code,
                  '¿El juego aún está activo?'
                );
                // Intentar obtener el estado del juego para verificar
                socket.emit('game:get-state', { code }, (stateResponse) => {
                  if (stateResponse && stateResponse.ok) {
                    socket.emit(
                      'game:start-voting',
                      { code },
                      (retryResponse) => {
                        if (retryResponse && retryResponse.ok) {
                        } else {
                          console.error(
                            '❌ Error en reintento:',
                            retryResponse?.error
                          );
                        }
                      }
                    );
                  } else {
                    console.error(
                      '❌ El juego realmente no existe:',
                      stateResponse?.error
                    );
                  }
                });
              } else {
                console.error(
                  '❌ Error iniciando votación automáticamente:',
                  voteResponse?.error
                );
              }
            }
          });
        } else {
          console.error(
            '❌ No se puede iniciar votación - socket:',
            !!socket,
            'isConnected:',
            isConnected,
            'code:',
            code
          );
        }
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
  }, [gamePhase, discussionEndsAt, socket, isConnected, code]);

  const handleRevealConfirm = () => {
    setHasSeenRole(true);
    socket.emit('game:reveal-complete', { code }, (response) => {
      if (response && !response.ok) {
        console.error('❌ Error confirmando rol:', response.error);
      }
    });
  };

  const handleVote = (playerId) => {
    if (!playerId) return;
    socket.emit('game:vote', { code, votedPlayerId: playerId }, (response) => {
      if (response && response.ok) {
        setSelectedVote(playerId);
        if (response.isImpostorVote) {
          // Mostrar mensaje para el impostor también
          // El mensaje ya se mostrará porque selectedVote está establecido
        } else {
        }
      } else {
        if (response?.error === 'IMPOSTOR_CANNOT_VOTE') {
          alert(t('game.impostorsCannotVote'));
        } else if (response?.error === 'NOT_VOTING_PHASE') {
          console.error('❌ El juego no está en fase de votación.');
          console.error('   Estado local (frontend):', gamePhase);
          console.error(
            '   Estado del servidor (backend):',
            response?.currentStatus
          );
          // Solo mostrar alerta si no es impostor (el impostor puede intentar votar antes de que se inicie)
          if (!myRole?.isImpostor) {
            alert(t('errors.votingPhase'));
          } else {
          }
        } else if (response?.error === 'GAME_FINISHED') {
          // Solicitar el estado final del juego
          socket.emit('game:get-state', { code }, (stateResponse) => {
            if (
              stateResponse &&
              stateResponse.ok &&
              stateResponse.gameState.status === 'finished'
            ) {
              // El juego terminó, deberíamos recibir game:finished, pero por si acaso lo solicitamos
            }
          });
        } else {
          console.error('❌ Error votando:', response?.error);
          // Solo mostrar alerta si no es impostor
          if (!myRole?.isImpostor) {
            alert(
              t('errors.voteError', {
                error: response?.error || t('errors.unknown'),
              })
            );
          }
        }
      }
    });
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  // Unirse a la sala y obtener información (debe estar antes de cualquier early return)
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Unirse a la sala para asegurar que socket.data.roomCode esté establecido
    const joinRoom = () => {
      // Primero intentar obtener información de la sala para ver si el jugador ya está en ella
      socket.emit('room:get-info', { code }, (infoResponse) => {
        let playerName = t('common.playerDefault');
        let existingPlayer = null; // Declarar fuera del if para usarlo después

        if (infoResponse && infoResponse.ok && infoResponse.room) {
          // Buscar si el jugador ya está en la lista de jugadores
          existingPlayer = infoResponse.room.players?.find(
            (p) => p.id === socket?.id
          );
          if (existingPlayer) {
            // Usar el nombre que ya tiene en la sala
            playerName = existingPlayer.name;
          } else {
            // Si no está en la sala, usar el nombre del localStorage o socket.data
            playerName =
              socket.data?.playerName ||
              localStorage.getItem('playerName') ||
              t('common.playerDefault');
          }
        } else {
          // Si no se puede obtener info, usar el nombre del localStorage o socket.data
          playerName =
            socket.data?.playerName ||
            localStorage.getItem('playerName') ||
            t('common.playerDefault');
        }

        // Ahora unirse a la sala con el nombre correcto
        // IMPORTANTE: Si el jugador ya existe en la sala, usar su nombre original
        const joinData = existingPlayer
          ? { code, name: existingPlayer.name } // Usar el nombre existente para preservarlo
          : { code, name: playerName }; // Usar el nombre encontrado o por defecto
        socket.emit('room:join', joinData, (response) => {
          if (response && response.ok) {
            setRoom(response.room);
          } else {
            // Si no se puede unir (por ejemplo, sala llena), intentar solo obtener info
            socket.emit('room:get-info', { code }, (infoResponse) => {
              if (infoResponse && infoResponse.ok) {
                setRoom(infoResponse.room);
              } else {
              }
            });
          }
        });
      });
    };

    // Unirse inmediatamente
    joinRoom();

    // También escuchar actualizaciones de la sala
    socket.on('room:updated', (roomData) => {
      setRoom(roomData);
    });

    return () => {
      socket.off('room:updated');
      // No hacer room:leave aquí porque queremos mantener la conexión durante el juego
    };
  }, [socket, isConnected, code]);

  // ===== FASE: REVELACIÓN DE ROL =====
  if (gamePhase === 'revealing') {
    // Si ya vio su rol, mostrar pantalla de espera
    if (hasSeenRole) {
      return (
        <div className="min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
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
              {t('game.waitingOthers')}
            </h2>
            <p className="text-gray-400 mb-4">{t('game.everyoneConfirm')}</p>
            <div className="text-xs text-gray-500 mt-4 p-3 bg-space-blue/30 rounded-lg inline-block">
              {t('game.yourRole')}:{' '}
              {myRole?.isImpostor
                ? '🕵️ IMPOSTOR'
                : `🎯 ${capitalizeWord(myRole?.word)}`}
            </div>
          </motion.div>
        </div>
      );
    }

    // Mostrar rol con animación premium de flip 3D
    const isImpostor = myRole?.isImpostor;
    const displayWord = myRole?.word || '';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 pt-14 md:pt-20 bg-gradient-to-b from-black via-slate-950 to-black">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl font-extrabold tracking-wide text-red-400 drop-shadow-lg mb-2">
            {isImpostor
              ? t('game.youAreImpostor').toUpperCase()
              : t('game.yourWord').toUpperCase()}
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-[0.2em]">
            {t('game.revealSubtitle')}
          </p>
        </motion.div>

        {/* Carta con flip 3D premium */}
        <div
          className="relative w-72 h-96 mb-8"
          style={{ perspective: '1200px' }}
        >
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
                <div
                  className="text-center"
                  style={{ transform: 'translateZ(20px)' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    👁️‍🗨️
                  </motion.div>
                  <p className="text-slate-200 text-sm font-medium">
                    {t('game.touchToReveal')}
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
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
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
                      {t('game.youAreImpostor')}
                    </p>
                    {displayWord && (
                      <p className="text-xs text-emerald-300 mb-4 px-4 py-2 bg-emerald-900/30 rounded-lg">
                        {t('game.hintCategory')} ({t('game.category')}):{' '}
                        <span className="font-bold text-emerald-200">
                          {capitalizeWord(displayWord)}
                        </span>
                      </p>
                    )}
                    <p className="text-xs text-slate-400 text-center px-4">
                      {t('game.impostorHint')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-400 mb-2">
                      {t('game.yourSecretWord')}:
                    </p>
                    <motion.p
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 1.2 }}
                      className="text-4xl font-extrabold text-emerald-400 drop-shadow-lg mb-4 text-center"
                      style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
                    >
                      {capitalizeWord(displayWord)}
                    </motion.p>
                    <p className="text-xs text-slate-400 text-center px-4">
                      {t('game.describeWithoutSaying', {
                        count: players.length > 5 ? '1-2' : '1',
                      })}
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
          {t('game.iSawMyRole')}
        </motion.button>
      </div>
    );
  }

  // ===== FASE: DISCUSIÓN =====
  if (gamePhase === 'discussion') {
    const minutes = Math.floor((timeLeft ?? 0) / 60);
    const seconds = (timeLeft ?? 0) % 60;
    // Verificar si es host - el backend verificará de todas formas
    const isHost = room?.hostId === socket?.id;

    const handleStartVoting = () => {
      // Verificar que estamos en fase de discusión antes de intentar
      if (!code) {
        console.error('❌ No hay código de sala disponible');
        alert(`${t('common.error')}: ${t('errors.noRoomCode')}`);
        return;
      }

      if (gamePhase !== 'discussion') {
        console.warn(
          '⚠️ No estás en fase de discusión. Estado actual:',
          gamePhase
        );
        alert(t('errors.cannotStartVotingNow', { phase: gamePhase }));
        return;
      }

      socket.emit('game:start-voting', { code }, (response) => {
        if (response && response.ok) {
        } else {
          if (response?.error === 'NOT_HOST') {
            alert(t('game.onlyHostStartsVoting'));
          } else if (response?.error === 'NOT_DISCUSSION_PHASE') {
            console.error(
              '❌ El juego no está en fase de discusión. Estado actual:',
              response?.currentStatus
            );
            console.error('   Estado local - gamePhase:', gamePhase);
            alert(
              `${t('common.error')}: ${t('errors.notDiscussionPhase', {
                status: response?.currentStatus || 'desconocido',
              })}`
            );
          } else if (response?.error === 'GAME_NOT_FOUND') {
            console.error(
              '❌ Juego no encontrado al intentar iniciar votación manualmente'
            );
            alert(`${t('common.error')}: ${t('errors.gameNotFound')}`);
          } else {
            console.error('❌ Error iniciando votación:', response?.error);
            alert(
              `${t('common.error')}: ${response?.error || t('errors.unknown')}`
            );
          }
        }
      });
    };

    return (
      <div className="min-h-full p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-glow mb-4">
              💬 {t('game.discussion')}
            </h1>
            <motion.div
              animate={timeLeft === 0 ? {} : { scale: [1, 1.05, 1] }}
              transition={{
                duration: 1,
                repeat: timeLeft === 0 ? 0 : Infinity,
              }}
              className="text-7xl font-bold text-space-cyan mb-4"
            >
              {String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </motion.div>
            <p className="text-gray-400 mt-4 text-lg">
              {t('game.discussAndDiscover')}
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
                    <span className="text-red-400">
                      🕵️ {t('game.youAreImpostor')}
                    </span>
                    {myRole?.word && (
                      <p className="text-sm text-emerald-300 mt-2">
                        {t('game.hintCategory')}: {capitalizeWord(myRole.word)}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-space-cyan">
                    🎯 {t('game.yourWord')}:{' '}
                    <span className="font-bold text-emerald-400">
                      {capitalizeWord(myRole?.word)}
                    </span>
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm">
                {myRole?.isImpostor
                  ? t('game.impostorGoal')
                  : t('game.civilHint')}
              </p>
            </div>
          </motion.div>

          {/* Solo los civiles pueden iniciar la votación (no el impostor) */}
          {!myRole?.isImpostor && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartVoting}
              className={`w-full py-4 rounded-xl font-semibold text-white shadow-lg transition-all mb-4 ${
                timeLeft === 0
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-red-500/50 hover:shadow-red-500/70 animate-pulse'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/50 hover:shadow-purple-500/70'
              }`}
            >
              {timeLeft === 0
                ? `⏰ ${t('game.timeUpStartVoting')}`
                : `🗳️ ${t('game.startVoting')}`}
            </motion.button>
          )}

          {/* Mensaje para el impostor cuando el tiempo se agota */}
          {myRole?.isImpostor && timeLeft === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/50"
            >
              <p className="text-yellow-400 font-semibold">
                ⏰ {t('game.timeUpWaiting')}
              </p>
            </motion.div>
          )}

          {/* Botón para volver al inicio */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToLobby}
            className="w-full py-3 rounded-xl font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all"
          >
            🏠 {t('game.backToHome')}
          </motion.button>
        </div>
      </div>
    );
  }

  // ===== FASE: VOTACIÓN =====
  if (gamePhase === 'voting') {
    // Obtener jugadores activos (no eliminados) para votar
    // Si allPlayers está vacío, intentar obtener de gameState o usar players
    const myPlayerId = socket?.id;

    let activePlayersForVote = [];

    if (allPlayers.length > 0) {
      activePlayersForVote = allPlayers.filter((p) => {
        const isEliminated = gameResult?.eliminatedPlayers?.includes(p.id);
        const isMe = p.id === myPlayerId;
        return !isEliminated && !isMe; // Excluir eliminados y al jugador mismo
      });
    } else if (players.length > 0) {
      // Si no hay allPlayers, crear lista básica desde players
      activePlayersForVote = players
        .map((_, idx) => ({
          id: `player-${idx}`,
          name: `${t('common.playerDefault')} ${idx + 1}`,
        }))
        .filter((p) => {
          const isEliminated = gameResult?.eliminatedPlayers?.includes(p.id);
          const isMe = p.id === myPlayerId;
          return !isEliminated && !isMe; // Excluir eliminados y al jugador mismo
        });
    }

    // Debug: Log para ver qué jugadores hay disponibles
    return (
      <div className="min-h-full p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-bold text-glow mb-4">
              🗳️ {t('game.voting')}
            </h1>
            <p className="text-gray-400 text-lg">
              {myRole?.isImpostor
                ? t('game.impostorFakeVote')
                : t('game.whoIsImpostor')}
            </p>
            {myRole?.isImpostor && (
              <p className="text-red-400 text-sm mt-2">
                ⚠️ {t('game.impostorVoteNoCount')}
              </p>
            )}
          </motion.div>

          <div className="glass-effect rounded-2xl p-6 space-y-4">
            {activePlayersForVote.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-lg mb-4">
                  {t('game.noPlayersToVote')}
                </p>
                <p className="text-gray-500 text-sm">
                  {t('game.waitingPlayerList')}
                </p>
              </div>
            ) : (
              <AnimatePresence>
                {activePlayersForVote
                  .filter((player) => {
                    // Doble verificación: asegurar que no sea el jugador mismo
                    const isMe =
                      player.id === myPlayerId || player.id === socket?.id;
                    if (isMe) {
                    }
                    return !isMe;
                  })
                  .map((player, index) => {
                    const playerId = player.id || `player-${index}`;
                    const playerName =
                      player.name ||
                      `${t('common.playerDefault')} ${index + 1}`;
                    const isSelected = selectedVote === playerId;

                    return (
                      <motion.button
                        key={playerId}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleVote(playerId)}
                        disabled={selectedVote !== null}
                        whileHover={selectedVote ? {} : { scale: 1.02, x: 5 }}
                        whileTap={selectedVote ? {} : { scale: 0.98 }}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-emerald-400 bg-emerald-500/20 shadow-lg shadow-emerald-500/30'
                            : 'border-space-blue bg-space-blue/50 hover:border-space-cyan hover:bg-space-cyan/20'
                        } disabled:opacity-50`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">🎭</div>
                          <span className="text-white font-semibold text-lg">
                            {playerName}
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
            )}
          </div>

          {selectedVote && gamePhase === 'voting' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mt-6 p-4 bg-emerald-500/20 rounded-xl border border-emerald-400/50"
            >
              <p className="text-emerald-300 font-semibold">
                ✓ {t('game.voteSent')}
              </p>
            </motion.div>
          )}

          {/* Debug: mostrar estado actual */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-xs text-gray-500 text-center">
              Debug: gamePhase={gamePhase}, selectedVote=
              {selectedVote ? 'set' : 'null'}
            </div>
          )}

          {/* Botón para volver al inicio */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBackToLobby}
            className="w-full mt-6 py-3 rounded-xl font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all"
          >
            🏠 {t('game.backToHome')}
          </motion.button>
        </div>
      </div>
    );
  }

  // ===== FASE: RESULTADOS DE VOTACIÓN (antes de continuar) =====
  if (gamePhase === 'vote-results' && gameResult) {
    return (
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="max-w-2xl w-full"
        >
          <div className="glass-effect rounded-3xl p-8 text-center">
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl font-bold mb-6 text-space-cyan"
            >
              🗳️ {t('game.voteResults')}
            </motion.h1>

            {gameResult.impostorDiscovered && gameResult.eliminated && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50"
              >
                <p className="font-semibold text-lg text-emerald-300">
                  🎯 {t('game.impostorDiscovered')}:{' '}
                  {gameResult.eliminated.name}
                </p>
              </motion.div>
            )}

            {/* Mostrar votos: quién votó a quién; el impostor solo nombre + "Impostor" */}
            {gameResult.votesWithNames &&
              Object.keys(gameResult.votesWithNames).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-6"
                >
                  <h3 className="text-2xl font-semibold text-white mb-4 text-center">
                    🗳️ {t('game.votes')}
                  </h3>
                  <div className="space-y-2">
                    {gameResult.players.map((player, index) => {
                      const voteInfo = gameResult.votesWithNames[player.id];
                      const isImpostor = player.role === 'impostor';
                      const votedForImpostor =
                        !isImpostor &&
                        voteInfo &&
                        voteInfo.votedId &&
                        gameResult.impostor &&
                        voteInfo.votedId === gameResult.impostor.id;
                      const didNotVoteForImpostor =
                        !isImpostor &&
                        voteInfo &&
                        voteInfo.votedId &&
                        gameResult.impostor &&
                        voteInfo.votedId !== gameResult.impostor.id;

                      return (
                        <motion.div
                          key={player.id || index}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            isImpostor
                              ? 'bg-yellow-500/20 border border-yellow-500/50'
                              : votedForImpostor
                              ? 'bg-emerald-500/20 border border-emerald-500/50'
                              : didNotVoteForImpostor
                              ? 'bg-red-500/20 border border-red-500/50'
                              : 'bg-gray-800/50 border border-gray-700/50'
                          }`}
                        >
                          <span className="text-white font-medium">
                            {player.name}
                          </span>
                          <div className="flex items-center gap-2">
                            {isImpostor ? (
                              <span className="text-yellow-400 font-semibold">
                                🕵️ {t('game.impostorLabel')}
                              </span>
                            ) : voteInfo && voteInfo.votedName ? (
                              <>
                                <span
                                  className={`font-semibold ${
                                    votedForImpostor
                                      ? 'text-emerald-400'
                                      : 'text-red-400'
                                  }`}
                                >
                                  {t('game.votedFor', {
                                    name: voteInfo.votedName,
                                  })}
                                </span>
                                {votedForImpostor ? (
                                  <span className="text-emerald-300 text-sm">
                                    ✓ {t('game.correct')}
                                  </span>
                                ) : (
                                  <span className="text-red-300 text-sm">
                                    ✗ {t('game.wrong')}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400">
                                {t('game.noVote')}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

            {/* Mostrar quién es el impostor */}
            {gameResult.impostor && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
              >
                <p className="text-red-300 font-semibold text-lg">
                  🕵️ {t('game.impostorWas')}{' '}
                  <span className="text-red-400">
                    {gameResult.impostor.name}
                  </span>
                </p>
              </motion.div>
            )}

            {/* Botones de acción */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3 mt-6"
            >
              {/* Solo el creador original de la sala puede iniciar nueva partida */}
              {(() => {
                const isOriginalHost = room?.originalHostId === socket?.id;
                return isOriginalHost;
              })() && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setVoteResultsCountdown(null); // Evitar que el timer de vote-results haga get-state y cambie a discussion
                    // Asegurarse de que el socket esté unido a la sala antes de crear nueva partida
                    // Esto es importante si el socket perdió su referencia
                    if (code && socket) {
                      // Intentar unirse a la sala primero para asegurar que socket.data.roomCode esté establecido
                      socket.emit(
                        'room:join',
                        {
                          code,
                          name:
                            room?.players?.find((p) => p.id === socket.id)
                              ?.name || t('common.playerDefault'),
                        },
                        (joinResponse) => {
                          if (joinResponse && joinResponse.ok) {
                          } else {
                          }

                          // Ahora intentar crear la nueva partida
                          socket.emit('game:new-game', { code }, (response) => {
                            if (response && response.ok) {
                              // El juego se reiniciará y recibiremos game:started
                            } else {
                              console.error(
                                '❌ Error iniciando nueva partida:',
                                response?.error
                              );
                              alert(
                                `${t('common.error')}: ${
                                  response?.error || t('errors.newGameError')
                                }`
                              );
                            }
                          });
                        }
                      );
                    } else {
                      console.error(
                        '❌ No hay código de sala o socket disponible'
                      );
                      alert(t('errors.roomError'));
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white text-lg shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all"
                >
                  🎮 {t('game.newGame')}
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBackToLobby}
                className="w-full py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-bold text-white text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
              >
                🏠 {t('game.backToHome')}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== FASE: RESULTADOS FINALES =====
  if (gamePhase === 'results' && gameResult) {
    const didIWin = myRole?.isImpostor
      ? gameResult.winner === 'impostors'
      : gameResult.winner === 'civilians';

    return (
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
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
                ? `🕵️ ${t('game.impostorsWin')}`
                : `🎯 ${t('game.civiliansWin')}`}
            </motion.h1>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-2xl text-space-cyan mb-8 p-4 bg-space-blue/30 rounded-xl"
            >
              {t('game.secretWordWas')}{' '}
              <span className="text-glow font-bold text-3xl text-emerald-400">
                {capitalizeWord(gameResult.secretWord)}
              </span>
            </motion.div>

            {gameResult.eliminated && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`mb-8 p-4 rounded-xl ${
                  gameResult.impostorDiscovered
                    ? 'bg-emerald-500/20 border border-emerald-500/50'
                    : 'bg-red-500/20 border border-red-500/50'
                }`}
              >
                <p
                  className={`font-semibold text-lg ${
                    gameResult.impostorDiscovered
                      ? 'text-emerald-300'
                      : 'text-red-300'
                  }`}
                >
                  {gameResult.impostorDiscovered ? (
                    <>
                      🎯 {t('game.impostorDiscovered')}:{' '}
                      {gameResult.eliminated.name}
                    </>
                  ) : (
                    <>
                      ❌ {gameResult.eliminated.name} {t('game.eliminated')}
                    </>
                  )}
                </p>
              </motion.div>
            )}

            {/* Mostrar votos: quién votó a quién; el impostor solo nombre + "Impostor" */}
            {gameResult.votesWithNames &&
              Object.keys(gameResult.votesWithNames).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="mb-8"
                >
                  <h3 className="text-2xl font-semibold text-white mb-4 text-center">
                    🗳️ {t('game.votes')}
                  </h3>
                  <div className="space-y-2">
                    {gameResult.players.map((player, index) => {
                      const voteInfo = gameResult.votesWithNames[player.id];
                      const isImpostor = player.role === 'impostor';
                      const votedForImpostor =
                        !isImpostor &&
                        gameResult.impostor &&
                        voteInfo?.votedId === gameResult.impostor.id;
                      const didNotVoteForImpostor =
                        !isImpostor &&
                        voteInfo?.votedId &&
                        gameResult.impostor &&
                        voteInfo.votedId !== gameResult.impostor.id;

                      return (
                        <motion.div
                          key={player.id || index}
                          initial={{ x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.6 + index * 0.05 }}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            isImpostor
                              ? 'bg-red-500/10 border border-red-500/30'
                              : votedForImpostor
                              ? 'bg-emerald-500/20 border border-emerald-500/50'
                              : didNotVoteForImpostor
                              ? 'bg-red-500/20 border border-red-500/50'
                              : 'bg-gray-800/50 border border-gray-700/50'
                          }`}
                        >
                          <span className="text-white font-medium">
                            {player.name}
                          </span>
                          <span
                            className={`font-semibold ${
                              isImpostor
                                ? 'text-red-400'
                                : votedForImpostor
                                ? 'text-emerald-400'
                                : didNotVoteForImpostor
                                ? 'text-red-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {isImpostor
                              ? `🕵️ ${t('game.impostorLabel')}`
                              : voteInfo && voteInfo.votedName
                              ? t('game.votedFor', { name: voteInfo.votedName })
                              : t('game.noVote')}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

            {/* Botones de acción */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col gap-3 mt-6"
            >
              {/* Solo el creador original de la sala puede iniciar nueva partida */}
              {(() => {
                const isOriginalHost = room?.originalHostId === socket?.id;
                return isOriginalHost;
              })() && (
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setVoteResultsCountdown(null); // Evitar que el timer de vote-results haga get-state y cambie a discussion
                    // Asegurarse de que el socket esté unido a la sala antes de crear nueva partida
                    // Esto es importante si el socket perdió su referencia
                    if (code && socket) {
                      // Intentar unirse a la sala primero para asegurar que socket.data.roomCode esté establecido
                      socket.emit(
                        'room:join',
                        {
                          code,
                          name:
                            room?.players?.find((p) => p.id === socket.id)
                              ?.name || t('common.playerDefault'),
                        },
                        (joinResponse) => {
                          if (joinResponse && joinResponse.ok) {
                          } else {
                          }

                          // Ahora intentar crear la nueva partida
                          socket.emit('game:new-game', { code }, (response) => {
                            if (response && response.ok) {
                              // El juego se reiniciará y recibiremos game:started
                            } else {
                              console.error(
                                '❌ Error iniciando nueva partida:',
                                response?.error
                              );
                              alert(
                                `${t('common.error')}: ${
                                  response?.error || t('errors.newGameError')
                                }`
                              );
                            }
                          });
                        }
                      );
                    } else {
                      console.error(
                        '❌ No hay código de sala o socket disponible'
                      );
                      alert(t('errors.roomError'));
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white text-lg shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all"
                >
                  🎮 {t('game.newGame')}
                </motion.button>
              )}

              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBackToLobby}
                className="w-full py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-bold text-white text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
              >
                🏠 {t('game.backToHome')}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ===== ESPERANDO INICIO =====
  return (
    <div className="min-h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="animate-pulse text-space-cyan text-xl mb-4">
          {t('game.waitingHost')}
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
