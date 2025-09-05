// components/confirm/CoffeeConfirm.tsx
'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function CoffeeConfirm({
  show,
  onDone,
  duration = 1100,
}: { show: boolean; onDone?: () => void; duration?: number }) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => {
            // petite tempo pour laisser finir l’anim
            setTimeout(() => onDone?.(), 120);
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.25 }}
            aria-label="Order confirmed"
            role="status"
          >
            <svg width="140" height="140" viewBox="0 0 140 140" aria-hidden>
              {/* tasse */}
              <motion.rect
                x="25" y="50" width="80" height="50" rx="8"
                fill="none" stroke="#111" strokeWidth="3"
              />
              {/* anse */}
              <motion.path
                d="M105,60 c14,0 14,30 0,30"
                fill="none" stroke="#111" strokeWidth="3"
              />
              {/* niveau (mask) */}
              <defs>
                <clipPath id="cupClip">
                  <rect x="25" y="50" width="80" height="50" rx="8" />
                </clipPath>
              </defs>
              <motion.rect
                x="25" y="100" width="80" height="50" clipPath="url(#cupClip)"
                fill="#111"
                initial={{ y: 100 }}
                animate={{ y: reduce ? 80 : 60 }} // se “remplit”
                transition={{ duration: reduce ? 0 : duration/1000, ease: [0.22,0.61,0.36,1] }}
              />
              {/* vapeur (petites vagues qui montent) */}
              {[0, 1, 2].map((i) => (
                <motion.path
                  key={i}
                  d={`M${50 + i*12},45 c 4,-6 8,0 12,-6`}
                  stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: -2 }}
                  transition={{ delay: 0.1 + i*0.1, duration: reduce ? 0 : 0.6, repeat: 1, repeatType: "reverse" }}
                />
              ))}
              {/* check subtil */}
              <motion.path
                d="M45 95 l10 10 l25 -25"
                fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.35, duration: reduce ? 0 : 0.4 }}
                clipPath="url(#cupClip)"
              />
            </svg>
            <div className="mt-3 text-center text-sm tracking-[0.14em] uppercase text-black">
              ORDER SENT
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
