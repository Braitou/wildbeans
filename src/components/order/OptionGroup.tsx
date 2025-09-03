import { Modifier } from '@/types/menu';
import { motion } from 'framer-motion';

export default function OptionGroup({
  modifier,
  valueSingle,
  valueMulti,
  onChange,
}: {
  modifier: Modifier;
  valueSingle?: string | null;
  valueMulti?: string[];
  onChange: (next: string | string[]) => void;
}) {
  if (modifier.type === 'single') {
    return (
      <div className="space-y-1">
        {modifier.options.map(opt => {
          const active = valueSingle === opt.id;
          return (
            <motion.label
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="radio"
                name={modifier.id}
                className="size-4"
                checked={active}
                onChange={() => onChange(opt.id)}
              />
              {/* puce visuelle animée */}
              <motion.span
                layout
                className={`inline-block size-3 rounded-full border ${
                  active ? 'bg-black border-black' : 'border-gray-300'
                }`}
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                aria-hidden
              />
              <span className="text-[15px]">{opt.name}</span>
            </motion.label>
          );
        })}
      </div>
    );
  }

  // multi
  const set = new Set(valueMulti ?? []);
  return (
    <div className="flex flex-wrap gap-8 py-2">
      {modifier.options.map(opt => {
        const active = set.has(opt.id);
        return (
          <motion.button
            key={opt.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              const next = new Set(valueMulti ?? []);
              if (next.has(opt.id)) next.delete(opt.id);
              else next.add(opt.id);
              onChange(Array.from(next));
            }}
            className={`flex items-center gap-2 h-10 px-4 rounded-full border transition ${
              active
                ? 'border-black bg-black text-white'
                : 'border-gray-200 text-black hover:bg-gray-50'
            }`}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <motion.span
              layout
              className={`inline-block rounded-full`}
              style={{ width: active ? 6 : 4, height: active ? 6 : 4 }}
              animate={{ backgroundColor: active ? '#ffffff' : '#d1d5db' }}
              aria-hidden
            />
            <span>{opt.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
