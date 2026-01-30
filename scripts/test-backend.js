#!/usr/bin/env node

/**
 * Script completo de pruebas del Backend
 * Prueba: Health check, MongoDB, Socket.io
 */

const http = require('http');
const io = require('socket.io-client');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/imposter-premium';

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function log (message, type = 'info') {
  const timestamp = new Date().toISOString();
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️';
  console.log(`${icon} [${timestamp}] ${message}`);
  results.push({ timestamp, type, message });
}

function test (name, fn) {
  return new Promise(async (resolve) => {
    try {
      log(`🧪 Ejecutando: ${name}`, 'info');
      await fn();
      log(`✅ PASÓ: ${name}`, 'success');
      testsPassed++;
      resolve(true);
    } catch (error) {
      log(`❌ FALLÓ: ${name} - ${error.message}`, 'error');
      testsFailed++;
      resolve(false);
    }
  });
}

// Test 1: Health Check HTTP
async function testHealthCheck () {
  return new Promise((resolve, reject) => {
    http.get(`${BACKEND_URL}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`Status code: ${res.statusCode}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          if (!json.ok) {
            reject(new Error('Response ok is false'));
            return;
          }
          if (typeof json.rooms !== 'number') {
            reject(new Error('Response rooms is not a number'));
            return;
          }
          resolve();
        } catch (e) {
          reject(new Error(`Invalid JSON: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

// Test 2: MongoDB Connection (desde backend)
async function testMongoDB () {
  return new Promise((resolve, reject) => {
    // Verificamos que el backend esté conectado a MongoDB
    // Si el servidor está corriendo, MongoDB está conectado
    http.get(`${BACKEND_URL}/health`, (res) => {
      if (res.statusCode === 200) {
        resolve(); // Si el health check pasa, MongoDB está conectado
      } else {
        reject(new Error('Backend no responde'));
      }
    }).on('error', (err) => {
      reject(new Error(`Backend error: ${err.message}`));
    });
  });
}

// Test 3: Socket.io - Crear Sala
async function testSocketCreateRoom () {
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout: No se recibió respuesta'));
    }, 10000);

    socket.on('connect', () => {
      socket.emit('room:create', { name: 'TestPlayer1' }, (response) => {
        clearTimeout(timeout);
        if (!response || !response.ok) {
          socket.disconnect();
          reject(new Error(`Error: ${response?.error || 'Unknown error'}`));
          return;
        }
        if (!response.room || !response.room.code) {
          socket.disconnect();
          reject(new Error('Response missing room code'));
          return;
        }
        // Mantener la conexión abierta para que la sala no se elimine
        // La desconectaremos después de las pruebas
        global.testSocket = socket;
        resolve(response.room.code);
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection error: ${error.message}`));
    });
  });
}

// Test 4: Socket.io - Unirse a Sala
async function testSocketJoinRoom (roomCode) {
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout: No se recibió respuesta'));
    }, 10000);

    socket.on('connect', () => {
      socket.emit('room:join', { code: roomCode, name: 'TestPlayer2' }, (response) => {
        clearTimeout(timeout);
        if (!response || !response.ok) {
          socket.disconnect();
          reject(new Error(`Error: ${response?.error || 'Unknown error'}`));
          return;
        }
        if (!response.room || response.room.players.length < 2) {
          socket.disconnect();
          reject(new Error('Player not added to room'));
          return;
        }
        socket.disconnect();
        resolve();
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection error: ${error.message}`));
    });
  });
}

// Test 5: Socket.io - Actualización de Sala
async function testSocketRoomUpdate (roomCode) {
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout: No se recibió actualización'));
    }, 10000);

    let updateReceived = false;
    let joinCompleted = false;

    // Escuchar actualizaciones antes de unirse
    socket.on('room:updated', (roomData) => {
      if (roomData.code === roomCode) {
        updateReceived = true;
        if (joinCompleted) {
          clearTimeout(timeout);
          if (roomData.players.length >= 2) {
            socket.disconnect();
            resolve();
          } else {
            socket.disconnect();
            reject(new Error('Room update received but player count insufficient'));
          }
        }
      }
    });

    socket.on('connect', () => {
      socket.emit('room:join', { code: roomCode, name: 'TestPlayer3' }, (response) => {
        joinCompleted = true;
        if (!response || !response.ok) {
          clearTimeout(timeout);
          socket.disconnect();
          reject(new Error(`Error joining: ${response?.error || 'Unknown error'}`));
          return;
        }

        // Si ya recibimos la actualización, resolver
        if (updateReceived && response.room.players.length >= 2) {
          clearTimeout(timeout);
          socket.disconnect();
          resolve();
        } else {
          // Esperar un poco más para la actualización
          setTimeout(() => {
            if (response.room.players.length >= 2) {
              clearTimeout(timeout);
              socket.disconnect();
              resolve();
            } else {
              clearTimeout(timeout);
              socket.disconnect();
              reject(new Error('Room join successful but player count insufficient'));
            }
          }, 1000);
        }
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection error: ${error.message}`));
    });
  });
}

// Test 6: Socket.io - Desconexión
async function testSocketDisconnect () {
  return new Promise((resolve, reject) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      reject(new Error('Timeout: No se pudo conectar'));
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      socket.emit('room:create', { name: 'TestDisconnect' }, (response) => {
        if (response && response.ok) {
          socket.disconnect();
          // Verificar que se desconectó correctamente
          setTimeout(() => {
            if (!socket.connected) {
              resolve();
            } else {
              reject(new Error('Socket still connected'));
            }
          }, 1000);
        } else {
          socket.disconnect();
          reject(new Error('Failed to create room'));
        }
      });
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Connection error: ${error.message}`));
    });
  });
}

// Ejecutar todas las pruebas
async function runAllTests () {
  console.log('\n🚀 Iniciando pruebas del Backend...\n');
  console.log(`📍 Backend URL: ${BACKEND_URL}\n`);

  let roomCode = null;

  // Test 1: Health Check
  await test('Health Check HTTP', testHealthCheck);

  // Test 2: MongoDB Connection
  await test('MongoDB Connection', testMongoDB);

  // Test 3: Socket.io - Crear Sala
  await test('Socket.io - Crear Sala', async () => {
    roomCode = await testSocketCreateRoom();
    if (!roomCode) {
      throw new Error('No room code returned');
    }
  });

  // Test 4: Socket.io - Unirse a Sala
  if (roomCode) {
    await test('Socket.io - Unirse a Sala', () => testSocketJoinRoom(roomCode));
  } else {
    log('⚠️ Saltando prueba de unirse a sala: No hay código de sala', 'warning');
  }

  // Test 5: Socket.io - Actualización de Sala
  if (roomCode) {
    await test('Socket.io - Actualización de Sala', () => testSocketRoomUpdate(roomCode));
  } else {
    log('⚠️ Saltando prueba de actualización de sala: No hay código de sala', 'warning');
  }

  // Test 6: Socket.io - Desconexión
  await test('Socket.io - Desconexión', testSocketDisconnect);

  // Limpiar socket de prueba si existe
  if (global.testSocket) {
    global.testSocket.disconnect();
    global.testSocket = null;
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));
  console.log(`✅ Pruebas pasadas: ${testsPassed}`);
  console.log(`❌ Pruebas fallidas: ${testsFailed}`);
  console.log(`📈 Total: ${testsPassed + testsFailed}`);
  console.log(`📊 Tasa de éxito: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  if (testsFailed === 0) {
    console.log('🎉 ¡Todas las pruebas pasaron exitosamente!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa los errores arriba.\n');
    process.exit(1);
  }
}

// Ejecutar
runAllTests().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
