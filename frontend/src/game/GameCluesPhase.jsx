import { memo, useCallback } from 'react';
import { m } from 'framer-motion';
import PageNav from '../components/PageNav';
import { useMotionReduce, tx } from './motionReduce';

function GameCluesPhase ({
  t,
  clueRound,
  clueTimeLeft,
  clueInput,
  setClueInput,
  myClueSubmitted,
  setMyClueSubmitted,
  cluesForRound,
  myRole,
  socket,
  code,
  handleBackToRoom,
  handleBackToLobby,
}) {
  const reduce = useMotionReduce();
  const clueMinutes = Math.floor((clueTimeLeft ?? 0) / 60);
  const clueSeconds = (clueTimeLeft ?? 0) % 60;

  const handleSubmitClue = useCallback(() => {
    const text = clueInput.trim();
    if (!text || !socket || !code) return;
    socket.emit('game:submit-clue', { code, clue: text }, (response) => {
      if (response?.ok) {
        setMyClueSubmitted(true);
        setClueInput('');
      }
    });
  }, [clueInput, socket, code, setClueInput, setMyClueSubmitted]);

  return (
    <div className="min-h-full p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black overflow-x-hidden">
      <PageNav showBack onBack={handleBackToRoom} onExit={handleBackToLobby} />
      <div className="max-w-2xl mx-auto w-full min-w-0">
        <m.div
          initial={reduce ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, undefined)}
          className="text-center mb-6"
        >
          <h1 className="text-4xl font-bold text-glow mb-2">
            ✍️ {t('game.cluesPhase')}
          </h1>
          <p className="text-gray-400">
            {t('game.clueRoundOf', { current: clueRound, total: 3 })}
          </p>
          <m.div
            animate={
              reduce || clueTimeLeft === 0 ? undefined : { scale: [1, 1.02, 1] }
            }
            transition={
              reduce || clueTimeLeft === 0
                ? undefined
                : { duration: 1, repeat: Infinity }
            }
            className="text-5xl font-bold text-space-cyan mt-4"
          >
            {String(clueMinutes).padStart(2, '0')}:{String(clueSeconds).padStart(2, '0')}
          </m.div>
        </m.div>

        {!myClueSubmitted ? (
          <m.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={tx(reduce, undefined)}
            className="glass-effect rounded-2xl p-4 sm:p-6 mb-6 w-full min-w-0"
          >
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {myRole?.isImpostor ? t('game.clueImpostorHint') : t('game.clueYourHint')}
            </label>
            <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0">
              <input
                type="text"
                value={clueInput}
                onChange={(e) => setClueInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmitClue()}
                placeholder={t('game.cluePlaceholder')}
                className="flex-1 min-w-0 w-full min-h-[48px] px-4 rounded-xl bg-slate-800/80 border border-slate-600 text-white placeholder-gray-500 focus:border-space-cyan focus:ring-1 focus:ring-space-cyan"
                maxLength={200}
              />
              <button
                type="button"
                onClick={handleSubmitClue}
                disabled={!clueInput.trim()}
                className="shrink-0 min-h-[48px] px-6 rounded-xl font-semibold bg-space-cyan text-black hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition sm:self-center"
              >
                {t('common.next')}
              </button>
            </div>
          </m.div>
        ) : (
          <m.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-effect rounded-2xl p-4 mb-6 text-center text-emerald-400"
          >
            ✓ {t('game.clueSubmitted')}
          </m.div>
        )}

        <m.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={tx(reduce, undefined)}
          className="glass-effect rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">{t('game.cluesSoFar')}</h2>
          {Object.keys(cluesForRound).length === 0 ? (
            <p className="text-gray-500 text-sm">{t('game.noCluesYet')}</p>
          ) : (
            <ul className="space-y-3">
              {Object.entries(cluesForRound).map(([playerId, { name, clue }]) => (
                <li
                  key={playerId}
                  className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 p-3 rounded-xl bg-slate-800/50"
                >
                  <span className="font-medium text-space-cyan shrink-0">{name}:</span>
                  <span className="text-gray-200 break-words">{clue || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </m.div>
      </div>
    </div>
  );
}

export default memo(GameCluesPhase);
