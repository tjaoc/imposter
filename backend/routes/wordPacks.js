const express = require('express');
const router = express.Router();
const {
  getAllPacks,
  getPackById,
  getRandomWord,
  addCustomWord,
} = require('../controllers/wordPackController');

// Rutas
router.get('/', getAllPacks);
router.get('/:id', getPackById);
router.get('/:id/random', getRandomWord);
router.post('/custom', addCustomWord);

module.exports = router;
