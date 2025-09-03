import { motion } from 'framer-motion';

export default function StepDots({ total, index }: { total: number; index: number }) {
  return (
    <div className="flex items-center justify-center gap-2 my-4">
      {Array.from({ length: total }).map((_, i) => {
        const active = i === index;
        return (
          <motion.span
            key={i}
            layout
            className="inline-block rounded-full"
            animate={{
              backgroundColor: active ? '#111111' : '#d1d5db',
              width: active ? 8 : 6,
              height: active ? 8 : 6,
            }}
            transition={{ duration: 0.18 }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
