'use client';
import { cn } from '@/lib/utils';

type TrayItem = {
  id: string;           // itemId (uuid)
  name: string;         // ex "Latte"
  complete: boolean;    // toutes les options requises sont remplies ?
};

export default function OrderTray({
  items,
  activeIndex,
  onSelectIndex,
  onRemoveIndex,
  onAddNew,
}: {
  items: TrayItem[];
  activeIndex: number;
  onSelectIndex: (i: number) => void;
  onRemoveIndex: (i: number) => void;
  onAddNew: () => void;
}) {
  return (
    <div className="sticky top-0 z-20 bg-white py-3 border-b border-gray-200 mb-3">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {items.map((it, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={i}
              onClick={() => onSelectIndex(i)}
              className={cn(
                "flex items-center gap-2 px-3 h-9 rounded-full border",
                active ? "border-black bg-black text-white" : "border-gray-300 bg-white"
              )}
              title={it.name}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border border-current text-[11px]">
                {i + 1}
              </span>
              <span className="text-sm">{it.name}</span>
              {it.complete ? <span className="text-[11px] opacity-80">✓</span> : null}
              <span
                onClick={(e) => { e.stopPropagation(); onRemoveIndex(i); }}
                className="ml-1 text-[12px] opacity-70 hover:opacity-100"
                aria-label="Supprimer"
                title="Supprimer"
              >
                🗑
              </span>
            </button>
          );
        })}
        <button
          onClick={onAddNew}
          className="ml-2 h-9 px-3 rounded-full border border-gray-300 hover:bg-gray-50"
        >
          + Ajouter une boisson
        </button>
      </div>
    </div>
  );
}
