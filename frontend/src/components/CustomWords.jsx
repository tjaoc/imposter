import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from '../config/env';

function CustomWords({ onClose }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [word, setWord] = useState('');
  const [customWords, setCustomWords] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddWord = async () => {
    if (!word.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/packs/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: word.trim(), locale }),
      });

      const data = await response.json();
      
      if (data.ok) {
        setCustomWords([...customWords, word.trim()]);
        setWord('');
        console.log('✅ Palabra añadida:', word.trim());
      } else {
        alert(`${t('common.error')}: ${data.error}`);
      }
    } catch (error) {
      console.error('Error añadiendo palabra:', error);
      alert(t('customWords.errorAdd'));
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddWord();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-effect rounded-2xl p-8 max-w-md w-full"
      >
        <h2 className="text-3xl font-bold text-glow mb-6 text-center">
          ✏️ {t('customWords.title')}
        </h2>

        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('customWords.placeholder')}
              className="flex-1 px-4 py-3 bg-space-blue border border-space-cyan/30 rounded-lg focus:outline-none focus:border-space-cyan focus:ring-2 focus:ring-space-cyan/50 text-white placeholder-gray-400"
              maxLength={50}
            />
            <button
              onClick={handleAddWord}
              disabled={!word.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-space-purple to-space-pink rounded-lg font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '...' : '+'}
            </button>
          </div>
        </div>

        {customWords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-space-cyan mb-3">
              {t('customWords.addedThisSession')}:
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {customWords.map((w, i) => (
                <div
                  key={i}
                  className="p-2 bg-space-blue rounded text-white text-sm"
                >
                  {w}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-space-blue border-2 border-space-cyan rounded-lg font-semibold text-space-cyan hover:bg-space-cyan hover:text-space-dark transition-all"
        >
          {t('common.close')}
        </button>
      </motion.div>
    </motion.div>
  );
}

export default CustomWords;
