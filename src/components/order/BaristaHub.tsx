'use client';

type ModifierOption = {
  id: string;
  name: string;
};

type Modifier = {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required: boolean;
  options: ModifierOption[];
};

type DrinkItem = {
  id: string;
  name: string;
  category: string;
  modifiers: Modifier[];
};

type Category = {
  id: string;
  name: string;
  items: DrinkItem[];
};

interface BaristaHubProps {
  categories: Category[];
  onSelectDrink: (drink: DrinkItem) => void;
}

export default function BaristaHub({ categories, onSelectDrink }: BaristaHubProps) {
  return (
    <div className="space-y-6">
      {categories.map((category) => (
        <div key={category.id}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                  {category.name.toUpperCase()}
                </h2>
          
          {/* Optimisé pour iPad mini landscape: 5 colonnes, cartes compactes et tactiles */}
          <div className="grid grid-cols-5 gap-2">
            {category.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectDrink(item)}
                className={`
                  aspect-square rounded flex items-center justify-center
                  text-white font-bold uppercase text-[0.65rem] tracking-wide
                  transition-all duration-150 active:scale-95
                  p-2 text-center leading-tight
                  touch-manipulation
                  ${item.category === 'coffee' 
                    ? 'bg-[#706D54] active:bg-[#5f5c48]' 
                    : 'bg-[#A08963] active:bg-[#8f7858]'
                  }
                `}
                style={{ minHeight: '70px' }}
              >
                {item.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

