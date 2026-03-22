import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  lazy,
  Suspense,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../hooks/useTranslation';
import { getOrCreateStatsId } from '../utils/statsId';
import GameRevealingPhase from '../game/GameRevealingPhase';
import GameCluesPhase from '../game/GameCluesPhase';
import GameDiscussionPhase from '../game/GameDiscussionPhase';
import GameVotingPhase from '../game/GameVotingPhase';
import GameWaitingPhase from '../game/GameWaitingPhase';

const GameVoteResultsPhase = lazy(() => import('../game/GameVoteResultsPhase'));
const GameFinalResultsPhase = lazy(() => import('../game/GameFinalResultsPhase'));

function PhaseFallback ({ message }) {
  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
      {message}
    </div>
  );
}

function Game () {
  const { t } = useTranslation();
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();

  const [gamePhase, setGamePhase] = useState('waiting');
  const [myRole, setMyRole] = useState(null);
  const [hasSeenRole, setHasSeenRole] = useState(false);
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [discussionEndsAt, setDiscussionEndsAt] = useState(null);
  const [selectedVote, setSelectedVote] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [showCardBack, setShowCardBack] = useState(true);
  const [room, setRoom] = useState(null);
  const [voteResultsCountdown, setVoteResultsCountdown] = useState(null);
  const [clueRound, setClueRound] = useState(1);
  const clueRoundRef = useRef(1);
  const [clueRoundEndsAt, setClueRoundEndsAt] = useState(null);
  const [clueTimeLeft, setClueTimeLeft] = useState(null);
  const [cluesForRound, setCluesForRound] = useState({});
  const [myClueSubmitted, setMyClueSubmitted] = useState(false);
  const [clueInput, setClueInput] = useState('');

  const gamePhaseRef = useRef(gamePhase);
  const allPlayersRef = useRef(allPlayers);
  const roomRef = useRef(room);
  useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);
  useEffect(() => {
    allPlayersRef.current = allPlayers;
  }, [allPlayers]);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('game:role', (roleData) => {
      setMyRole(roleData);
      setGamePhase('revealing');
      setShowCardBack(true);
      setTimeout(() => setShowCardBack(false), 600);
    });

    socket.on('game:players-update', (playersList) => {
      if (playersList && Array.isArray(playersList) && playersList.length > 0) {
        setAllPlayers(playersList);
      } else {
        console.warn('⚠️ Lista de jugadores vacía o inválida:', playersList);
      }
    });

    socket.on('game:started', (data) => {
      const phase = gamePhaseRef.current;
      const isPostGamePhase = [
        'vote-results',
        'results',
        'discussion',
        'clues',
      ].includes(phase);
      if (isPostGamePhase) {
        setGamePhase('revealing');
        setGameResult(null);
        setSelectedVote(null);
        setVoteResultsCountdown(null);
        setHasSeenRole(false);
        setClueRound(1);
        clueRoundRef.current = 1;
        setClueRoundEndsAt(null);
        setClueTimeLeft(null);
        setCluesForRound({});
        setMyClueSubmitted(false);
        setClueInput('');
      }
      setPlayers(Array(data.playerCount).fill(null));
      if (data.players) {
        setAllPlayers(data.players);
      }
      setShowCardBack(true);
    });

    const handleDiscussionStarted = (data) => {
      if (gamePhaseRef.current === 'vote-results') {
        setGamePhase('discussion');
        setDiscussionEndsAt(data.endsAt);
        const remaining = Math.max(
          0,
          Math.floor((data.endsAt - Date.now()) / 1000)
        );
        setTimeLeft(remaining);
        setHasSeenRole(false);
        setVoteResultsCountdown(null);
        return;
      }

      setGamePhase('discussion');
      setDiscussionEndsAt(data.endsAt);
      const remaining = Math.max(
        0,
        Math.floor((data.endsAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);
      setHasSeenRole(false);
    };

    socket.on('game:discussion-started', handleDiscussionStarted);

    socket.on('game:clue-round-started', (data) => {
      const round = data.round ?? 1;
      setGamePhase('clues');
      setClueRound(round);
      clueRoundRef.current = round;
      setClueRoundEndsAt(data.endsAt ?? null);
      setMyClueSubmitted(false);
      setClueInput('');
      setCluesForRound({});
      const remaining = data.endsAt
        ? Math.max(0, Math.floor((data.endsAt - Date.now()) / 1000))
        : data.duration ?? 30;
      setClueTimeLeft(remaining);
    });

    socket.on('game:clue-received', ({ playerId, playerName, clue, round }) => {
      if (round !== clueRoundRef.current) return;
      setCluesForRound((prev) => ({
        ...prev,
        [playerId]: { name: playerName, clue },
      }));
    });

    socket.on('game:clue-round-complete', ({ clues }) => {
      setCluesForRound(clues || {});
    });

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

    socket.on('game:vote-result', (result) => {
      setSelectedVote(null);

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

      if (result.hostId || result.originalHostId) {
        setRoom((prevRoom) => ({
          ...(prevRoom || {}),
          hostId: result.hostId || prevRoom?.hostId,
          originalHostId: result.originalHostId || prevRoom?.originalHostId,
          code,
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
            code,
          }));
        }
      });

      setGameResult(voteResultData);
      setGamePhase('vote-results');
      setVoteResultsCountdown(5);
    });

    socket.on('game:finished', (result) => {
      setSelectedVote(null);
      setTimeLeft(null);

      socket.emit('room:get-info', { code }, (roomResponse) => {
        if (roomResponse && roomResponse.ok && roomResponse.room) {
          setRoom({
            ...roomResponse.room,
            code,
          });
        } else {
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
                code,
              }));
            }
          });
        }
      });

      setGamePhase('results');
      setGameResult(result);
    });

    socket.emit('game:get-state', { code }, (response) => {
      try {
        if (response && response.ok) {
          setMyRole(response.role);

          const prevRoom = roomRef.current;
          if (response.gameState.hostId) {
            if (!prevRoom || prevRoom.hostId !== response.gameState.hostId) {
              setRoom({
                ...(prevRoom || {}),
                hostId: response.gameState.hostId,
                code,
              });
            }
          }

          if (
            response.gameState.players &&
            Array.isArray(response.gameState.players)
          ) {
            setAllPlayers(response.gameState.players);
          }

          if (response.gameState.status === 'finished') {
            setGamePhase('results');
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
          } else if (response.gameState.status === 'clues') {
            const round = response.gameState.clueRound ?? 1;
            setGamePhase('clues');
            setClueRound(round);
            clueRoundRef.current = round;
            setClueRoundEndsAt(response.gameState.clueRoundEndsAt ?? null);
            const raw = response.gameState.cluesByRound?.[round];
            const withNames = {};
            if (raw && typeof raw === 'object') {
              Object.keys(raw).forEach((playerId) => {
                const p = response.gameState.players?.find((x) => x.id === playerId);
                withNames[playerId] = { name: p?.name ?? playerId, clue: raw[playerId] };
              });
            }
            setCluesForRound(withNames);
            setMyClueSubmitted(!!(socket?.id && raw?.[socket.id] !== undefined));
            if (response.gameState.clueRoundEndsAt) {
              const remaining = Math.max(
                0,
                Math.floor((response.gameState.clueRoundEndsAt - Date.now()) / 1000)
              );
              setClueTimeLeft(remaining);
            }
          } else if (response.gameState.status === 'discussion') {
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
          } else if (response.gameState.status === 'voting') {
            setGamePhase('voting');
            if (allPlayersRef.current.length === 0) {
              socket.emit('game:get-state', { code }, () => {});
            }
          } else {
            setGamePhase('revealing');
            setShowCardBack(true);
            setTimeout(() => setShowCardBack(false), 600);
          }
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
        socket.off('game:clue-round-started');
        socket.off('game:clue-received');
        socket.off('game:clue-round-complete');
        socket.off('game:voting-started');
        socket.off('game:vote-result');
        socket.off('game:finished');
        socket.off('game:players-update');
      } catch (error) {
        console.warn('⚠️ Error limpiando listeners:', error);
      }
    };
  }, [socket, isConnected, code]);

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

  useEffect(() => {
    if (gamePhase !== 'voting' || !socket || !isConnected || !code) return;

    if (selectedVote) {
      const checkInterval = setInterval(() => {
        socket.emit('game:get-state', { code }, (response) => {
          if (response && response.ok) {
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
            } else if (
              response.gameState.status === 'discussion' &&
              gamePhaseRef.current === 'voting'
            ) {
              setSelectedVote(null);
              setGamePhase('discussion');
              clearInterval(checkInterval);
            }
          }
        });
      }, 2000);

      const timeout = setTimeout(() => {
        clearInterval(checkInterval);
      }, 30000);

      return () => {
        clearInterval(checkInterval);
        clearTimeout(timeout);
      };
    }
  }, [gamePhase, selectedVote, socket, isConnected, code]);

  useEffect(() => {
    if (gamePhase !== 'clues' || !clueRoundEndsAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((clueRoundEndsAt - Date.now()) / 1000));
      setClueTimeLeft(remaining);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [gamePhase, clueRoundEndsAt]);

  useEffect(() => {
    if (gamePhase !== 'discussion' || !discussionEndsAt) {
      if (gamePhase !== 'discussion') {
        setTimeLeft(null);
      }
      return;
    }

    const initialRemaining = Math.max(
      0,
      Math.floor((discussionEndsAt - Date.now()) / 1000)
    );
    setTimeLeft(initialRemaining);

    let hasTriggeredAutoStart = false;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((discussionEndsAt - Date.now()) / 1000)
      );
      setTimeLeft(remaining);

      if (remaining === 0 && !hasTriggeredAutoStart) {
        hasTriggeredAutoStart = true;
        clearInterval(interval);
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
                socket.emit('game:get-state', { code }, (stateResponse) => {
                  if (stateResponse && stateResponse.ok) {
                    socket.emit(
                      'game:start-voting',
                      { code },
                      (retryResponse) => {
                        if (!retryResponse?.ok) {
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
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [gamePhase, discussionEndsAt, socket, isConnected, code]);

  const handleRevealConfirm = useCallback(() => {
    setHasSeenRole(true);
    socket?.emit('game:reveal-complete', { code }, (response) => {
      if (response && !response.ok) {
        console.error('❌ Error confirmando rol:', response.error);
      }
    });
  }, [socket, code]);

  const handleVote = useCallback(
    (playerId) => {
      if (!playerId || !socket) return;
      socket.emit('game:vote', { code, votedPlayerId: playerId }, (response) => {
        if (response && response.ok) {
          setSelectedVote(playerId);
        } else {
          if (response?.error === 'IMPOSTOR_CANNOT_VOTE') {
            alert(t('game.impostorsCannotVote'));
          } else if (response?.error === 'NOT_VOTING_PHASE') {
            console.error('❌ El juego no está en fase de votación.');
            console.error('   Estado local (frontend):', gamePhaseRef.current);
            console.error(
              '   Estado del servidor (backend):',
              response?.currentStatus
            );
            if (!myRole?.isImpostor) {
              alert(t('errors.votingPhase'));
            }
          } else if (response?.error === 'GAME_FINISHED') {
            socket.emit('game:get-state', { code }, (stateResponse) => {
              if (
                stateResponse &&
                stateResponse.ok &&
                stateResponse.gameState.status === 'finished'
              ) {
              }
            });
          } else {
            console.error('❌ Error votando:', response?.error);
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
    },
    [socket, code, t, myRole?.isImpostor]
  );

  const handleBackToLobby = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleBackToRoom = useCallback(() => {
    navigate(`/room/${code}`);
  }, [navigate, code]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const joinRoom = () => {
      socket.emit('room:get-info', { code }, (infoResponse) => {
        let playerName = t('common.playerDefault');
        let existingPlayer = null;

        if (infoResponse && infoResponse.ok && infoResponse.room) {
          existingPlayer = infoResponse.room.players?.find(
            (p) => p.id === socket?.id
          );
          if (existingPlayer) {
            playerName = existingPlayer.name;
          } else {
            playerName =
              socket.data?.playerName ||
              localStorage.getItem('playerName') ||
              t('common.playerDefault');
          }
        } else {
          playerName =
            socket.data?.playerName ||
            localStorage.getItem('playerName') ||
            t('common.playerDefault');
        }

        const joinData = existingPlayer
          ? { code, name: existingPlayer.name, playerStatsId: getOrCreateStatsId() }
          : { code, name: playerName, playerStatsId: getOrCreateStatsId() };
        socket.emit('room:join', joinData, (response) => {
          if (response && response.ok) {
            setRoom(response.room);
          } else {
            socket.emit('room:get-info', { code }, (ir) => {
              if (ir && ir.ok) {
                setRoom(ir.room);
              }
            });
          }
        });
      });
    };

    joinRoom();

    socket.on('room:updated', (roomData) => {
      setRoom(roomData);
    });

    return () => {
      socket.off('room:updated');
    };
  }, [socket, isConnected, code, t]);

  const myPlayerId = socket?.id;
  const activePlayersForVote = useMemo(() => {
    if (gamePhase !== 'voting') return [];
    let list = [];
    if (allPlayers.length > 0) {
      list = allPlayers.filter((p) => {
        const isEliminated = gameResult?.eliminatedPlayers?.includes(p.id);
        const isMe = p.id === myPlayerId;
        return !isEliminated && !isMe;
      });
    } else if (players.length > 0) {
      list = players
        .map((_, idx) => ({
          id: `player-${idx}`,
          name: `${t('common.playerDefault')} ${idx + 1}`,
        }))
        .filter((p) => {
          const isEliminated = gameResult?.eliminatedPlayers?.includes(p.id);
          const isMe = p.id === myPlayerId;
          return !isEliminated && !isMe;
        });
    }
    return list;
  }, [
    gamePhase,
    allPlayers,
    players,
    gameResult?.eliminatedPlayers,
    myPlayerId,
    t,
  ]);

  let body;
  if (gamePhase === 'revealing') {
    body = (
      <GameRevealingPhase
        t={t}
        navigate={navigate}
        hasSeenRole={hasSeenRole}
        myRole={myRole}
        players={players}
        showCardBack={showCardBack}
        setShowCardBack={setShowCardBack}
        handleBackToLobby={handleBackToLobby}
        handleBackToRoom={handleBackToRoom}
        handleRevealConfirm={handleRevealConfirm}
      />
    );
  } else if (gamePhase === 'clues') {
    body = (
      <GameCluesPhase
        t={t}
        clueRound={clueRound}
        clueTimeLeft={clueTimeLeft}
        clueInput={clueInput}
        setClueInput={setClueInput}
        myClueSubmitted={myClueSubmitted}
        setMyClueSubmitted={setMyClueSubmitted}
        cluesForRound={cluesForRound}
        myRole={myRole}
        socket={socket}
        code={code}
        handleBackToRoom={handleBackToRoom}
        handleBackToLobby={handleBackToLobby}
      />
    );
  } else if (gamePhase === 'discussion') {
    body = (
      <GameDiscussionPhase
        t={t}
        timeLeft={timeLeft}
        socket={socket}
        code={code}
        myRole={myRole}
        gamePhase={gamePhase}
        handleBackToLobby={handleBackToLobby}
        handleBackToRoom={handleBackToRoom}
      />
    );
  } else if (gamePhase === 'voting') {
    body = (
      <GameVotingPhase
        t={t}
        myRole={myRole}
        socket={socket}
        selectedVote={selectedVote}
        handleVote={handleVote}
        gamePhase={gamePhase}
        activePlayersForVote={activePlayersForVote}
        handleBackToLobby={handleBackToLobby}
        handleBackToRoom={handleBackToRoom}
      />
    );
  } else if (gamePhase === 'vote-results' && gameResult) {
    body = (
      <Suspense fallback={<PhaseFallback message={t('common.loading')} />}>
        <GameVoteResultsPhase
          t={t}
          gameResult={gameResult}
          room={room}
          socket={socket}
          code={code}
          setVoteResultsCountdown={setVoteResultsCountdown}
          handleBackToLobby={handleBackToLobby}
          handleBackToRoom={handleBackToRoom}
        />
      </Suspense>
    );
  } else if (gamePhase === 'results' && gameResult) {
    body = (
      <Suspense fallback={<PhaseFallback message={t('common.loading')} />}>
        <GameFinalResultsPhase
          t={t}
          gameResult={gameResult}
          myRole={myRole}
          room={room}
          socket={socket}
          code={code}
          setVoteResultsCountdown={setVoteResultsCountdown}
          handleBackToLobby={handleBackToLobby}
          handleBackToRoom={handleBackToRoom}
        />
      </Suspense>
    );
  } else {
    body = (
      <GameWaitingPhase
        t={t}
        code={code}
        gamePhase={gamePhase}
        myRole={myRole}
        isConnected={isConnected}
        navigate={navigate}
        handleBackToLobby={handleBackToLobby}
      />
    );
  }

  return body;
}

export default Game;
