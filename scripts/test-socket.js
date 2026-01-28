const io = require('socket.io-client');

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('✅ Conectado al servidor Socket.io');

  // Test 1: Crear sala
  console.log('\n📝 Test 1: Crear sala...');
  socket.emit('room:create', { name: 'TestPlayer1' }, (response) => {
    if (response.ok) {
      console.log('✅ Sala creada:', response.room.code);
      console.log('   Jugadores:', response.room.players.length);

      // Test 2: Unirse a sala
      const socket2 = io('http://localhost:4000');
      socket2.on('connect', () => {
        console.log('\n📝 Test 2: Unirse a sala...');
        socket2.emit('room:join', { code: response.room.code, name: 'TestPlayer2' }, (response2) => {
          if (response2.ok) {
            console.log('✅ Unido a sala:', response2.room.code);
            console.log('   Jugadores:', response2.room.players.length);

            // Test 3: Verificar actualización de sala
            socket.on('room:updated', (roomData) => {
              console.log('\n📝 Test 3: Actualización de sala recibida');
              console.log('✅ Sala actualizada:', roomData.code);
              console.log('   Jugadores:', roomData.players.length);

              // Cerrar conexiones
              setTimeout(() => {
                socket.disconnect();
                socket2.disconnect();
                console.log('\n✅ Todas las pruebas pasaron exitosamente!');
                process.exit(0);
              }, 1000);
            });
          } else {
            console.error('❌ Error al unirse:', response2.error);
            process.exit(1);
          }
        });
      });
    } else {
      console.error('❌ Error al crear sala:', response.error);
      process.exit(1);
    }
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Error de conexión:', error.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Timeout: No se recibió respuesta');
  process.exit(1);
}, 10000);
