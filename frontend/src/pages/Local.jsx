import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { assignRoles } from '../utils/localGameLogic';
import LanguageSelector from '../components/LanguageSelector';
import PackSelector from '../components/PackSelector';
import PageNav from '../components/PageNav';
import { API_BASE } from '../config/env';
import { capitalizeWord } from '../utils/formatWord';

function Local() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const appliedKeepPlayersRef = useRef(false);
  const [step, setStep] = useState('players'); // players | pack | reveal | game
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [packs, setPacks] = useState([]);
  const [loadingPacks, setLoadingPacks] = useState(false);
  const [packsError, setPacksError] = useState(false);
  const [selectedPackIds, setSelectedPackIds] = useState([]);
  const [settings, setSettings] = useState({
    impostorCount: 1,
    discussionSeconds: 240,
    hintForImpostors: true,
  });
  const [gameState, setGameState] = useState(null);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [roleRevealed, setRoleRevealed] = useState(false);
  const [showCardBack, setShowCardBack] = useState(true);

  // Nueva partida con los mismos jugadores: venir desde resultados con state.keepPlayers
  useEffect(() => {
    const keep = location.state?.keepPlayers;
    if (!keep || !Array.isArray(keep) || keep.length < 3) {
      appliedKeepPlayersRef.current = false;
      return;
    }
    if (appliedKeepPlayersRef.current) return;
    appliedKeepPlayersRef.current = true;
    setPlayers(keep.map((p) => ({ id: p.id, name: p.name })));
    setStep('pack');
  }, [location.state]);

  const loadPacks = useCallback(() => {
    setPacksError(false);
    setLoadingPacks(true);
    fetch(`${API_BASE}/api/packs?locale=${locale}`)
      .then((res) => {
        if (!res.ok && res.status === 502) {
          setPacksError(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.ok) setPacks(data.packs);
        else if (data === null) setPacks([]);
        setLoadingPacks(false);
      })
      .catch(() => {
        setPacksError(true);
        setPacks([]);
        setLoadingPacks(false);
      });
  }, [locale]);

  useEffect(() => {
    if (step === 'pack') loadPacks();
  }, [step, loadPacks]);

  const addPlayer = () => {
    const name = playerName.trim();
    if (
      !name ||
      players.some((p) => p.name.toLowerCase() === name.toLowerCase())
    )
      return;
    setPlayers([
      ...players,
      { id: crypto.randomUUID?.() ?? `p-${Date.now()}`, name },
    ]);
    setPlayerName('');
  };

  const removePlayer = (id) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const startGameWithPack = () => {
    const useRandom =
      selectedPackIds.length === 1 && selectedPackIds[0] === 'random';
    if ((!useRandom && selectedPackIds.length === 0) || players.length < 3)
      return;
    const pool = useRandom
      ? packs.filter((p) => p.slug !== 'personalizado')
      : selectedPackIds;
    if (pool.length === 0) return;
    const packIdToFetch = useRandom
      ? pool[Math.floor(Math.random() * pool.length)]._id
      : pool[Math.floor(Math.random() * pool.length)];
    fetch(`${API_BASE}/api/packs/${packIdToFetch}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok || !data.pack?.words?.length) return;
        const pack = data.pack;
        const secretWord =
          pack.words[Math.floor(Math.random() * pack.words.length)];
        const hintWord = settings.hintForImpostors ? pack.name || null : null;
        const playersWithRoles = assignRoles(
          players.map((p) => ({ id: p.id, name: p.name })),
          secretWord,
          settings.impostorCount,
          hintWord
        );
        setGameState({
          players: playersWithRoles,
          secretWord,
          impostorHint: hintWord,
          discussionSeconds: settings.discussionSeconds,
          eliminatedPlayers: [],
          votes: {},
        });
        setCurrentRevealIndex(0);
        setRoleRevealed(false);
        setStep('reveal');
      });
  };

  const handleCloseRole = () => {
    setRoleRevealed(false);
    setShowCardBack(true);
    if (currentRevealIndex >= gameState.players.length - 1) {
      navigate('/local/game', { state: { gameState } });
    } else {
      setCurrentRevealIndex((i) => i + 1);
    }
  };

  const currentPlayer = gameState?.players?.[currentRevealIndex];

  const handleBackLocal = () => {
    if (step === 'players') navigate('/');
    else if (step === 'pack') setStep('players');
    else if (step === 'reveal') setStep('pack');
  };

  if (step === 'players') {
    return (
      <div className="min-h-full p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="flex items-center justify-between mb-2">
          <PageNav
            showBack
            onBack={handleBackLocal}
            onExit={() => navigate('/')}
          />
          <LanguageSelector />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md md:max-w-lg lg:max-w-xl mx-auto"
        >
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow mb-2">
              {t('local.addPlayers')}
            </h1>
            <p className="text-space-cyan/80 text-sm sm:text-base">
              {t('local.addPlayersDesc')}
            </p>
          </div>
          <div className="card mb-4">
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                placeholder={t('local.playerNamePlaceholder')}
                className="flex-1 px-4 py-3.5 sm:py-3 bg-space-blue border border-space-cyan/30 rounded-xl focus:outline-none focus:border-space-cyan text-white placeholder-gray-400 text-base min-h-[48px]"
                maxLength={20}
              />
              <button
                type="button"
                onClick={addPlayer}
                disabled={!playerName.trim()}
                className="min-h-[48px] px-5 py-3.5 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-semibold text-white disabled:opacity-50 active:scale-[0.98]"
              >
                {t('local.addPlayer')}
              </button>
            </div>
            <ul className="space-y-2">
              <AnimatePresence>
                {players.map((p) => (
                  <motion.li
                    key={p.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    className="flex items-center justify-between p-3 sm:p-4 min-h-[48px] bg-space-blue rounded-xl"
                  >
                    <span className="text-white truncate pr-2">{p.name}</span>
                    <button
                      type="button"
                      onClick={() => removePlayer(p.id)}
                      className="min-h-[48px] min-w-[48px] flex items-center justify-center text-red-400 hover:text-red-300 text-sm flex-shrink-0 active:opacity-80"
                    >
                      {t('common.close')}
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setStep('pack')}
            disabled={players.length < 3}
            className="w-full min-h-[52px] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {players.length < 3 ? t('local.minPlayers') : t('local.selectPack')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'pack') {
    return (
      <div className="min-h-full p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="flex items-center justify-between mb-2">
          <PageNav
            showBack
            onBack={handleBackLocal}
            onExit={() => navigate('/')}
          />
          <LanguageSelector />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto"
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-glow mb-2">
              {t('local.selectPack')}
            </h1>
          </div>
          {loadingPacks && packs.length === 0 ? (
            <p className="text-center text-space-cyan">{t('common.loading')}</p>
          ) : packsError ? (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-center space-y-3 mb-4">
              <p className="text-amber-200 text-sm">
                {t('common.serverUnavailable')}
              </p>
              <button
                type="button"
                onClick={() => loadPacks()}
                className="px-4 py-2 rounded-lg bg-space-cyan text-space-navy font-medium hover:bg-space-cyan/90"
              >
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <>
              {/* Impostores */}
              <div className="card mb-4">
                <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">🕵️</span>
                    <span className="text-white font-semibold whitespace-nowrap">
                      {t('room.impostors')}
                    </span>
                    <span className="text-sm text-gray-400 hidden sm:inline truncate">
                      {t('room.impostorsDesc')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          impostorCount: Math.max(1, prev.impostorCount - 1),
                        }))
                      }
                      disabled={settings.impostorCount <= 1}
                      className="min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center active:scale-95"
                    >
                      −
                    </button>
                    <span className="text-xl sm:text-2xl font-bold text-white w-8 text-center tabular-nums">
                      {settings.impostorCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          impostorCount: Math.min(
                            players.length - 1,
                            prev.impostorCount + 1
                          ),
                        }))
                      }
                      disabled={
                        settings.impostorCount >=
                        Math.max(1, players.length - 1)
                      }
                      className="min-w-[32px] min-h-[32px] w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              {/* Pista para Impostores (igual que Room) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="card-tight mb-4"
              >
                <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">🔍</span>
                    <span className="text-white font-semibold whitespace-nowrap">
                      {t('room.hintForImpostors')}
                    </span>
                    <span className="text-sm text-gray-400 hidden sm:inline truncate">
                      {t('room.hintForImpostorsDesc')}
                    </span>
                  </div>
                  <div className="flex items-center flex-shrink-0 min-h-[44px] pl-2">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.hintForImpostors}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSettings((prev) => ({
                          ...prev,
                          hintForImpostors: !prev.hintForImpostors,
                        }));
                      }}
                      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-space-cyan focus:ring-offset-2 focus:ring-offset-space-dark touch-manipulation select-none ${
                        settings.hintForImpostors
                          ? 'bg-emerald-500'
                          : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          settings.hintForImpostors
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
              {/* Duración */}
              <div className="card mb-4">
                <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0">⏱️</span>
                    <span className="text-white font-semibold whitespace-nowrap">{t('room.duration')}</span>
                  </div>
                  <select
                    value={settings.discussionSeconds}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        discussionSeconds: Number(e.target.value),
                      }))
                    }
                    className="min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-semibold bg-space-blue border border-space-cyan/40 text-white focus:outline-none focus:ring-2 focus:ring-space-cyan focus:border-space-cyan"
                  >
                    {Array.from({ length: 20 }, (_, i) => (i + 1) * 60).map(
                      (seconds) => (
                        <option key={seconds} value={seconds}>
                          {seconds / 60} min
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
              <div className="card mb-4">
                <PackSelector
                  onSelectPacks={setSelectedPackIds}
                  selectedPackIds={selectedPackIds}
                  allowRandom
                />
              </div>
            </>
          )}
          <button
            type="button"
            onClick={startGameWithPack}
            disabled={
              ((selectedPackIds.length !== 1 ||
                selectedPackIds[0] !== 'random') &&
                selectedPackIds.length === 0) ||
              loadingPacks
            }
            className={`w-full min-h-[52px] py-4 rounded-xl font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
              ((selectedPackIds.length === 1 &&
                selectedPackIds[0] === 'random') ||
                selectedPackIds.length > 0) &&
              !loadingPacks
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white'
                : 'bg-gray-600 text-gray-400'
            }`}
          >
            {t('local.startGame')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'reveal' && currentPlayer) {
    const isImpostor = currentPlayer.role === 'impostor';
    const displayWord = currentPlayer.word || '';

    return (
      <div className="min-h-full flex flex-col p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <PageNav
          showBack
          onBack={handleBackLocal}
          onExit={() => navigate('/')}
          className="mb-2 flex-shrink-0"
        />
        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {!roleRevealed ? (
              <motion.div
                key="security"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center w-full max-w-md"
              >
                <p className="text-space-cyan/60 text-sm uppercase tracking-widest mb-4">
                  {t('local.securityScreen')}
                </p>
                <h2 className="text-2xl font-bold text-white mb-8">
                  {t('local.passPhoneTo')}{' '}
                  <span className="text-glow">{currentPlayer.name}</span>
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                  {t('local.hideRoleDesc')}
                </p>
                <motion.button
                  type="button"
                  onClick={() => {
                    setRoleRevealed(true);
                    setShowCardBack(true);
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full max-w-xs py-4 rounded-full bg-gradient-to-r from-space-purple to-space-pink font-semibold text-white"
                >
                  {t('local.seeMyRole')}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="role"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full flex flex-col items-center"
              >
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
                  <p className="text-sm text-slate-400 uppercase tracking-[0.2em]">
                    {t('game.revealSubtitle')}
                  </p>
                </motion.div>

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
                          transition={{
                            delay: 1,
                            type: 'spring',
                            stiffness: 200,
                          }}
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
                            <motion.p
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 1.2 }}
                              className="text-4xl font-extrabold text-emerald-400 drop-shadow-lg mb-4 text-center"
                              style={{
                                textShadow: '0 0 20px rgba(16, 185, 129, 0.5)',
                              }}
                            >
                              {capitalizeWord(displayWord)}
                            </motion.p>
                            <p className="text-sm text-slate-400 text-center px-4">
                              {t('game.describeWithoutSaying', { count: 1 })}
                            </p>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  type="button"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCloseRole}
                  className="w-full max-w-xs min-h-[48px] py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 font-semibold text-black tracking-wide shadow-lg shadow-emerald-500/40 transition"
                >
                  {t('local.hideRole')}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}

export default Local;
