'use client';
import { motion } from 'framer-motion';

export default function TopProgress({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="h-1 bg-black"
        initial={{ width: '0%' }}
        animate={{ width: `${clamped * 100}%` }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}
