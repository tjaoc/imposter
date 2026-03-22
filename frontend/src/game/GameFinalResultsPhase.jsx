import { memo, useCallback } from 'react';
import { m } from 'framer-motion';
import PageNav from '../components/PageNav';
import { capitalizeWord } from '../utils/formatWord';
import { getOrCreateStatsId } from '../utils/statsId';
import { useMotionReduce, tx } from './motionReduce';

function GameFinalResultsPhase ({
  t,
  gameResult,
  myRole,
  room,
  socket,
  code,
  setVoteResultsCountdown,
  handleBackToLobby,
  handleBackToRoom,
}) {
  const reduce = useMotionReduce();
  const didIWin = myRole?.isImpostor
    ? gameResult.winner === 'impostors'
    : gameResult.winner === 'civilians';

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
            <m.div
              initial={reduce ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={tx(reduce, { delay: 0.2, type: 'spring', stiffness: 200 })}
              className="text-9xl mb-6"
            >
              {didIWin ? '🎉' : '😢'}
            </m.div>

            <m.h1
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={tx(reduce, { delay: 0.3 })}
              className={`text-5xl font-bold mb-6 ${
                gameResult.winner === 'impostors'
                  ? 'text-red-400'
                  : 'text-emerald-400'
              }`}
            >
              {gameResult.winner === 'impostors'
                ? `🕵️ ${t('game.impostorsWin')}`
                : `🎯 ${t('game.civiliansWin')}`}
            </m.h1>

            <m.div
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={tx(reduce, { delay: 0.4 })}
              className="text-2xl text-space-cyan mb-8 p-4 bg-space-blue/30 rounded-xl"
            >
              {t('game.secretWordWas')}{' '}
              <span className="text-glow font-bold text-3xl text-emerald-400">
                {capitalizeWord(gameResult.secretWord)}
              </span>
            </m.div>

            {gameResult.eliminated && (
              <m.div
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={tx(reduce, { delay: 0.5 })}
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
              </m.div>
            )}

            {gameResult.votesWithNames &&
              Object.keys(gameResult.votesWithNames).length > 0 && (
                <m.div
                  initial={reduce ? false : { y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={tx(reduce, { delay: 0.55 })}
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
                        <m.div
                          key={player.id || index}
                          initial={reduce ? false : { x: -50, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={tx(reduce, { delay: reduce ? 0 : 0.6 + index * 0.05 })}
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
                        </m.div>
                      );
                    })}
                  </div>
                </m.div>
              )}

            <m.div
              initial={reduce ? false : { y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={tx(reduce, { delay: 0.6 })}
              className="flex flex-col gap-3 mt-6"
            >
              {isOriginalHost && (
                <m.button
                  initial={reduce ? false : { y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={tx(reduce, { delay: 0.7 })}
                  whileHover={reduce ? undefined : { scale: 1.02 }}
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={onNewGame}
                  className="w-full min-h-[48px] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white text-lg shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all"
                >
                  🎮 {t('game.newGame')}
                </m.button>
              )}

              <m.button
                initial={reduce ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={tx(reduce, { delay: 0.8 })}
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

export default memo(GameFinalResultsPhase);
