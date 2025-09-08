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

      {/* GIF animation area */}
      <div className="mt-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="flex items-center justify-center"
          >
            <StatusGif status={status} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ----------------------------- UI PARTS ------------------------------ */

function StatusGif({ status }: { status: OrderStatus }) {
  const getGifSrc = () => {
    switch (status) {
      case 'NEW':
        return '/gifs/sent.gif';
      case 'PREPARING':
        return '/gifs/preparing.gif';
      case 'READY':
      case 'SERVED':
        return '/gifs/ready.gif';
      case 'CANCELLED':
        return '/gifs/sent.gif'; // Fallback pour les commandes annulées
      default:
        return '/gifs/sent.gif';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <img
        src={getGifSrc()}
        alt={`Status: ${status}`}
        className="w-[200px] h-[150px] object-contain"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  );
}
