'use client';

type DrinkItem = {
  id: string;
  name: string;
  category: string;
};

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

type OrderItem = {
  id: string;
  drink: DrinkItem;
  selections: Record<string, string | string[]>;
};

interface BaristaOrderSidebarProps {
  currentDrink: DrinkItem | null;
  currentSelections: Record<string, string | string[]>;
  orderItems: OrderItem[];
  modifiers: Modifier[];
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
  modifiers,
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

  const formatSelections = (selections: Record<string, string | string[]>) => {
    const lines: string[] = [];
    
    modifiers.forEach(modifier => {
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
    <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-bold uppercase tracking-wide">
          📋 COMMANDE EN COURS
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Configuration de la boisson actuelle */}
        {currentDrink && (
          <div className="mb-8 pb-8 border-b-2 border-gray-200">
            <h3 className="text-xl font-bold uppercase mb-6 text-[#706D54]">
              {currentDrink.name.toUpperCase()}
            </h3>

            {modifiers.map((modifier) => (
              <div key={modifier.id} className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {modifier.name.toUpperCase()}
                  </span>
                  {modifier.required && (
                    <span className="bg-red-500 text-white text-[0.65rem] px-2 py-0.5 rounded font-bold">
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
                        px-4 py-2 text-sm font-medium uppercase tracking-wide
                        border-2 rounded transition-all
                        ${isSelected(modifier.id, option.id)
                          ? 'bg-[#706D54] text-white border-[#706D54]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
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
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-base uppercase tracking-wide rounded transition-opacity"
            >
              ✓ AJOUTER À LA COMMANDE
            </button>
          </div>
        )}

        {/* Liste des boissons dans la commande */}
        {orderItems.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
              BOISSONS ({orderItems.length})
            </h3>

            {orderItems.map((item) => (
              <div
                key={item.id}
                className={`
                  mb-3 p-4 rounded
                  border-l-4
                  ${item.drink.category === 'coffee' 
                    ? 'bg-gray-50 border-[#706D54]' 
                    : 'bg-gray-50 border-[#A08963]'
                  }
                `}
              >
                <div className="font-bold text-sm uppercase mb-2">
                  {item.drink.name.toUpperCase()}
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  {formatSelections(item.selections).map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="mt-3 px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase rounded transition-opacity"
                >
                  ✕ RETIRER
                </button>
              </div>
            ))}
          </div>
        )}

        {/* État vide */}
        {!currentDrink && orderItems.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-6xl mb-4">☕</div>
            <p className="font-semibold">Aucune boisson</p>
            <p className="text-sm">Cliquez sur une boisson pour commencer</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t-2 border-gray-200 bg-gray-50">
        <div className="mb-4 font-bold uppercase text-base">
          Total : {orderItems.length} boisson(s)
        </div>

        <div className="space-y-3">
          <button
            onClick={onSubmitOrder}
            disabled={orderItems.length === 0 || submitting}
            className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg uppercase tracking-wide rounded transition-opacity"
          >
            {submitting ? 'ENREGISTREMENT...' : '✓ ENREGISTRER LA COMMANDE'}
          </button>

          <button
            onClick={onClearOrder}
            disabled={orderItems.length === 0}
            className="w-full py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-700 font-bold text-sm uppercase tracking-wide rounded transition-opacity"
          >
            ANNULER TOUT
          </button>
        </div>
      </div>
    </div>
  );
}

