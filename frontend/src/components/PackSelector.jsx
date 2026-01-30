import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from '../config/env';

function PackSelector({ onSelectPacks, selectedPackIds = [] }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  const loadPacks = useCallback(() => {
    setServerError(false);
    setLoading(true);
    fetch(`${API_BASE}/api/packs?locale=${locale}`)
      .then(res => {
        if (!res.ok && res.status === 502) {
          setServerError(true);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data?.ok) setPacks(data.packs);
        else if (data === null) setPacks([]);
        setLoading(false);
      })
      .catch(() => {
        setServerError(true);
        setPacks([]);
        setLoading(false);
      });
  }, [locale]);

  useEffect(() => {
    loadPacks();
  }, [loadPacks]);

  const handlePackToggle = (packId) => {
    const newSelected = selectedPackIds.includes(packId)
      ? selectedPackIds.filter(id => id !== packId)
      : [...selectedPackIds, packId];
    onSelectPacks(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPackIds.length === packs.length) {
      onSelectPacks([]);
    } else {
      onSelectPacks(packs.map(p => p._id));
    }
  };

  if (loading && packs.length === 0) {
    return <div className="text-space-cyan text-center">{t('common.loading')}</div>;
  }

  if (serverError) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-center space-y-3">
        <p className="text-amber-200 text-sm">{t('common.serverUnavailable')}</p>
        <button
          type="button"
          onClick={() => loadPacks()}
          className="min-h-[48px] px-4 py-3 rounded-xl bg-space-cyan text-space-navy font-medium hover:bg-space-cyan/90 active:scale-[0.98]"
        >
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-space-cyan">
          {t('room.selectPacksLabel')}
        </label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="min-h-[44px] px-2 text-xs sm:text-sm text-space-cyan hover:text-space-cyan/80 underline touch-ignore"
        >
          {selectedPackIds.length === packs.length ? t('room.deselectAll') : t('room.selectAll')}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {packs.map((pack) => {
          const isSelected = selectedPackIds.includes(pack._id);
          return (
            <motion.button
              key={pack._id}
              type="button"
              onClick={() => handlePackToggle(pack._id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`min-h-[52px] p-4 rounded-xl border-2 transition-all relative text-left active:scale-[0.98] ${
                isSelected
                  ? 'border-space-cyan bg-space-cyan/20'
                  : 'border-space-blue bg-space-blue hover:border-space-cyan/50'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-space-cyan text-xl">✓</div>
              )}
              <div className="text-left">
                <div className="font-semibold text-white mb-1">
                  {(t('packs.' + pack.slug) || '').startsWith('packs.') ? pack.name : t('packs.' + pack.slug)}
                  {pack.isAdult && <span className="ml-2 text-xs">🔞</span>}
                </div>
                <div className="text-xs text-gray-400">{pack.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
      {selectedPackIds.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          {selectedPackIds.length} {t('room.packsSelected')}
        </p>
      )}
    </div>
  );
}

export default PackSelector;
