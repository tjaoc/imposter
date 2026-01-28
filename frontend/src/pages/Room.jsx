import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../hooks/useSocket';
import PackSelector from '../components/PackSelector';

function Room() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const [room, setRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPack, setSelectedPack] = useState(null);
  const [isStarting, setIsStarting] = useState(false);

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
    socket.emit('room:join', { code, name: 'Player' }, (response) => {
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
    });

    // Cleanup
    return () => {
      socket.off('room:updated', handleRoomUpdate);
      socket.emit('room:leave');
    };
  }, [code, socket, isConnected]);

  const handleStartGame = () => {
    if (!isHost || !room || room.players.length < 3 || !selectedPack) {
      return;
    }

    setIsStarting(true);
    socket.emit('game:start', { packId: selectedPack }, (response) => {
      setIsStarting(false);
      if (response && response.ok) {
        // La navegación se hará cuando recibamos el evento game:started
      } else {
        alert(`Error: ${response?.error || 'No se pudo iniciar el juego'}`);
      }
    });
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-effect rounded-2xl p-8 max-w-md w-full text-center"
        >
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {error === 'ROOM_NOT_FOUND' ? 'Sala no encontrada' : 
             error === 'ROOM_FULL' ? 'Sala llena' :
             error === 'NAME_REQUIRED' ? 'Nombre requerido' :
             'Error al unirse'}
          </h2>
          <p className="text-gray-400 mb-6">
            {error === 'ROOM_NOT_FOUND' 
              ? `La sala con código "${code}" no existe o ya se cerró.`
              : 'No se pudo unir a la sala. Por favor intenta de nuevo.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-gradient-to-r from-space-purple to-space-pink rounded-lg font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Volver al inicio
          </button>
          {error === 'ROOM_NOT_FOUND' && (
            <p className="text-sm text-gray-500 mt-4">
              Redirigiendo en 3 segundos...
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
            Conectando a la sala...
          </div>
          <div className="text-gray-400 text-sm">Código: {code}</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-glow mb-2">Sala {room.code}</h1>
          <p className="text-space-cyan">Esperando jugadores...</p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="glass-effect rounded-2xl p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400">Jugadores ({room.players.length}/{room.settings.maxPlayers})</span>
            {isHost && (
              <span className="text-xs bg-space-purple px-3 py-1 rounded-full">Anfitrión</span>
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
                  className="flex items-center justify-between p-3 bg-space-blue rounded-lg"
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
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-effect rounded-2xl p-6 mb-6"
            >
              <PackSelector 
                onSelectPack={setSelectedPack}
                selectedPackId={selectedPack}
              />
            </motion.div>

            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartGame}
              disabled={room.players.length < 3 || !selectedPack || isStarting}
              className="w-full py-4 bg-gradient-to-r from-space-purple to-space-pink rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Iniciando...' :
               room.players.length < 3 ? `Esperando más jugadores (${room.players.length}/3)` :
               !selectedPack ? 'Selecciona un pack primero' :
               'Iniciar Juego'}
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default Room;
