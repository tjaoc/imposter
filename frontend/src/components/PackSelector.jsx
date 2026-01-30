import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE } from '../config/env';

const PACK_ICONS = {
  'cine-series': '🎬',
  'deportes': '⚽',
  'viajes-lugares': '✈️',
  'comida-bebida': '🍕',
  'animales': '🐾',
  'tecnologia': '💻',
  'musica': '🎵',
  'profesiones': '💼',
  'naturaleza-clima': '🌿',
  'ciencia': '🔬',
  'historia': '📜',
  'arte-cultura': '🎨',
  'moda': '👗',
  'videojuegos': '🎮',
  'hogar': '🏠',
  'transporte': '🚗',
  'salud-cuerpo': '💪',
  'adultos': '🔞',
  'personalizado': '✏️',
};

const RANDOM_ID = 'random';

function PackSelector({ onSelectPacks, selectedPackIds = [], allowRandom = true }) {
  const { t } = useTranslation();
  const { locale } = useLanguage();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  const loadPacks = useCallback(() => {
    setServerError(false);
    setLoading(true);
    fetch(`${API_BASE}/api/packs?locale=${locale}`)
      .then((res) => {
        if (!res.ok && res.status === 502) {
          setServerError(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.ok) {
          const list = (data.packs || []).filter((p) => p.slug !== 'personalizado');
          setPacks(list);
        } else if (data === null) setPacks([]);
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

  const isRandomSelected = selectedPackIds.includes(RANDOM_ID);

  const handlePackToggle = (packId) => {
    if (packId === RANDOM_ID) {
      onSelectPacks(isRandomSelected ? [] : [RANDOM_ID]);
      return;
    }
    if (isRandomSelected) return;
    const newSelected = selectedPackIds.includes(packId)
      ? selectedPackIds.filter((id) => id !== packId)
      : [...selectedPackIds, packId];
    onSelectPacks(newSelected);
  };

  const handleSelectAll = () => {
    if (isRandomSelected) {
      onSelectPacks([]);
      return;
    }
    if (selectedPackIds.length === packs.length) {
      onSelectPacks([]);
    } else {
      onSelectPacks(packs.map((p) => p._id));
    }
  };

  if (loading && packs.length === 0) {
    return (
      <div className="text-space-cyan text-center">{t('common.loading')}</div>
    );
  }

  if (serverError) {
    return (
      <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 text-center space-y-3">
        <p className="text-amber-200 text-sm">
          {t('common.serverUnavailable')}
        </p>
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

  const canStart = isRandomSelected || selectedPackIds.length > 0;
  const selectAllLabel =
    isRandomSelected
      ? t('room.deselectAll')
      : selectedPackIds.length === packs.length
        ? t('room.deselectAll')
        : t('room.selectAll');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-space-cyan">
          {t('room.selectPacksLabel')}
        </label>
        <button
          type="button"
          onClick={handleSelectAll}
          className="min-h-[48px] px-3 flex items-center text-sm text-space-cyan hover:text-space-cyan/80 underline active:opacity-80"
        >
          {selectAllLabel}
        </button>
      </div>
      {allowRandom && (
        <motion.button
          type="button"
          onClick={() => handlePackToggle(RANDOM_ID)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full min-h-[52px] p-4 rounded-xl border-2 transition-all relative text-left active:scale-[0.98] flex items-center gap-3 ${
            isRandomSelected
              ? 'border-space-cyan bg-space-cyan/20'
              : 'border-space-blue bg-space-blue hover:border-space-cyan/50'
          }`}
        >
          <span className="text-2xl">🎲</span>
          <span className="font-semibold text-white">
            {t('room.randomCategory')}
          </span>
          {isRandomSelected && (
            <div className="absolute top-2 right-2 text-space-cyan text-xl">✓</div>
          )}
        </motion.button>
      )}
      <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isRandomSelected ? 'pointer-events-none opacity-60' : ''}`}>
        {packs.map((pack) => {
          const isSelected = selectedPackIds.includes(pack._id);
          const icon = PACK_ICONS[pack.slug] ?? '📦';
          return (
            <motion.button
              key={pack._id}
              type="button"
              onClick={() => handlePackToggle(pack._id)}
              disabled={isRandomSelected}
              whileHover={isRandomSelected ? undefined : { scale: 1.02 }}
              whileTap={isRandomSelected ? undefined : { scale: 0.98 }}
              className={`min-h-[52px] p-4 rounded-xl border-2 transition-all relative text-left active:scale-[0.98] flex items-center gap-2 ${
                isSelected
                  ? 'border-space-cyan bg-space-cyan/20'
                  : 'border-space-blue bg-space-blue hover:border-space-cyan/50'
              }`}
            >
              <span className="text-xl flex-shrink-0">{icon}</span>
              <div className="text-left min-w-0 flex-1">
                <div className="font-semibold text-white truncate">
                  {(t('packs.' + pack.slug) || '').startsWith('packs.')
                    ? pack.name
                    : t('packs.' + pack.slug)}
                  {pack.isAdult && <span className="ml-1 text-xs">🔞</span>}
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 text-space-cyan text-xl flex-shrink-0">✓</div>
              )}
            </motion.button>
          );
        })}
      </div>
      {canStart && (
        <p className="text-sm text-gray-400 text-center mt-2">
          {isRandomSelected
            ? t('room.randomCategorySelected')
            : `${selectedPackIds.length} ${t('room.packsSelected')}`}
        </p>
      )}
    </div>
  );
}

export default PackSelector;
