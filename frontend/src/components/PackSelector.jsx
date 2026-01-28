import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function PackSelector({ onSelectPack, selectedPackId }) {
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

  if (loading) {
    return <div className="text-space-cyan text-center">Cargando packs...</div>;
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-space-cyan mb-2">
        Selecciona un pack de palabras
      </label>
      <div className="grid grid-cols-2 gap-3">
        {packs.map((pack) => (
          <motion.button
            key={pack._id}
            onClick={() => onSelectPack(pack._id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedPackId === pack._id
                ? 'border-space-cyan bg-space-cyan/20'
                : 'border-space-blue bg-space-blue hover:border-space-cyan/50'
            }`}
          >
            <div className="text-left">
              <div className="font-semibold text-white mb-1">
                {pack.name}
                {pack.isAdult && <span className="ml-2 text-xs">🔞</span>}
              </div>
              <div className="text-xs text-gray-400">{pack.description}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default PackSelector;
