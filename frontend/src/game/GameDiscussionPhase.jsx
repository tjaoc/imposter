import { memo, useCallback } from 'react';
import { m } from 'framer-motion';
import PageNav from '../components/PageNav';
import { capitalizeWord } from '../utils/formatWord';
import { useMotionReduce, tx } from './motionReduce';

function GameDiscussionPhase ({
  t,
  timeLeft,
  socket,
  code,
  myRole,
  gamePhase,
  handleBackToLobby,
  handleBackToRoom,
}) {
  const reduce = useMotionReduce();
  const minutes = Math.floor((timeLeft ?? 0) / 60);
  const seconds = (timeLeft ?? 0) % 60;
  const handleStartVoting = useCallback(() => {
    if (!code) {
      console.error('❌ No hay código de sala disponible');
      alert(`${t('common.error')}: ${t('errors.noRoomCode')}`);
      return;
    }
    if (gamePhase !== 'discussion') {
      console.warn('⚠️ No estás en fase de discusión. Estado actual:', gamePhase);
      alert(t('errors.cannotStartVotingNow', { phase: gamePhase }));
      return;
    }
    socket.emit('game:start-voting', { code }, (response) => {
      if (response && response.ok) {
        return;
      }
      if (response?.error === 'NOT_HOST') {
        alert(t('game.onlyHostStartsVoting'));
      } else if (response?.error === 'NOT_DISCUSSION_PHASE') {
        console.error('❌ El juego no está en fase de discusión. Estado actual:', response?.currentStatus);
        console.error('   Estado local - gamePhase:', gamePhase);
        alert(
          `${t('common.error')}: ${t('errors.notDiscussionPhase', {
            status: response?.currentStatus || 'desconocido',
          })}`
        );
      } else if (response?.error === 'GAME_NOT_FOUND') {
        console.error('❌ Juego no encontrado al intentar iniciar votación manualmente');
        alert(`${t('common.error')}: ${t('errors.gameNotFound')}`);
      } else {
        console.error('❌ Error iniciando votación:', response?.error);
        alert(`${t('common.error')}: ${response?.error || t('errors.unknown')}`);
      }
    });
  }, [code, gamePhase, socket, t]);

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
            💬 {t('game.discussion')}
          </h1>
          <m.div
            animate={reduce || timeLeft === 0 ? undefined : { scale: [1, 1.05, 1] }}
            transition={{
              duration: 1,
              repeat: reduce || timeLeft === 0 ? 0 : Infinity,
            }}
            className="text-7xl font-bold text-space-cyan mb-4"
          >
            {String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}
          </m.div>
          <p className="text-gray-400 mt-4 text-lg">
            {t('game.discussAndDiscover')}
          </p>
        </m.div>

        <m.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, undefined)}
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
              {myRole?.isImpostor ? t('game.impostorGoal') : t('game.civilHint')}
            </p>
          </div>
        </m.div>

        {!myRole?.isImpostor && (
          <m.button
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tx(reduce, undefined)}
            whileHover={reduce ? undefined : { scale: 1.05 }}
            whileTap={reduce ? undefined : { scale: 0.95 }}
            onClick={handleStartVoting}
            className={`w-full min-h-[48px] py-4 rounded-xl font-semibold text-white shadow-lg transition-all mb-4 ${
              timeLeft === 0
                ? 'bg-gradient-to-r from-red-600 to-orange-600 shadow-red-500/50 hover:shadow-red-500/70 animate-pulse'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-purple-500/50 hover:shadow-purple-500/70'
            }`}
          >
            {timeLeft === 0
              ? `⏰ ${t('game.timeUpStartVoting')}`
              : `🗳️ ${t('game.startVoting')}`}
          </m.button>
        )}

        {myRole?.isImpostor && timeLeft === 0 && (
          <m.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4 p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/50"
          >
            <p className="text-yellow-400 font-semibold">
              ⏰ {t('game.timeUpWaiting')}
            </p>
          </m.div>
        )}

        <m.button
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, { delay: 0.2 })}
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          onClick={handleBackToLobby}
          className="w-full min-h-[48px] py-3 rounded-xl font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 hover:border-gray-600 transition-all"
        >
          🏠 {t('game.backToHome')}
        </m.button>
      </div>
    </div>
  );
}

export default memo(GameDiscussionPhase);
