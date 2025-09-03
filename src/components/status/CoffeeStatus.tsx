'use client';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export default function CoffeeStatus({
  status,
  loading,
}: {
  status: 'new'|'preparing'|'ready'|'served'|'cancelled';
  loading?: boolean;
}) {
  const reduce = useReducedMotion();
  const isMaking = loading || status === 'new' || status === 'preparing';
  const isReady = status === 'ready';

  return (
    <div className="flex items-center justify-center py-6">
      <svg width="180" height="180" viewBox="0 0 140 140" aria-hidden>
        {/* tasse */}
        <rect x="25" y="50" width="80" height="50" rx="8"
          fill="none" stroke="#111" strokeWidth="3" />
        {/* anse */}
        <path d="M105,60 c14,0 14,30 0,30"
          fill="none" stroke="#111" strokeWidth="3" />

        <defs>
          <clipPath id="cupClip">
            <rect x="25" y="50" width="80" height="50" rx="8" />
          </clipPath>
        </defs>

        {/* niveau de café */}
        <AnimatePresence>
          <motion.rect
            key={isReady ? 'full' : 'filling'}
            x="25" width="80" height="50" clipPath="url(#cupClip)"
            fill="#111"
            initial={{ y: 100 }}
            animate={{
              y: reduce
                ? 60
                : isMaking
                ? [90, 70, 85, 75, 80] // oscillation subtile = spinner
                : 60,                  // plein visible sous le bord
            }}
            transition={{
              duration: reduce ? 0 : isMaking ? 1.6 : 0.5,
              ease: [0.22,0.61,0.36,1],
              repeat: isMaking ? Infinity : 0,
            }}
          />
        </AnimatePresence>

        {/* vapeur */}
        {[0,1,2].map((i) => (
          <motion.path
            key={i}
            d={`M${50 + i*12},45 c 4,-6 8,0 12,-6`}
            stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: isReady ? 1 : 0.8, y: -2 }}
            transition={{ duration: reduce ? 0 : 0.6, repeat: isMaking ? Infinity : 0, repeatType: "reverse" }}
          />
        ))}

        {/* check quand prêt (dessiné dans le café) */}
        {isReady && (
          <motion.path
            d="M45 95 l10 10 l25 -25"
            fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.5, delay: 0.2 }}
            clipPath="url(#cupClip)"
          />
        )}
      </svg>
    </div>
  );
}
