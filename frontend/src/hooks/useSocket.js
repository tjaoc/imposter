import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

// Socket global compartido entre todos los componentes
let globalSocket = null;
let listeners = new Set();

function getGlobalSocket () {
  if (!globalSocket) {
    globalSocket = io(SOCKET_URL, {
      // Importante: empezar en polling y luego hacer upgrade a websocket.
      // Evita errores tipo: "WebSocket is closed before the connection is established"
      // en algunos entornos (Docker/proxy/latencia).
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    globalSocket.on('connect', () => {
      notifyListeners(true);
    });

    globalSocket.on('disconnect', () => {
      notifyListeners(false);
    });

    globalSocket.on('connect_error', () => {
      notifyListeners(false);
    });
  }
  return globalSocket;
}

function notifyListeners (isConnected) {
  listeners.forEach(listener => listener(isConnected));
}

export function useSocket () {
  const [socket, setSocket] = useState(() => getGlobalSocket());
  const [isConnected, setIsConnected] = useState(() => globalSocket?.connected || false);

  useEffect(() => {
    const currentSocket = getGlobalSocket();
    setSocket(currentSocket);
    setIsConnected(currentSocket.connected);

    // Registrar listener para actualizaciones de conexión
    const listener = (connected) => {
      setIsConnected(connected);
    };
    listeners.add(listener);

    // Cleanup: solo remover el listener, NO desconectar el socket
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const connectSocket = async () => {
    const socket = getGlobalSocket();
    if (socket.connected) {
      return socket;
    }
    // Si no está conectado, esperar a que se conecte
    return new Promise((resolve) => {
      if (socket.connected) {
        resolve(socket);
      } else {
        socket.once('connect', () => resolve(socket));
      }
    });
  };

  return { socket, isConnected, connectSocket };
}
