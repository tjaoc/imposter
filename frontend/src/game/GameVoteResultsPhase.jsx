import { memo, useCallback } from 'react';
import { m } from 'framer-motion';
import PageNav from '../components/PageNav';
import { getOrCreateStatsId } from '../utils/statsId';
import { useMotionReduce, tx } from './motionReduce';

function GameVoteResultsPhase ({
  t,
  gameResult,
  room,
  socket,
  code,
  setVoteResultsCountdown,
  handleBackToLobby,
  handleBackToRoom,
}) {
  const reduce = useMotionReduce();

  const onNewGame = useCallback(() => {
    setVoteResultsCountdown(null);
    if (!code || !socket) {
      console.error('❌ No hay código de sala o socket disponible');
      alert(t('errors.roomError'));
      return;
    }
    socket.emit(
      'room:join',
      {
        code,
        name:
          room?.players?.find((p) => p.id === socket.id)?.name ||
          t('common.playerDefault'),
        playerStatsId: getOrCreateStatsId(),
      },
      (joinResponse) => {
        if (!joinResponse?.ok) {
          alert(
            `${t('common.error')}: ${joinResponse?.error || t('errors.newGameError')}`
          );
          return;
        }
        const timeout = setTimeout(() => {
          alert(`${t('common.error')}: ${t('errors.newGameError')}`);
        }, 15000);
        socket.emit('game:new-game', { code }, (response) => {
          clearTimeout(timeout);
          if (response?.ok) return;
          console.error('❌ Error iniciando nueva partida:', response?.error);
          alert(
            `${t('common.error')}: ${response?.error || t('errors.newGameError')}`
          );
        });
      }
    );
  }, [code, room?.players, setVoteResultsCountdown, socket, t]);

  const isOriginalHost = room?.originalHostId === socket?.id;

  return (
    <div className="min-h-full flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
      <PageNav showBack onBack={handleBackToRoom} onExit={handleBackToLobby} />
      <div className="flex-1 flex items-center justify-center">
        <m.div
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={tx(reduce, { type: 'spring', stiffness: 100 })}
          className="max-w-2xl w-full"
        >
          <div className="glass-effect rounded-3xl p-8 text-center">
            <m.h1
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={tx(reduce, { delay: 0.2 })}
              className="text-4xl font-bold mb-6 text-space-cyan"
            >
              🗳️ {t('game.voteResults')}
            </m.h1>

            {gameResult.impostorDiscovered && gameResult.eliminated && (
              <m.div
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={tx(reduce, { delay: 0.3 })}
                className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50"
              >
                <p className="font-semibold text-lg text-emerald-300">
                  🎯 {t('game.impostorDiscovered')}:{' '}
                  {gameResult.eliminated.name}
                </p>
              </m.div>
            )}

            {gameResult.votesWithNames &&
              Object.keys(gameResult.votesWithNames).length > 0 && (
                <m.div
                  initial={reduce ? false : { y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={tx(reduce, { delay: 0.4 })}
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
                        <m.div
                          key={player.id || index}
                          initial={reduce ? false : { x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={tx(reduce, { delay: reduce ? 0 : 0.5 + index * 0.05 })}
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
                        </m.div>
                      );
                    })}
                  </div>
                </m.div>
              )}

            {gameResult.impostor && (
              <m.div
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={tx(reduce, { delay: 0.6 })}
                className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl"
              >
                <p className="text-red-300 font-semibold text-lg">
                  🕵️ {t('game.impostorWas')}{' '}
                  <span className="text-red-400">
                    {gameResult.impostor.name}
                  </span>
                </p>
              </m.div>
            )}

            <m.div
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={tx(reduce, { delay: 0.7 })}
              className="flex flex-col gap-3 mt-6"
            >
              {isOriginalHost && (
                <m.button
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={onNewGame}
                  className="w-full min-h-[48px] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white text-lg shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all"
                >
                  🎮 {t('game.newGame')}
                </m.button>
              )}

              <m.button
                whileHover={reduce ? undefined : { scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                onClick={handleBackToLobby}
                className="w-full min-h-[48px] py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-bold text-white text-lg shadow-lg shadow-purple-500/50 hover:shadow-purple-500/70 transition-all"
              >
                🏠 {t('game.backToHome')}
              </m.button>
            </m.div>
          </div>
        </m.div>
      </div>
    </div>
  );
}

export default memo(GameVoteResultsPhase);
