import { Modifier } from '@/types/menu';
import { motion } from 'framer-motion';

// Fonction pour traduire les labels en anglais
function translateLabel(label: string): string {
  const translations: Record<string, string> = {
    'Sirops': 'Syrups',
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
      <div className="flex flex-col gap-2">
        {modifier.options.map(opt => {
          const active = valueSingle === opt.id;
          return (
            <motion.label
              key={opt.id}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-3 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
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
              <span className="text-sm">{translateLabel(opt.name).toUpperCase()}</span>
            </motion.label>
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
    <div className="flex flex-col gap-2">
      {/* Options en colonne */}
      {modifier.options.map(opt => {
        const active = selected.has(opt.id);
        return (
          <motion.label
            key={opt.id}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              className="size-4"
              checked={active}
              onChange={(e) => {
                const next = new Set(valueMulti ?? []);
                if (e.target.checked) next.add(opt.id);
                else next.delete(opt.id);
                onChange(Array.from(next));
              }}
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
            <span className="text-sm">{translateLabel(opt.name).toUpperCase()}</span>
          </motion.label>
        );
      })}
      
      {/* Bouton "None" pour les groupes multi optionnels (en dernier, pré-sélectionné par défaut) */}
      {isOptionalMulti && (
        <motion.label
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-3 py-3 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
        >
          <input
            type="radio"
            name={`${modifier.id}-none`}
            className="size-4"
            checked={isNoneSelected}
            onChange={() => onChange([])}
          />
          {/* puce visuelle animée */}
          <motion.span
            layout
            className={`inline-block size-3 rounded-full border ${
              isNoneSelected ? 'bg-black border-black' : 'border-gray-300'
            }`}
            animate={{ scale: isNoneSelected ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            aria-hidden
          />
          <span className="text-sm italic">NONE</span>
        </motion.label>
      )}
    </div>
  );
}
