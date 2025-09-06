'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';

export function WaitingClientUI({
  status,
  statusMessage,
}: {
  status: OrderStatus;
  statusMessage?: string;
}) {
  // Convert status to progress (visual only)
  const progress = useMemo(() => {
    switch (status) {
      case 'NEW': return 0.25;
      case 'PREPARING': return 0.65;
      case 'READY':
      case 'SERVED': return 1;
      case 'CANCELLED': return 0;
      default: return 0.25;
    }
  }, [status]);

  return (
    <div className="flex flex-col items-center gap-6 py-10">
      {/* Tagline */}
      <p className="text-[11px] tracking-wide uppercase opacity-60">
        ALL GOOD… IT'S NOT IN YOUR HANDS ANYMORE
      </p>

      {/* Thin progress bar */}
      <div className="w-full max-w-xl">
        <div className="h-[3px] w-full rounded-none bg-neutral-200 overflow-hidden">
          <motion.div
            className="h-full bg-neutral-900"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round(progress * 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>

      {/* Status message (keep upstream text, pass it where you render this UI) */}
      {/* The upstream container should render the exact current status message just above/below this UI as it already does.
          If it is rendered inside here, keep its logic and simply place it here in bold: */}
      <div className="text-center">
        {/* Example: this <slot> will be replaced by the upstream-provided message if needed */}
        {/* Keep the EXACT existing status messages from the app */}
        {statusMessage && (
          <p className="text-[18px] font-semibold">
            {statusMessage}
          </p>
        )}
      </div>

      {/* Cup animation area */}
      <div className="mt-2">
        <AnimatePresence mode="wait">
          {status !== 'READY' ? (
            <motion.div
              key="single-cup"
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <CoffeeCup fillLevel={progress} steaming={status !== 'CANCELLED'} />
            </motion.div>
          ) : (
            <motion.div
              key="clink"
              className="flex items-center justify-center gap-3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <ClinkingCups />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ----------------------------- UI PARTS ------------------------------ */

function CoffeeCup({ fillLevel, steaming }: { fillLevel: number; steaming?: boolean }) {
  const level = Math.max(0, Math.min(1, fillLevel));

  return (
    <div className="relative w-[120px] h-[120px] text-neutral-900">
      {/* Steam */}
      {steaming && (
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 -top-1 w-16 h-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          <svg viewBox="0 0 64 32" className="w-full h-full">
            <motion.path
              d="M22,28 C18,20 28,16 26,8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0.2, opacity: 0.4 }}
              animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, repeat: Infinity }}
            />
            <motion.path
              d="M34,28 C30,20 40,16 38,8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0.2, opacity: 0.4 }}
              animate={{ pathLength: [0.2, 1, 0.2], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.2, delay: 0.4, repeat: Infinity }}
            />
          </svg>
        </motion.div>
      )}

      {/* Cup + liquid */}
      <svg viewBox="0 0 160 160" className="w-full h-full">
        {/* Handle */}
        <path d="M120,70 c22,0 22,32 0,32" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        {/* Body */}
        <path d="M30,60 h70 a4,4 0 0 1 4,4 v44 a12,12 0 0 1 -12,12 h-54 a12,12 0 0 1 -12,-12 v-44 a4,4 0 0 1 4,-4 z"
              fill="none" stroke="currentColor" strokeWidth="6" />
        {/* Liquid */}
        <mask id="cup-mask">
          <rect x="0" y="0" width="160" height="160" fill="white"/>
        </mask>
        <g mask="url(#cup-mask)">
          <motion.rect
            x="36"
            width="92"
            rx="8"
            initial={false}
            animate={{
              y: 108 - 40 * level,
              height: 40 * level + 4,
            }}
            transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            className="fill-current"
          />
        </g>
        {/* Saucer */}
        <ellipse cx="70" cy="122" rx="54" ry="6" className="fill-current" opacity="0.08" />
      </svg>

      {/* Gentle oscillation */}
      <motion.div
        className="absolute inset-0"
        initial={{ rotate: 0 }}
        animate={{ rotate: [-1.25, 1.25, -1.25] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function ClinkingCups() {
  return (
    <div className="relative w-[200px] h-[120px] text-neutral-900">
      <motion.div
        className="absolute left-8 top-2"
        initial={{ rotate: -10, y: 10 }}
        animate={{ rotate: [-8, -12, -8], y: [10, 8, 10] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <MiniCup />
      </motion.div>
      <motion.div
        className="absolute right-8 top-2"
        initial={{ rotate: 10, y: 10 }}
        animate={{ rotate: [8, 12, 8], y: [10, 8, 10] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
      >
        <MiniCup mirrored />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-8 -translate-x-1/2"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 0.8 }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 2 v4 M12 18 v4 M2 12 h4 M18 12 h4 M4.5 4.5 l2.8 2.8 M16.7 16.7 l2.8 2.8 M4.5 19.5 l2.8-2.8 M16.7 7.3 l2.8-2.8"
            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        </svg>
      </motion.div>
    </div>
  );
}

function MiniCup({ mirrored }: { mirrored?: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className={`w-16 h-16 ${mirrored ? 'scale-x-[-1]' : ''}`}>
      <path d="M44,26 c14,0 14,12 0,12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      <path d="M12,22 h26 a3,3 0 0 1 3,3 v18 a8,8 0 0 1 -8,8 h-16 a8,8 0 0 1 -8,-8 v-18 a3,3 0 0 1 3,-3 z"
            fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="16" y="34" width="22" height="8" className="fill-current" opacity="0.2" />
    </svg>
  );
}
