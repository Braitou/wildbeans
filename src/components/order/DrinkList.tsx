import { Category } from '@/types/menu';

export default function DrinkList({
  categories,
  selectedId,
  selectedIds,
  onSelect,
}: {
  categories: Category[];
  selectedId?: string | null;
  selectedIds?: Set<string>;
  onSelect: (itemId: string) => void;
}) {
  function isSelected(id: string) {
    return selectedIds ? selectedIds.has(id) : selectedId === id;
  }

  return (
    <div className="space-y-10 pb-24 font-sans">
      {categories.map(cat => (
        <section key={cat.id}>
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500">
            {cat.name}
          </h2>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {cat.items.map(it => {
              const active = isSelected(it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => onSelect(it.id)}
                  className={`w-full text-left py-4 px-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all duration-200 ${
                    active 
                      ? 'bg-black text-white border-black' 
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* puce sélection */}
                      <span
                        className={`inline-block size-3 rounded-full border transition-colors ${
                          active ? 'bg-white border-white' : 'border-gray-300'
                        }`}
                        aria-hidden
                      />
                      <span className="text-[15px] font-semibold tracking-wide uppercase">
                        {it.name}
                      </span>
                    </div>
                    {active && (
                      <span className="text-xs uppercase tracking-wide opacity-80">Selected</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
