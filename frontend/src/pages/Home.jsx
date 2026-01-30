import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../hooks/useTranslation';
import CustomWords from '../components/CustomWords';
import LanguageSelector from '../components/LanguageSelector';

function Home() {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showCustomWords, setShowCustomWords] = useState(false);
  const navigate = useNavigate();
  const { socket, connectSocket } = useSocket();

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return;

    setIsCreating(true);

    // Asegurar que el socket está conectado
    let activeSocket = socket;
    if (!socket || !socket.connected) {
      activeSocket = await connectSocket();
    }

    // Esperar un momento para asegurar la conexión
    if (activeSocket && activeSocket.connected) {
      // Guardar el nombre en localStorage para uso futuro
      localStorage.setItem('playerName', playerName.trim());

      activeSocket.emit(
        'room:create',
        { name: playerName.trim() },
        (response) => {
          setIsCreating(false);
          if (response && response.ok) {
            navigate(`/room/${response.room.code}`);
          } else {
            console.error('❌ Error creando sala:', response?.error);
            alert(t('errors.createRoom'));
          }
        }
      );
    } else {
      setIsCreating(false);
      alert(t('errors.connection'));
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;

    setIsJoining(true);

    // Asegurar que el socket está conectado
    let activeSocket = socket;
    if (!socket || !socket.connected) {
      activeSocket = await connectSocket();
    }

    if (activeSocket && activeSocket.connected) {
      // Guardar el nombre en localStorage para uso futuro
      localStorage.setItem('playerName', playerName.trim());

      const joinData = {
        code: roomCode.trim().toUpperCase(),
        name: playerName.trim(),
      };

      activeSocket.emit('room:join', joinData, (response) => {
        setIsJoining(false);
        if (response && response.ok) {
          navigate(`/room/${response.room.code}`);
        } else {
          console.error('❌ Error al unirse:', response?.error);
          alert(`Error: ${response?.error || t('errors.unknown')}`);
        }
      });
    } else {
      console.error('❌ Socket no disponible o no conectado');
      setIsJoining(false);
      alert(t('errors.connection'));
    }
  };

  return (
    <div className="min-h-full flex flex-col p-4 sm:p-6 md:p-8">
      <div className="flex items-center justify-end mb-2 min-h-[48px]">
        <LanguageSelector />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex flex-col items-center justify-center w-full max-w-md md:max-w-lg lg:max-w-xl"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <img
            src="/favicon.svg"
            alt="Imposter"
            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-3 sm:mb-4"
          />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-glow mb-3 sm:mb-4">
            {t('home.title')}
          </h1>
          <p className="text-space-cyan text-base sm:text-lg md:text-xl">
            {t('home.subtitle')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6"
        >
          <button
            type="button"
            onClick={() => navigate('/local')}
            className="w-full min-h-[48px] py-3.5 sm:py-4 rounded-xl border-2 border-space-cyan/50 bg-space-blue/50 hover:bg-space-cyan/20 hover:border-space-cyan active:scale-[0.98] font-semibold text-space-cyan mb-4 flex items-center justify-center gap-3 text-left"
          >
            <span className="text-2xl">📱</span>
            <div className="text-left flex-1 min-w-0">
              <div className="text-base sm:text-lg">{t('home.playLocal')}</div>
              <div className="text-sm font-normal text-gray-400">
                {t('home.playLocalDesc')}
              </div>
            </div>
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-space-cyan/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-space-blue text-gray-400">
                {t('common.or')}
              </span>
            </div>
          </div>
          <div className="text-center text-gray-400 text-sm mb-4">
            {t('home.playOnlineDesc')}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6"
        >
          <div>
            <label className="block text-sm sm:text-base font-medium mb-2 text-space-cyan">
              {t('home.yourName')}
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('home.yourNamePlaceholder')}
              className="w-full px-4 py-3.5 sm:py-3 bg-space-blue border border-space-cyan/30 rounded-xl focus:outline-none focus:border-space-cyan focus:ring-2 focus:ring-space-cyan/50 text-white placeholder-gray-400 text-base"
              maxLength={20}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={isCreating || !playerName.trim()}
              className="w-full min-h-[48px] py-3.5 sm:py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-xl font-semibold text-white hover:from-space-pink hover:to-space-purple active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? t('home.creating') : t('home.createRoom')}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-space-cyan/30"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-space-blue text-gray-400">
                  {t('common.or')}
                </span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={t('home.roomCode')}
                className="w-full px-4 py-3.5 sm:py-3 bg-space-blue border border-space-cyan/30 rounded-xl focus:outline-none focus:border-space-cyan focus:ring-2 focus:ring-space-cyan/50 text-white placeholder-gray-400 mb-4 uppercase text-base"
                maxLength={6}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleJoinRoom();
                }}
                disabled={isJoining || !playerName.trim() || !roomCode.trim()}
                className="w-full min-h-[48px] py-3.5 sm:py-4 bg-space-blue border-2 border-space-cyan rounded-xl font-semibold text-space-cyan hover:bg-space-cyan hover:text-space-dark active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? t('home.joining') : t('home.joinRoom')}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => setShowCustomWords(true)}
          className="mt-4 min-h-[48px] flex items-center justify-center text-space-cyan hover:text-space-glow transition-colors text-sm underline w-full sm:w-auto active:opacity-80"
        >
          ✏️ {t('home.addCustomWords')}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {showCustomWords && (
          <CustomWords onClose={() => setShowCustomWords(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default Home;
