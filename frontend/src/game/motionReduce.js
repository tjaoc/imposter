import { useReducedMotion } from 'framer-motion';

export function useMotionReduce () {
  return useReducedMotion() ?? false;
}

/** Transición: instantánea si el usuario pide menos movimiento */
export function tx (reduce, normal) {
  return reduce ? { duration: 0 } : normal;
}

/** whileHover / whileTap desactivados con prefers-reduced-motion (menos layout en el hilo principal) */
export function motionGestures (reduce, { hover = 1.02, tap = 0.98 } = {}) {
  if (reduce) return {};
  return {
    whileHover: { scale: hover },
    whileTap: { scale: tap },
  };
}
