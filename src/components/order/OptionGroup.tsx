import { Modifier } from '@/types/menu';
import { motion } from 'framer-motion';

// Function to translate labels to English
function translateLabel(label: string): string {
  const translations: Record<string, string> = {
    'Sirops': 'Syrups',
    'sirops': 'Syrups',
    'Choix du lait': 'Type of milk',
    'choix du lait': 'Type of milk',
    'Toppings': 'Toppings',
  };
  return translations[label] || label;
}

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
      <div className="flex flex-col gap-2 list-none pl-0">
        {modifier.options.map(opt => {
          const active = valueSingle === opt.id;
          return (
            <motion.div
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              className="py-3 border-b border-gray-200 hover:bg-gray-50"
            >
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="radio"
                  name={modifier.id}
                  checked={active}
                  onChange={() => onChange(opt.id)}
                  className="peer sr-only"
                />
                {/* Custom square marker */}
                <motion.span
                  layout
                  aria-hidden="true"
                  className="
                    h-4 w-4
                    border border-black
                    bg-white
                    rounded-none
                    inline-block
                    peer-checked:bg-black
                    peer-disabled:opacity-40
                    peer-focus-visible:outline
                    peer-focus-visible:outline-2
                    peer-focus-visible:outline-offset-2
                    peer-focus-visible:outline-black
                  "
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                />
                {/* Label text */}
                <span className="leading-5 text-sm">{translateLabel(opt.name).toUpperCase()}</span>
              </label>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // multi
  const selected = new Set(valueMulti ?? []);
  const isOptionalMulti = modifier.type === 'multi' && !modifier.required;
  const isNoneSelected = (valueMulti?.length ?? 0) === 0;
  
  return (
    <div className="flex flex-col gap-2 list-none pl-0">
      {/* Options en colonne */}
      {modifier.options.map(opt => {
        const active = selected.has(opt.id);
        return (
          <motion.div
            key={opt.id}
            whileTap={{ scale: 0.98 }}
            className="py-3 border-b border-gray-200 hover:bg-gray-50"
          >
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => {
                  const next = new Set(valueMulti ?? []);
                  if (e.target.checked) next.add(opt.id);
                  else next.delete(opt.id);
                  onChange(Array.from(next));
                }}
                className="peer sr-only"
              />
              {/* Custom square marker */}
              <motion.span
                layout
                aria-hidden="true"
                className="
                  h-4 w-4
                  border border-black
                  bg-white
                  rounded-none
                  inline-block
                  peer-checked:bg-black
                  peer-disabled:opacity-40
                  peer-focus-visible:outline
                  peer-focus-visible:outline-2
                  peer-focus-visible:outline-offset-2
                  peer-focus-visible:outline-black
                "
                animate={{ scale: active ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              />
              {/* Label text */}
              <span className="leading-5 text-sm">{translateLabel(opt.name).toUpperCase()}</span>
            </label>
          </motion.div>
        );
      })}
      
      {/* "None" button for optional multi groups (last, pre-selected by default) */}
      {isOptionalMulti && (
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="py-3 border-b border-gray-200 hover:bg-gray-50"
        >
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="radio"
              name={`${modifier.id}-none`}
              checked={isNoneSelected}
              onChange={() => onChange([])}
              className="peer sr-only"
            />
            {/* Custom square marker */}
            <motion.span
              layout
              aria-hidden="true"
              className="
                h-4 w-4
                border border-black
                bg-white
                rounded-none
                inline-block
                peer-checked:bg-black
                peer-disabled:opacity-40
                peer-focus-visible:outline
                peer-focus-visible:outline-2
                peer-focus-visible:outline-offset-2
                peer-focus-visible:outline-black
              "
              animate={{ scale: isNoneSelected ? 1.15 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            />
            {/* Label text */}
            <span className="leading-5 text-sm italic">NONE</span>
          </label>
        </motion.div>
      )}
    </div>
  );
}
