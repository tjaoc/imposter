import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import PackSelector from '../components/PackSelector';
import LanguageSelector from '../components/LanguageSelector';
import PageNav from '../components/PageNav';

function Room() {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPacks, setSelectedPacks] = useState([]);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    impostorCount: 1,
    discussionSeconds: 240, // 4 minutos
    hintForImpostors: true,
  });

  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    // Handler para actualizaciones de sala
    const handleRoomUpdate = (roomData) => {
      setRoom(roomData);
      setIsHost(socket.id === roomData.hostId);
    };

    // Registrar el handler
    socket.on('room:updated', handleRoomUpdate);

    // Unirse a la sala
    socket.emit(
      'room:join',
      {
        code,
        name: localStorage.getItem('playerName') || t('common.playerDefault'),
      },
      (response) => {
        if (response && response.ok) {
          setRoom(response.room);
          setIsHost(socket.id === response.room.hostId);
          setError(null);
        } else {
          const errorMsg = response?.error || 'ERROR_UNKNOWN';
          console.error('Error joining room:', errorMsg);
          setError(errorMsg);

          // Redirigir al home después de 3 segundos si la sala no existe
          if (errorMsg === 'ROOM_NOT_FOUND') {
            setTimeout(() => {
              navigate('/');
            }, 3000);
          }
        }
      }
    );

    // Cleanup
    return () => {
      socket.off('room:updated', handleRoomUpdate);
      socket.emit('room:leave');
    };
  }, [code, socket, isConnected]);

  const handleStartGame = () => {
    const useRandom = selectedPacks.length === 1 && selectedPacks[0] === 'random';
    if (
      !isHost ||
      !room ||
      room.players.length < 3 ||
      (!useRandom && selectedPacks.length === 0)
    ) {
      return;
    }

    setIsStarting(true);

    const packId = useRandom
      ? 'random'
      : selectedPacks[Math.floor(Math.random() * selectedPacks.length)];

    socket.emit(
      'game:start',
      {
        packId,
        selectedPacks: useRandom ? [] : selectedPacks,
        hintForImpostors: settings.hintForImpostors,
        discussionSeconds: settings.discussionSeconds,
        impostorCount: settings.impostorCount,
        locale,
      },
      (response) => {
        setIsStarting(false);
        if (response && response.ok) {
          // La navegación se hará cuando recibamos el evento game:started
        } else {
          alert(
            `${t('common.error')}: ${response?.error || t('errors.startGame')}`
          );
        }
      }
    );
  };

  // Escuchar cuando el juego inicia
  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = () => {
      navigate(`/game/${code}`);
    };

    socket.on('game:started', handleGameStarted);

    return () => {
      socket.off('game:started', handleGameStarted);
    };
  }, [socket, code, navigate]);

  // Mostrar error si la sala no existe
  if (error) {
    return (
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-2xl p-6 sm:p-8 max-w-md w-full text-center"
        >
          <div className="text-5xl sm:text-6xl mb-4">❌</div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
            {error === 'ROOM_NOT_FOUND'
              ? t('room.roomNotFound')
              : error === 'ROOM_FULL'
              ? t('room.roomFull')
              : error === 'NAME_REQUIRED'
              ? t('room.nameRequired')
              : t('common.error')}
          </h2>
          <p className="text-gray-400 mb-6">
            {error === 'ROOM_NOT_FOUND'
              ? t('room.roomNotFoundDesc')
              : t('errors.createRoom')}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full min-h-[48px] py-3.5 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {t('room.backToHome')}
          </button>
          {error === 'ROOM_NOT_FOUND' && (
            <p className="text-sm text-gray-500 mt-4">
              {t('room.redirecting')}
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  // Mostrar cargando mientras se conecta
  if (!room) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-pulse text-space-cyan text-xl mb-4">
            {t('room.connecting')}
          </div>
          <div className="text-gray-400 text-sm">{code}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 sm:p-6 md:p-8">
      <PageNav
        showBack
        onBack={() => navigate(-1)}
        onExit={() => navigate('/')}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto"
      >
        <div className="text-center mb-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow mb-2">
            {t('room.title')} {room.code}
          </h1>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(room.code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              } catch {
                // fallback
                const ok = document.execCommand?.('copy');
                if (ok) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }
            }}
            className="min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-semibold bg-space-blue border border-space-cyan/40 text-space-cyan hover:bg-space-cyan/20 hover:border-space-cyan/60 active:scale-[0.98] transition-all"
          >
            {copied ? `✓ ${t('room.copied')}` : `📋 ${t('room.copyCode')}`}
          </button>
          <p className="text-space-cyan text-sm sm:text-base mt-4">
            {t('room.waitingPlayers')}
          </p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="card mb-4"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">
              {t('room.players')} ({room.players.length}/
              {room.settings.maxPlayers})
            </span>
            {isHost && (
              <span className="text-sm bg-space-purple px-3 py-1.5 rounded-full">
                {t('room.host')}
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {room.players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 sm:p-4 min-h-[48px] bg-space-blue rounded-xl"
                >
                  <span className="text-white">{player.name}</span>
                  {player.isHost && (
                    <span className="text-sm text-space-cyan">👑</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {isHost && (
          <>
            {/* Orden igual que Local: Impostores → Pista → Duración → Categorías */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4 mb-6"
            >
              {/* Número de Impostores */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="card"
              >
                <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">🕵️</span>
                    <span className="text-white font-semibold whitespace-nowrap">{t('room.impostors')}</span>
                    <span className="text-sm text-gray-400 hidden sm:inline truncate">{t('room.impostorsDesc')}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          impostorCount: Math.max(1, prev.impostorCount - 1),
                        }))
                      }
                      disabled={settings.impostorCount <= 1}
                      className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl flex items-center justify-center active:scale-95"
                    >
                      −
                    </button>
                    <span className="text-xl sm:text-2xl font-bold text-white w-12 text-center">
                      {settings.impostorCount}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          impostorCount: Math.min(
                            room.players.length - 1,
                            prev.impostorCount + 1
                          ),
                        }))
                      }
                      disabled={
                        settings.impostorCount >= room.players.length - 1
                      }
                      className="min-w-[48px] min-h-[48px] w-12 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl flex items-center justify-center active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Pista para Impostores */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="card-tight"
              >
                <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">🔍</span>
                    <span className="text-white font-semibold whitespace-nowrap">{t('room.hintForImpostors')}</span>
                    <span className="text-sm text-gray-400 hidden sm:inline truncate">{t('room.hintForImpostorsDesc')}</span>
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
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="card"
              >
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
              </motion.div>

              {/* Categorías (Pack Selector) */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="card"
              >
                <PackSelector
                  onSelectPacks={setSelectedPacks}
                  selectedPackIds={selectedPacks}
                  allowRandom
                />
              </motion.div>
            </motion.div>

            {/* Botón Iniciar Juego */}
            {(() => {
              const hasPacksOrRandom =
                (selectedPacks.length === 1 && selectedPacks[0] === 'random') ||
                selectedPacks.length > 0;
              return (
            <motion.button
              type="button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartGame}
              disabled={room.players.length < 3 || !hasPacksOrRandom || isStarting}
              className={`w-full min-h-[52px] py-4 sm:py-5 rounded-2xl font-bold text-base sm:text-lg transition-all disabled:cursor-not-allowed ${
                room.players.length >= 3 && hasPacksOrRandom && !isStarting
                  ? 'btn-primary'
                  : 'bg-gray-700 border border-gray-600 text-gray-500'
              }`}
            >
              {isStarting
                ? `⏳ ${t('room.starting')}`
                : room.players.length < 3
                ? `⏸️ ${t('room.waitingMore')} (${room.players.length}/3)`
                : selectedPacks.length === 0
                ? `📦 ${t('room.selectPacks')}`
                : `🚀 ${t('room.startGame')}`}
            </motion.button>
              );
            })()}
          </>
        )}
      </motion.div>
    </div>
  );
}

export default Room;
