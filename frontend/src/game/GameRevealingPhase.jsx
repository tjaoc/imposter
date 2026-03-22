import { memo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import PageNav from '../components/PageNav';
import { capitalizeWord } from '../utils/formatWord';
import { useMotionReduce, tx } from './motionReduce';

function GameRevealingPhase ({
  t,
  navigate,
  hasSeenRole,
  myRole,
  players,
  showCardBack,
  setShowCardBack,
  handleBackToLobby,
  handleBackToRoom,
  handleRevealConfirm,
}) {
  const reduce = useMotionReduce();

  if (hasSeenRole) {
    return (
      <div className="min-h-full flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
        <PageNav showBack onBack={() => navigate(-1)} onExit={handleBackToLobby} />
        <div className="flex-1 flex items-center justify-center">
          <m.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={tx(reduce, undefined)}
            className="text-center"
          >
            <m.div
              animate={reduce ? undefined : { rotate: [0, 10, -10, 0] }}
              transition={reduce ? undefined : { duration: 2, repeat: Infinity }}
              className="text-6xl mb-6"
            >
              ⏳
            </m.div>
            <h2 className="text-2xl font-bold text-space-cyan mb-4">
              {t('game.waitingOthers')}
            </h2>
            <p className="text-gray-400 mb-4">{t('game.everyoneConfirm')}</p>
            <div className="text-sm text-gray-500 mt-4 p-3 bg-space-blue/30 rounded-lg inline-block">
              {t('game.yourRole')}:{' '}
              {myRole?.isImpostor
                ? '🕵️ IMPOSTOR'
                : `🎯 ${capitalizeWord(myRole?.word)}`}
            </div>
          </m.div>
        </div>
      </div>
    );
  }

  const isImpostor = myRole?.isImpostor;
  const displayWord = myRole?.word || '';

  return (
    <div className="min-h-full flex flex-col p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
      <PageNav showBack onBack={handleBackToRoom} onExit={handleBackToLobby} />
      <div className="flex-1 flex flex-col items-center justify-center">
        <m.div
          initial={reduce ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, undefined)}
          className="mb-6 text-center"
        >
          <h1 className="text-3xl font-extrabold tracking-wide text-red-400 drop-shadow-lg mb-2">
            {isImpostor
              ? t('game.youAreImpostor').toUpperCase()
              : t('game.yourWord').toUpperCase()}
          </h1>
          <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">
            {t('game.revealSubtitle')}
          </p>
        </m.div>

        <div
          className="relative w-72 h-96 mb-8"
          style={{ perspective: reduce ? undefined : '1200px' }}
        >
          <AnimatePresence mode="wait">
            {showCardBack ? (
              <m.div
                key="card-back"
                initial={reduce ? false : { rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotateY: -180, opacity: 0 }}
                transition={tx(reduce, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 border-2 border-purple-500/50 shadow-[0_0_40px_rgba(139,92,246,0.5)] flex items-center justify-center cursor-pointer"
                onClick={() => setShowCardBack(false)}
                style={{ transformStyle: reduce ? undefined : 'preserve-3d' }}
              >
                <div
                  className="text-center"
                  style={{ transform: reduce ? undefined : 'translateZ(20px)' }}
                >
                  <m.div
                    animate={reduce ? undefined : { scale: [1, 1.1, 1] }}
                    transition={reduce ? undefined : { duration: 2, repeat: Infinity }}
                    className="text-6xl mb-4"
                  >
                    👁️‍🗨️
                  </m.div>
                  <p className="text-slate-200 text-sm font-medium">
                    {t('game.touchToReveal')}
                  </p>
                </div>
              </m.div>
            ) : (
              <m.div
                key="card-front"
                initial={reduce ? false : { rotateY: 180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={reduce ? undefined : { rotateY: 180, opacity: 0 }}
                transition={tx(reduce, { duration: 0.7, ease: [0.22, 1, 0.36, 1] })}
                className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-black border-2 border-slate-700 shadow-[0_0_40px_rgba(15,23,42,0.8)] flex flex-col items-center justify-center px-6"
                style={{
                  transformStyle: reduce ? undefined : 'preserve-3d',
                  backfaceVisibility: reduce ? undefined : 'hidden',
                }}
              >
                <m.div
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={tx(reduce, { delay: reduce ? 0 : 1, type: 'spring', stiffness: 200 })}
                  className="text-7xl mb-4"
                >
                  {isImpostor ? '🕵️' : '🎯'}
                </m.div>
                {isImpostor ? (
                  <>
                    <p className="text-red-400 font-semibold text-xl mb-2">
                      {t('game.youAreImpostor')}
                    </p>
                    {displayWord && (
                      <p className="text-sm text-emerald-300 mb-4 px-4 py-2 bg-emerald-900/30 rounded-lg">
                        {t('game.hintCategory')} ({t('game.category')}):{' '}
                        <span className="font-bold text-emerald-200">
                          {capitalizeWord(displayWord)}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-slate-400 text-center px-4">
                      {t('game.impostorHint')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-400 mb-2">
                      {t('game.yourSecretWord')}:
                    </p>
                    <m.p
                      initial={reduce ? false : { scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={tx(reduce, { delay: reduce ? 0 : 1.2 })}
                      className="text-4xl font-extrabold text-emerald-400 drop-shadow-lg mb-4 text-center"
                      style={{ textShadow: '0 0 20px rgba(16, 185, 129, 0.5)' }}
                    >
                      {capitalizeWord(displayWord)}
                    </m.p>
                    <p className="text-sm text-slate-400 text-center px-4">
                      {t('game.describeWithoutSaying', {
                        count: players.length > 5 ? '1-2' : '1',
                      })}
                    </p>
                  </>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <m.button
          initial={reduce ? false : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={tx(reduce, { delay: reduce ? 0 : 1.5 })}
          whileHover={reduce ? undefined : { scale: 1.05 }}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          onClick={handleRevealConfirm}
          className="w-full max-w-xs min-h-[48px] py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-black tracking-wide shadow-lg shadow-emerald-500/40 transition"
        >
          {t('game.iSawMyRole')}
        </m.button>
      </div>
    </div>
  );
}

export default memo(GameRevealingPhase);
