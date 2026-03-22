import { memo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import PageNav from '../components/PageNav';
import { useMotionReduce, tx } from './motionReduce';

function GameVotingPhase ({
  t,
  myRole,
  socket,
  selectedVote,
  handleVote,
  gamePhase,
  activePlayersForVote,
  handleBackToLobby,
  handleBackToRoom,
}) {
  const reduce = useMotionReduce();
  const myPlayerId = socket?.id;

  return (
    <div className="min-h-full p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
      <PageNav showBack onBack={handleBackToRoom} onExit={handleBackToLobby} />
      <div className="max-w-2xl mx-auto">
        <m.div
          initial={reduce ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, undefined)}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-glow mb-4">
            🗳️ {t('game.voting')}
          </h1>
          <p className="text-gray-400 text-lg">
            {myRole?.isImpostor ? t('game.impostorFakeVote') : t('game.whoIsImpostor')}
          </p>
          {myRole?.isImpostor && (
            <p className="text-red-400 text-sm mt-2">
              ⚠️ {t('game.impostorVoteNoCount')}
            </p>
          )}
        </m.div>

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
                  const isMe = player.id === myPlayerId || player.id === socket?.id;
                  return !isMe;
                })
                .map((player, index) => {
                  const playerId = player.id || `player-${index}`;
                  const playerName =
                    player.name || `${t('common.playerDefault')} ${index + 1}`;
                  const isSelected = selectedVote === playerId;

                  return (
                    <m.button
                      key={playerId}
                      initial={reduce ? false : { x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={reduce ? undefined : { x: 50, opacity: 0 }}
                      transition={tx(reduce, { delay: reduce ? 0 : index * 0.1 })}
                      onClick={() => handleVote(playerId)}
                      disabled={selectedVote !== null}
                      whileHover={reduce || selectedVote ? undefined : { scale: 1.02, x: 5 }}
                      whileTap={reduce || selectedVote ? undefined : { scale: 0.98 }}
                      className={`w-full min-h-[48px] p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
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
                        <m.div
                          initial={reduce ? false : { scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-2xl"
                        >
                          ✓
                        </m.div>
                      )}
                    </m.button>
                  );
                })}
            </AnimatePresence>
          )}
        </div>

        {selectedVote && gamePhase === 'voting' && (
          <m.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-6 p-4 bg-emerald-500/20 rounded-xl border border-emerald-400/50"
          >
            <p className="text-emerald-300 font-semibold">
              ✓ {t('game.voteSent')}
            </p>
          </m.div>
        )}

        {import.meta.env.DEV && (
          <div className="mt-4 text-sm text-gray-500 text-center">
            Debug: gamePhase={gamePhase}, selectedVote=
            {selectedVote ? 'set' : 'null'}
          </div>
        )}

        <m.button
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, { delay: 0.2 })}
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          onClick={handleBackToLobby}
          className="w-full mt-6 min-h-[48px] py-3 rounded-xl font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all"
        >
          🏠 {t('game.backToHome')}
        </m.button>
      </div>
    </div>
  );
}

export default memo(GameVotingPhase);
