import { Category } from '@/types/menu';
import { cn } from '@/lib/utils';

type DrinkListProps = {
  categories: Category[];
  getCount: (id: string) => number;  // retourne 0 si non sélectionné
  onInc: (id: string) => void;
  onDec: (id: string) => void;
};

export default function DrinkList({
  categories,
  getCount,
  onInc,
  onDec,
}: DrinkListProps) {
  return (
    <div className="space-y-10 pb-24 font-sans">
      {categories.map(cat => (
        <section key={cat.id}>
          <h2 className="mb-4 text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500">
            {cat.name}
          </h2>
          <div className="space-y-2">
            {cat.items.map(item => {
              const count = getCount(item.id);
              return (
                <div
                  key={item.id}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 hover:border-gray-300 transition bg-white text-black"
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "inline-block h-3 w-3 rounded-full border",
                      count > 0 ? "bg-black border-black" : "bg-white border-gray-300"
                    )} />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      {item.description && <div className="text-xs text-neutral-500">{item.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDec(item.id)}
                        disabled={count === 0}
                        className="h-8 w-8 border rounded-md disabled:opacity-40 hover:bg-gray-50"
                        aria-label="Decrease"
                      >−</button>
                      <div className="min-w-[2ch] text-center tabular-nums">{count || 0}</div>
                      <button
                        onClick={() => onInc(item.id)}
                        className="h-8 w-8 border rounded-md hover:bg-gray-50"
                        aria-label="Increase"
                      >+</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
