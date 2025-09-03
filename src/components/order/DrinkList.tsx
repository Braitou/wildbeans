import { Category } from '@/types/menu';

export default function DrinkList({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId?: string | null;
  onSelect: (itemId: string) => void;
}) {
  return (
    <div className="space-y-10 pb-24 font-sans">
      {categories.map(cat => (
        <section key={cat.id}>
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500">
            {cat.name}
          </h2>
          <div className="divide-y divide-gray-200 border-y border-gray-200">
            {cat.items.map(it => {
              const active = selectedId === it.id;
              return (
                <button
                  key={it.id}
                  onClick={() => onSelect(it.id)}
                  className={`w-full text-left py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-black hover:bg-gray-50`}
                >
                  <div className="flex items-center gap-3">
                    {/* puce sélection */}
                    <span
                      className={`inline-block size-3 rounded-full border ${
                        active ? 'bg-black border-black' : 'border-gray-300'
                      }`}
                      aria-hidden
                    />
                    <span className="text-[15px] font-semibold tracking-wide uppercase">
                      {it.name}
                    </span>
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
