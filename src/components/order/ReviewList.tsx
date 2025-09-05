'use client';

type ReviewItem = {
  name: string;
  options: { group: string; values: string[] }[];
};

export default function ReviewList({
  items,
  onEditIndex,
  onRemoveIndex,
  onAddNew,
}: {
  items: ReviewItem[];
  onEditIndex: (i: number) => void;
  onRemoveIndex: (i: number) => void;
  onAddNew: () => void;
}) {
  return (
    <section className="py-4 space-y-4">
      {items.map((it, i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[15px] font-semibold uppercase">Drink {i + 1} — {it.name}</div>
              <ul className="mt-1 text-sm text-neutral-700 list-disc pl-4">
                {it.options.map((g, idx) => (
                  <li key={idx}>
                    <span className="uppercase">{g.group}</span>: <span className="uppercase">{g.values.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <button className="underline uppercase" onClick={() => onEditIndex(i)}>Edit</button>
              <button className="underline opacity-80 uppercase" onClick={() => onRemoveIndex(i)}>Remove</button>
            </div>
          </div>
        </div>
      ))}
      <div>
        <button
          onClick={onAddNew}
          className="h-11 px-4 rounded-md border border-gray-300 hover:bg-gray-50 uppercase"
        >
          <span className="uppercase">+ Add a drink</span>
        </button>
      </div>
    </section>
  );
}
