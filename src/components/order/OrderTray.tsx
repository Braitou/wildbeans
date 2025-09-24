'use client';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

type TrayItem = {
  id: string;           // tempId (uuid)
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
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap snap-x snap-mandatory no-scrollbar">
        {items.map((it, i) => {
          const active = i === activeIndex;
          return (
            <div
              key={it.id}
              className={cn(
                "inline-flex items-center gap-2 px-3 py-2 h-9 rounded-none border shrink-0 cursor-pointer",
                active ? "border-black bg-black text-white" : "border-gray-300 bg-white"
              )}
              title={it.name}
            >
              <div
                onClick={() => onSelectIndex(i)}
                className="inline-flex items-center gap-2 flex-1"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-none border border-current text-[11px]">
                  {i + 1}
                </span>
                <span className="max-w-[14ch] overflow-hidden text-ellipsis whitespace-nowrap text-sm">{it.name}</span>
                {it.complete ? <span className="text-[11px] opacity-80">✓</span> : null}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveIndex(i); }}
                className="ml-1 inline-flex items-center justify-center h-6 w-6 rounded-none border hover:bg-gray-50"
                aria-label="REMOVE"
                title="REMOVE"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <button
          onClick={onAddNew}
          className="ml-2 h-9 px-3 rounded-none border border-gray-300 hover:bg-gray-50 text-xs sm:text-sm leading-tight shrink-0"
        >
          ADD A DRINK
        </button>
      </div>
    </div>
  );
}
