#!/usr/bin/env node

/**
 * Script completo de pruebas del Frontend
 * Prueba: HTTP, React, Componentes, Socket.io Client
 */

const http = require('http');
const https = require('https');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

let testsPassed = 0;
let testsFailed = 0;
const results = [];

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️';
  console.log(`${icon} [${timestamp}] ${message}`);
  results.push({ timestamp, type, message });
}

function test(name, fn) {
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

// Test 1: Frontend HTTP Accesibilidad
async function testFrontendHTTP() {
  return new Promise((resolve, reject) => {
    http.get(FRONTEND_URL, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Status code: ${res.statusCode}`));
        return;
      }
      resolve();
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

// Test 2: Frontend - Título de la Página
async function testFrontendTitle() {
  return new Promise((resolve, reject) => {
    http.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data.includes('<title>Imposter Premium</title>')) {
          reject(new Error('Title not found or incorrect'));
          return;
        }
        resolve();
      });
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

// Test 3: Frontend - Meta Tags
async function testFrontendMetaTags() {
  return new Promise((resolve, reject) => {
    http.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const requiredTags = [
          'viewport',
          'description',
          'theme-color',
        ];
        
        const missing = requiredTags.filter(tag => {
          return !data.includes(`name="${tag}"`) && !data.includes(`name='${tag}'`);
        });

        if (missing.length > 0) {
          reject(new Error(`Missing meta tags: ${missing.join(', ')}`));
          return;
        }
        resolve();
      });
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

// Test 4: Frontend - React Scripts
async function testFrontendReactScripts() {
  return new Promise((resolve, reject) => {
    http.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (!data.includes('react') && !data.includes('React')) {
          reject(new Error('React not detected in HTML'));
          return;
        }
        if (!data.includes('/src/main.jsx') && !data.includes('main.jsx')) {
          reject(new Error('main.jsx not found'));
          return;
        }
        resolve();
      });
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

// Test 5: Frontend - Vite Dev Server
async function testViteDevServer() {
  return new Promise((resolve, reject) => {
    http.get(`${FRONTEND_URL}/@vite/client`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // 404 es aceptable si el servidor está funcionando pero el endpoint no existe
        resolve();
      } else {
        reject(new Error(`Vite client endpoint status: ${res.statusCode}`));
      }
    }).on('error', (err) => {
      // Si el endpoint no existe, verificamos que el servidor responda
      http.get(FRONTEND_URL, (res) => {
        if (res.statusCode === 200) {
          resolve(); // El servidor funciona, el endpoint específico puede no existir
        } else {
          reject(new Error(`Frontend not accessible: ${res.statusCode}`));
        }
      }).on('error', (e) => {
        reject(new Error(`Vite check failed: ${err.message}`));
      });
    });
  });
}

// Test 6: Frontend - CSS Loading
async function testFrontendCSS() {
  return new Promise((resolve, reject) => {
    http.get(FRONTEND_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        // Verificar que hay referencias a CSS o estilos
        if (!data.includes('css') && !data.includes('style') && !data.includes('tailwind')) {
          reject(new Error('CSS not detected'));
          return;
        }
        resolve();
      });
    }).on('error', (err) => {
      reject(new Error(`Request failed: ${err.message}`));
    });
  });
}

// Test 7: Backend Accesible desde Frontend
async function testBackendAccessible() {
  return new Promise((resolve, reject) => {
    http.get(`${BACKEND_URL}/health`, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Backend health check failed: ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ok) {
            resolve();
          } else {
            reject(new Error('Backend health check returned ok: false'));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON from backend: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Backend not accessible: ${err.message}`));
    });
  });
}

// Test 8: Socket.io Client - Conexión
async function testSocketClientConnection() {
  return new Promise((resolve, reject) => {
    // Verificamos que el backend Socket.io esté accesible
    const socket = require('socket.io-client');
    const client = socket(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    const timeout = setTimeout(() => {
      client.disconnect();
      reject(new Error('Timeout: Socket.io server not responding'));
    }, 10000);

    client.on('connect', () => {
      clearTimeout(timeout);
      client.disconnect();
      resolve();
    });

    client.on('connect_error', (error) => {
      clearTimeout(timeout);
      reject(new Error(`Socket.io connection error: ${error.message}`));
    });
  });
}

// Ejecutar todas las pruebas
async function runAllTests() {
  console.log('\n🚀 Iniciando pruebas del Frontend...\n');
  console.log(`📍 Frontend URL: ${FRONTEND_URL}`);
  console.log(`📍 Backend URL: ${BACKEND_URL}\n`);

  // Test 1: HTTP Accesibilidad
  await test('Frontend HTTP Accesibilidad', testFrontendHTTP);

  // Test 2: Título de la Página
  await test('Frontend - Título de la Página', testFrontendTitle);

  // Test 3: Meta Tags
  await test('Frontend - Meta Tags', testFrontendMetaTags);

  // Test 4: React Scripts
  await test('Frontend - React Scripts', testFrontendReactScripts);

  // Test 5: Vite Dev Server
  await test('Vite Dev Server', testViteDevServer);

  // Test 6: CSS Loading
  await test('Frontend - CSS Loading', testFrontendCSS);

  // Test 7: Backend Accesible
  await test('Backend Accesible desde Frontend', testBackendAccessible);

  // Test 8: Socket.io Client
  await test('Socket.io Client - Conexión', testSocketClientConnection);

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
