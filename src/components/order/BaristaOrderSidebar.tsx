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

type OrderItem = {
  id: string;
  drink: DrinkItem;
  selections: Record<string, string | string[]>;
};

interface BaristaOrderSidebarProps {
  currentDrink: DrinkItem | null;
  currentSelections: Record<string, string | string[]>;
  orderItems: OrderItem[];
  submitting: boolean;
  onToggleOption: (modifierId: string, optionId: string, type: 'single' | 'multi') => void;
  onAddToOrder: () => void;
  onRemoveItem: (itemId: string) => void;
  onSubmitOrder: () => void;
  onClearOrder: () => void;
}

export default function BaristaOrderSidebar({
  currentDrink,
  currentSelections,
  orderItems,
  submitting,
  onToggleOption,
  onAddToOrder,
  onRemoveItem,
  onSubmitOrder,
  onClearOrder,
}: BaristaOrderSidebarProps) {
  
  const isSelected = (modifierId: string, optionId: string) => {
    const selection = currentSelections[modifierId];
    if (Array.isArray(selection)) {
      return selection.includes(optionId);
    }
    return selection === optionId;
  };

  const formatSelections = (drink: DrinkItem, selections: Record<string, string | string[]>) => {
    const lines: string[] = [];
    
    drink.modifiers.forEach(modifier => {
      const selection = selections[modifier.id];
      if (!selection || (Array.isArray(selection) && selection.length === 0)) return;

      if (Array.isArray(selection)) {
        const names = selection
          .map(id => modifier.options.find(opt => opt.id === id)?.name)
          .filter(Boolean);
        if (names.length > 0) {
          lines.push(`• ${names.join(', ')}`);
        }
      } else {
        const option = modifier.options.find(opt => opt.id === selection);
        if (option) {
          lines.push(`• ${option.name}`);
        }
      }
    });

    return lines;
  };

  return (
    <div className="w-[380px] bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-base font-bold uppercase tracking-wide">
          📋 COMMANDE
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Configuration de la boisson actuelle */}
        {currentDrink && (
          <div className="mb-6 pb-6 border-b-2 border-gray-200">
            <h3 className="text-lg font-bold uppercase mb-4 text-[#706D54]">
              {currentDrink.name.toUpperCase()}
            </h3>

            {currentDrink.modifiers.map((modifier) => (
              <div key={modifier.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {modifier.name.toUpperCase()}
                  </span>
                  {modifier.required && (
                    <span className="bg-red-500 text-white text-[0.6rem] px-1.5 py-0.5 rounded font-bold">
                      REQUIS
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {modifier.options.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => onToggleOption(modifier.id, option.id, modifier.type)}
                      className={`
                        px-3 py-2 text-xs font-bold uppercase tracking-wide
                        border-2 rounded transition-all touch-manipulation
                        ${isSelected(modifier.id, option.id)
                          ? 'bg-[#706D54] text-white border-[#706D54]'
                          : 'bg-white text-gray-700 border-gray-300 active:bg-gray-50'
                        }
                      `}
                    >
                      {option.name.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={onAddToOrder}
              className="w-full py-3 bg-green-500 active:bg-green-600 text-white font-bold text-sm uppercase tracking-wide rounded transition-all touch-manipulation"
            >
              ✓ AJOUTER
            </button>
          </div>
        )}

        {/* Liste des boissons dans la commande */}
        {orderItems.length > 0 && (
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3">
              BOISSONS ({orderItems.length})
            </h3>

            {orderItems.map((item) => (
              <div
                key={item.id}
                className={`
                  mb-2 p-3 rounded
                  border-l-4
                  ${item.drink.category === 'coffee' 
                    ? 'bg-gray-50 border-[#706D54]' 
                    : 'bg-gray-50 border-[#A08963]'
                  }
                `}
              >
                <div className="font-bold text-xs uppercase mb-1.5">
                  {item.drink.name.toUpperCase()}
                </div>
                <div className="text-[0.7rem] text-gray-600 space-y-0.5">
                  {formatSelections(item.drink, item.selections).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="mt-2 px-2 py-1 bg-red-500 active:bg-red-600 text-white text-[0.7rem] font-bold uppercase rounded transition-all touch-manipulation"
                >
                  ✕ RETIRER
                </button>
              </div>
            ))}
          </div>
        )}

        {/* État vide */}
        {!currentDrink && orderItems.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">☕</div>
            <p className="font-semibold text-sm">Aucune boisson</p>
            <p className="text-xs">Tapez sur une boisson</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-gray-200 bg-gray-50">
        <div className="mb-3 font-bold uppercase text-sm">
          Total : {orderItems.length} boisson(s)
        </div>

        <div className="space-y-2">
          <button
            onClick={onSubmitOrder}
            disabled={orderItems.length === 0 || submitting}
            className="w-full py-3 bg-green-500 active:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-base uppercase tracking-wide rounded transition-all touch-manipulation"
          >
            {submitting ? 'ENREGISTREMENT...' : '✓ ENREGISTRER'}
          </button>

          <button
            onClick={onClearOrder}
            disabled={orderItems.length === 0}
            className="w-full py-2 bg-gray-200 active:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-bold text-xs uppercase tracking-wide rounded transition-all touch-manipulation"
          >
            ANNULER TOUT
          </button>
        </div>
      </div>
    </div>
  );
}

