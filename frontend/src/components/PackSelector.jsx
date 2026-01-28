import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function PackSelector({ onSelectPacks, selectedPackIds = [] }) {
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/packs')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setPacks(data.packs);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando packs:', err);
        setLoading(false);
      });
  }, []);

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

  if (loading) {
    return <div className="text-space-cyan text-center">Cargando packs...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-space-cyan">
          Selecciona uno o más packs de palabras
        </label>
        <button
          onClick={handleSelectAll}
          className="text-xs text-space-cyan hover:text-space-cyan/80 underline"
        >
          {selectedPackIds.length === packs.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {packs.map((pack) => {
          const isSelected = selectedPackIds.includes(pack._id);
          return (
            <motion.button
              key={pack._id}
              onClick={() => handlePackToggle(pack._id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-4 rounded-lg border-2 transition-all relative ${
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
                  {pack.name}
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
          {selectedPackIds.length} pack{selectedPackIds.length !== 1 ? 's' : ''} seleccionado{selectedPackIds.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

export default PackSelector;
