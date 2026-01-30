import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { assignRoles } from '../utils/localGameLogic';
import LanguageSelector from '../components/LanguageSelector';
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
  const [gameState, setGameState] = useState(null);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [roleRevealed, setRoleRevealed] = useState(false);

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
    if (selectedPackIds.length === 0 || players.length < 3) return;
    const randomPackId =
      selectedPackIds[Math.floor(Math.random() * selectedPackIds.length)];
    fetch(`${API_BASE}/api/packs/${randomPackId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok || !data.pack?.words?.length) return;
        const pack = data.pack;
        const secretWord =
          pack.words[Math.floor(Math.random() * pack.words.length)];
        const hintWord = pack.name || null;
        const playersWithRoles = assignRoles(
          players.map((p) => ({ id: p.id, name: p.name })),
          secretWord,
          1,
          hintWord
        );
        setGameState({
          players: playersWithRoles,
          secretWord,
          impostorHint: hintWord,
          discussionSeconds: 240,
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
    if (currentRevealIndex >= gameState.players.length - 1) {
      navigate('/local/game', { state: { gameState } });
    } else {
      setCurrentRevealIndex((i) => i + 1);
    }
  };

  const currentPlayer = gameState?.players?.[currentRevealIndex];

  if (step === 'players') {
    return (
      <div className="min-h-full p-4 sm:p-6 md:p-8 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="absolute top-content-safe right-4 sm:right-6 md:right-8">
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
          <div className="glass-effect rounded-2xl p-4 sm:p-6 mb-4">
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
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center text-red-400 hover:text-red-300 text-sm flex-shrink-0"
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
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-4 min-h-[48px] py-3.5 text-gray-400 hover:text-white active:scale-[0.98]"
          >
            {t('common.back')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'pack') {
    return (
      <div className="min-h-full p-4 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="absolute top-content-safe right-4">
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
            <p className="text-space-cyan/80">{t('local.selectPackDesc')}</p>
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
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-space-cyan">
                  {t('room.selectPacksLabel')}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPackIds(
                      selectedPackIds.length === packs.length
                        ? []
                        : packs.map((p) => p._id)
                    )
                  }
                  className="text-xs text-space-cyan hover:text-space-cyan/80 underline"
                >
                  {selectedPackIds.length === packs.length
                    ? t('room.deselectAll')
                    : t('room.selectAll')}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                {packs.map((pack) => {
                  const isSelected = selectedPackIds.includes(pack._id);
                  return (
                    <motion.button
                      key={pack._id}
                      type="button"
                      onClick={() =>
                        setSelectedPackIds((prev) =>
                          prev.includes(pack._id)
                            ? prev.filter((id) => id !== pack._id)
                            : [...prev, pack._id]
                        )
                      }
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`min-h-[52px] p-4 rounded-xl border-2 text-left transition-all relative active:scale-[0.98] ${
                        isSelected
                          ? 'border-space-cyan bg-space-cyan/20'
                          : 'border-space-blue bg-space-blue/50 hover:border-space-cyan/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-space-cyan text-xl">
                          ✓
                        </div>
                      )}
                      <span className="font-semibold text-white">
                        {(t('packs.' + pack.slug) || '').startsWith('packs.')
                          ? pack.name
                          : t('packs.' + pack.slug)}
                      </span>
                      {pack.isAdult && <span className="ml-2 text-xs">🔞</span>}
                    </motion.button>
                  );
                })}
              </div>
              {selectedPackIds.length > 0 && (
                <p className="text-xs text-gray-400 text-center mb-4">
                  {selectedPackIds.length} {t('room.packsSelected')}
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={startGameWithPack}
            disabled={selectedPackIds.length === 0 || loadingPacks}
            className="w-full min-h-[52px] py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-xl font-bold text-white disabled:opacity-50 active:scale-[0.98]"
          >
            {t('local.startGame')}
          </button>
          <button
            type="button"
            onClick={() => setStep('players')}
            className="w-full mt-4 min-h-[48px] py-3.5 text-gray-400 hover:text-white active:scale-[0.98]"
          >
            {t('common.back')}
          </button>
        </motion.div>
      </div>
    );
  }

  if (step === 'reveal' && currentPlayer) {
    const isImpostor = currentPlayer.role === 'impostor';
    const displayWord = currentPlayer.word || '';

    return (
      <div className="min-h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black via-slate-950 to-black">
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
                onClick={() => setRoleRevealed(true)}
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-md text-center"
            >
              <div className="glass-effect rounded-3xl p-8 mb-6">
                <div className="text-6xl mb-4">{isImpostor ? '🕵️' : '🎯'}</div>
                {isImpostor ? (
                  <>
                    <p className="text-red-400 font-bold text-xl mb-2">
                      {t('game.youAreImpostor')}
                    </p>
                    {displayWord && (
                      <p className="text-sm text-emerald-300">
                        {t('game.hintCategory')}: {capitalizeWord(displayWord)}
                      </p>
                    )}
                    <p className="text-gray-400 text-sm mt-4">
                      {t('game.impostorHint')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-2">
                      {t('game.yourSecretWord')}
                    </p>
                    <p className="text-3xl font-bold text-emerald-400">
                      {capitalizeWord(displayWord)}
                    </p>
                    <p className="text-gray-400 text-sm mt-4">
                      {t('game.describeWithoutSaying', { count: 1 })}
                    </p>
                  </>
                )}
              </div>
              <motion.button
                type="button"
                onClick={handleCloseRole}
                whileTap={{ scale: 0.98 }}
                className="w-full min-h-[52px] py-4 rounded-full bg-space-blue border-2 border-space-cyan font-semibold text-space-cyan hover:bg-space-cyan hover:text-space-dark transition-colors active:scale-[0.98]"
              >
                {t('local.hideRole')}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

export default Local;
