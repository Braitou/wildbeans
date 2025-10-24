'use client';

type DrinkItem = {
  id: string;
  name: string;
  category: string;
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
    <div className="space-y-12">
      {categories.map((category) => (
        <div key={category.id}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-500">
            {category.id === 'coffee' ? '☕ ' : '🍵 '}
            {category.name.toUpperCase()}
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {category.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectDrink(item)}
                className={`
                  aspect-square rounded flex items-center justify-center
                  text-white font-semibold uppercase text-sm tracking-wide
                  transition-all duration-150 hover:scale-105 hover:shadow-xl
                  active:scale-95 p-4 text-center
                  ${item.category === 'coffee' 
                    ? 'bg-[#706D54] hover:bg-[#5f5c48]' 
                    : 'bg-[#A08963] hover:bg-[#8f7858]'
                  }
                `}
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

