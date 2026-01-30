import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import PackSelector from '../components/PackSelector';
import LanguageSelector from '../components/LanguageSelector';

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
    if (
      !isHost ||
      !room ||
      room.players.length < 3 ||
      selectedPacks.length === 0
    ) {
      return;
    }

    setIsStarting(true);

    // Si hay múltiples packs, seleccionar uno aleatorio
    const randomPackId =
      selectedPacks[Math.floor(Math.random() * selectedPacks.length)];

    socket.emit(
      'game:start',
      {
        packId: randomPackId,
        selectedPacks: selectedPacks, // Enviar todos los packs seleccionados para guardarlos
        hintForImpostors: settings.hintForImpostors,
        discussionSeconds: settings.discussionSeconds,
        impostorCount: settings.impostorCount,
        locale, // idioma seleccionado para que las palabras/categoría sean en ese idioma
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
      <div className="min-h-screen flex items-center justify-center">
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto"
      >
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow mb-2">
            {t('room.title')} {room.code}
          </h1>
          <p className="text-space-cyan text-sm sm:text-base">
            {t('room.waitingPlayers')}
          </p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-effect rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">
              {t('room.players')} ({room.players.length}/
              {room.settings.maxPlayers})
            </span>
            {isHost && (
              <span className="text-xs bg-space-purple px-3 py-1 rounded-full">
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
                    <span className="text-xs text-space-cyan">👑</span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {isHost && (
          <>
            {/* Configuración Avanzada - Estilo del video */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-4 mb-6"
            >
              {/* Pack Selector */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-effect rounded-2xl p-4 sm:p-6"
              >
                <PackSelector
                  onSelectPacks={setSelectedPacks}
                  selectedPackIds={selectedPacks}
                />
              </motion.div>

              {/* Número de Impostores */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-effect rounded-2xl p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🕵️</div>
                    <div>
                      <div className="text-white font-semibold">
                        {t('room.impostors')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t('room.impostorsDesc')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          impostorCount: Math.max(1, prev.impostorCount - 1),
                        }))
                      }
                      disabled={settings.impostorCount <= 1}
                      className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl flex items-center justify-center active:scale-95"
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
                      className="min-w-[44px] min-h-[44px] w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xl flex items-center justify-center active:scale-95"
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
                transition={{ delay: 0.2 }}
                className="glass-effect rounded-2xl p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🔍</div>
                    <div>
                      <div className="text-white font-semibold">
                        {t('room.hintForImpostors')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t('room.hintForImpostorsDesc')}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        hintForImpostors: !prev.hintForImpostors,
                      }))
                    }
                    className={`relative w-14 h-9 min-h-[44px] rounded-full transition-colors flex-shrink-0 ${
                      settings.hintForImpostors
                        ? 'bg-emerald-500'
                        : 'bg-gray-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: settings.hintForImpostors ? 24 : 4 }}
                      className="absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-lg"
                    />
                  </button>
                </div>
              </motion.div>

              {/* Duración */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-effect rounded-2xl p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">⏱️</div>
                    <div>
                      <div className="text-white font-semibold">
                        {t('room.duration')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {t('room.durationDesc')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[60, 120, 180, 240, 300].map((seconds) => (
                      <button
                        type="button"
                        key={seconds}
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            discussionSeconds: seconds,
                          }))
                        }
                        className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                          settings.discussionSeconds === seconds
                            ? 'bg-space-cyan text-black'
                            : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                      >
                        {seconds / 60}min
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Botón Iniciar Juego - Estilo del video */}
            <motion.button
              type="button"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartGame}
              disabled={
                room.players.length < 3 ||
                selectedPacks.length === 0 ||
                isStarting
              }
              className="w-full min-h-[52px] py-4 sm:py-5 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-2xl font-bold text-white text-base sm:text-lg shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            >
              {isStarting
                ? `⏳ ${t('room.starting')}`
                : room.players.length < 3
                ? `⏸️ ${t('room.waitingMore')} (${room.players.length}/3)`
                : selectedPacks.length === 0
                ? `📦 ${t('room.selectPacks')}`
                : `🚀 ${t('room.startGame')}`}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default Room;
