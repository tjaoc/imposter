const WordPack = require('../models/WordPack');

// Obtener todos los packs
const getAllPacks = async (req, res) => {
  try {
    const packs = await WordPack.find({}, '-words').sort({ name: 1 });
    res.json({ ok: true, packs });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Obtener un pack específico con palabras
const getPackById = async (req, res) => {
  try {
    const pack = await WordPack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ ok: false, error: 'PACK_NOT_FOUND' });
    }
    res.json({ ok: true, pack });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Obtener palabra aleatoria de un pack
const getRandomWord = async (req, res) => {
  try {
    const pack = await WordPack.findById(req.params.id);
    if (!pack) {
      return res.status(404).json({ ok: false, error: 'PACK_NOT_FOUND' });
    }
    if (pack.words.length === 0) {
      return res.status(400).json({ ok: false, error: 'PACK_EMPTY' });
    }
    const word = pack.words[Math.floor(Math.random() * pack.words.length)];
    res.json({ ok: true, word });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Añadir palabra a pack personalizado
const addCustomWord = async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ ok: false, error: 'WORD_REQUIRED' });
    }

    const pack = await WordPack.findOne({ slug: 'personalizado' });
    if (!pack) {
      return res.status(404).json({ ok: false, error: 'CUSTOM_PACK_NOT_FOUND' });
    }

    if (!pack.words.includes(word.trim())) {
      pack.words.push(word.trim());
      await pack.save();
    }

    res.json({ ok: true, pack });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
};

module.exports = {
  getAllPacks,
  getPackById,
  getRandomWord,
  addCustomWord,
};
