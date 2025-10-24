'use client';

import { useState } from 'react';
import BaristaHub from '@/components/order/BaristaHub';
import BaristaOrderSidebar from '@/components/order/BaristaOrderSidebar';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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

type OrderItem = {
  id: string;
  drink: DrinkItem;
  selections: Record<string, string | string[]>;
};

interface BaristaOrderClientProps {
  eventId: string;
  categories: Category[];
}

export default function BaristaOrderClient({
  eventId,
  categories,
}: BaristaOrderClientProps) {
  const router = useRouter();

  const [currentDrink, setCurrentDrink] = useState<DrinkItem | null>(null);
  const [currentSelections, setCurrentSelections] = useState<Record<string, string | string[]>>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Sélectionner une boisson
  const handleSelectDrink = (drink: DrinkItem) => {
    setCurrentDrink(drink);
    
    // Initialiser les sélections avec des valeurs par défaut
    const defaultSelections: Record<string, string | string[]> = {};
    drink.modifiers.forEach(mod => {
      if (mod.type === 'single') {
        // Sélectionner la première option par défaut pour les options requises
        defaultSelections[mod.id] = mod.required && mod.options.length > 0 
          ? mod.options[0].id 
          : '';
      } else {
        defaultSelections[mod.id] = [];
      }
    });
    
    setCurrentSelections(defaultSelections);
  };

  // Basculer une option
  const handleToggleOption = (modifierId: string, optionId: string, type: 'single' | 'multi') => {
    setCurrentSelections(prev => {
      if (type === 'single') {
        return { ...prev, [modifierId]: optionId };
      } else {
        const current = (prev[modifierId] || []) as string[];
        const index = current.indexOf(optionId);
        if (index > -1) {
          return { ...prev, [modifierId]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [modifierId]: [...current, optionId] };
        }
      }
    });
  };

  // Ajouter à la commande
  const handleAddToOrder = () => {
    if (!currentDrink) return;

    // Vérifier que les options requises sont sélectionnées
    const missingRequired = currentDrink.modifiers.find(m => m.required && !currentSelections[m.id]);
    if (missingRequired) {
      toast.error(`Veuillez sélectionner ${missingRequired.name}`);
      return;
    }

    const newItem: OrderItem = {
      id: Date.now().toString(),
      drink: currentDrink,
      selections: { ...currentSelections }
    };

    setOrderItems(prev => [...prev, newItem]);
    toast.success(`${currentDrink.name} ajouté à la commande`);

    // Réinitialiser
    setCurrentDrink(null);
    setCurrentSelections({});
  };

  // Retirer un item
  const handleRemoveItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Boisson retirée');
  };

  // Soumettre la commande
  const handleSubmitOrder = async () => {
    if (orderItems.length === 0) return;

    setSubmitting(true);
    try {
      // Préparer les données pour la fonction RPC
      const itemsData = orderItems.map(item => ({
        item_id: item.drink.id,
        options: item.selections
      }));

      console.log('📊 Envoi de la commande barista:', {
        event_id: eventId,
        items: itemsData
      });

      // Appeler la fonction RPC barista_place_order
      const { data, error } = await supabase.rpc('barista_place_order', {
        p_event_id: eventId,
        p_items: itemsData
      });

      if (error) {
        console.error('Erreur RPC:', error);
        toast.error(`Erreur: ${error.message}`);
        return;
      }

      console.log('✅ Réponse de la fonction RPC:', data);
      toast.success(`✓ Commande de ${data.orders_created} boisson(s) enregistrée !`, {
        duration: 3000,
      });
      
      // Réinitialiser
      setOrderItems([]);
      setCurrentDrink(null);
      setCurrentSelections({});
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setSubmitting(false);
    }
  };

  // Annuler tout
  const handleClearOrder = () => {
    if (orderItems.length === 0) return;
    
    setOrderItems([]);
    setCurrentDrink(null);
    setCurrentSelections({});
    toast.success('Commande annulée');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Section principale - Hub des boissons */}
      <div className="flex-1 overflow-y-auto bg-[#f5f5f0] p-4 md:p-6">
        <div className="mb-4">
          <button
            onClick={() => router.push(`/admin/events/${eventId}`)}
            className="mb-3 inline-flex items-center gap-2 h-9 px-3 border rounded hover:bg-gray-50 bg-white text-sm"
          >
            <ArrowLeft className="h-3 w-3" />
            RETOUR
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wide mb-1">
            🎯 BARISTA ORDER
          </h1>
          <p className="text-xs text-gray-600">
            {categories.reduce((acc, cat) => acc + cat.items.length, 0)} boissons disponibles
          </p>
        </div>

        <BaristaHub
          categories={categories}
          onSelectDrink={handleSelectDrink}
        />
      </div>

      {/* Sidebar - Commande en cours */}
      <BaristaOrderSidebar
        currentDrink={currentDrink}
        currentSelections={currentSelections}
        orderItems={orderItems}
        submitting={submitting}
        onToggleOption={handleToggleOption}
        onAddToOrder={handleAddToOrder}
        onRemoveItem={handleRemoveItem}
        onSubmitOrder={handleSubmitOrder}
        onClearOrder={handleClearOrder}
      />
    </div>
  );
}

