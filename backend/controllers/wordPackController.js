const WordPack = require('../models/WordPack');

// Obtener todos los packs (opcional: ?locale=es|pt filtra por idioma)
// Si locale=pt y no hay packs en esa locale, se devuelven todos (para Português de Portugal)
const getAllPacks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.locale) {
      const locale = String(req.query.locale).trim().toLowerCase();
      if (locale) {
        filter.locale = new RegExp(`^${locale}`);
      }
    }
    let packs = await WordPack.find(filter, '-words').sort({ name: 1 });
    // Português (PT): si no hay packs con locale pt, devolver todos para que vean categorías
    if (packs.length === 0 && req.query.locale) {
      const requestedLocale = String(req.query.locale).trim().toLowerCase();
      if (requestedLocale === 'pt' || requestedLocale.startsWith('pt-')) {
        packs = await WordPack.find({}, '-words').sort({ name: 1 });
      }
    }
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

// Añadir palabra a pack personalizado (locale opcional: es-ES, pt-PT)
const addCustomWord = async (req, res) => {
  try {
    const { word, locale } = req.body;
    if (!word || !word.trim()) {
      return res.status(400).json({ ok: false, error: 'WORD_REQUIRED' });
    }
    const packLocale = locale && /^pt(-|$)/i.test(locale) ? 'pt-PT' : 'es-ES';
    const pack = await WordPack.findOne({ slug: 'personalizado', locale: packLocale });
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
