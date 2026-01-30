/**
 * Ejecuta solo el seed de packs de palabras (conexión a DB + seedWordPacks).
 * Uso desde la raíz del repo: cd backend && node scripts/seed-standalone.js
 * Requiere MONGODB_URI en .env o en el entorno.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { connectDb } = require('../config/db');
const { seedWordPacks } = require('../seeds/wordPacks');
const mongoose = require('mongoose');

async function main() {
  await connectDb();
  await seedWordPacks();
  await mongoose.connection.close();
  console.log('👋 Conexión cerrada.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
