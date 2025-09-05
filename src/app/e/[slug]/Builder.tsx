'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import DrinkList from '@/components/order/DrinkList';
import OptionGroup from '@/components/order/OptionGroup';
import StepDots from '@/components/order/StepDots';
import WizardNav from '@/components/order/WizardNav';
import OrderTray from '@/components/order/OrderTray';
import ReviewList from '@/components/order/ReviewList';
import CoffeeConfirm from '@/components/confirm/CoffeeConfirm';
import type { Category, Item, Modifier } from '@/types/menu';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

type PendingItem = {
  tempId: string;       // uuid v4 ou nanoid
  item: Item;
  single: Record<string, string | null>;
  multi: Record<string, string[]>;
};

type Stage = 'choose' | 'options' | 'review';

export default function Builder({
  slug,
  joinCode,
  categories,
}: {
  slug: string;
  joinCode: string;
  categories: Category[];
}) {
  const router = useRouter();
  const reduce = useReducedMotion();

  const allItems: Item[] = useMemo(
    () => categories.flatMap(c => c.items ?? []),
    [categories]
  );

  // 🔥 New multi-drink flow with cart
  const [stage, setStage] = useState<Stage>('choose');
  const [cart, setCart] = useState<PendingItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [optStep, setOptStep] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [note, setNote] = useState('');

  // 🔥 New: mapping itemId -> count for selection with counters
  const [counts, setCounts] = useState<Record<string, number>>({});
  const totalSelected = useMemo(
    () => Object.values(counts).reduce((a, b) => a + b, 0),
    [counts]
  );

  function inc(id: string) {
    setCounts(prev => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }));
  }

  function dec(id: string) {
    setCounts(prev => {
      const next = { ...prev };
      const val = (next[id] ?? 0) - 1;
      if (val <= 0) delete next[id]; else next[id] = val;
      return next;
    });
  }

  // Overlay de confirmation (tasse qui se remplit)
  const [showConfirm, setShowConfirm] = useState(false);

  const current = cart[currentIdx] ?? null;
  const optionSteps: Modifier[] = current ? (current.item.modifiers ?? []) : [];

  // Dérivé pour la sélection visuelle
  const selectedIds = new Set(cart.map(item => item.item.id));

  // Drink selection => adds to cart (doesn't change stage)
  function addDrinkById(id: string) {
    const it = allItems.find(i => i.id === id);
    if (!it) return;
    setCart(prev => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        item: it,
        single: {},
        multi: {},
      }
    ]);
  }

  // Retirer une entrée du panier
  function removeTemp(tempId: string) {
    setCart(prev => prev.filter(p => p.tempId !== tempId));
  }

  // Option selection updates
  function updateSingle(modId: string, value: string | null) {
    if (!current) return;
    setCart(prev => prev.map((p, i) => 
      i === currentIdx ? { ...p, single: { ...p.single, [modId]: value } } : p
    ));
  }

  function updateMulti(modId: string, values: string[]) {
    if (!current) return;
    setCart(prev => prev.map((p, i) => 
      i === currentIdx ? { ...p, multi: { ...p.multi, [modId]: values } } : p
    ));
  }

  // Navigation
  function onNext() {
    if (stage === 'choose') {
      if (totalSelected === 0) return;
      const expanded = Object.entries(counts).flatMap(([id, qty]) => {
        const it = allItems.find(i => i.id === id);
        if (!it) return [];
        return Array.from({ length: qty }, () => ({
          tempId: crypto.randomUUID(),
          item: it,
          single: {},
          multi: {},
        }));
      });
      setCart(expanded);
      setCurrentIdx(0);
      setOptStep(0);
      setStage('options');
      return;
    }

    if (stage === 'options') {
      if (optStep < optionSteps.length - 1) {
        setOptStep(s => s + 1);
        return;
      }

      // End of options for current item
      if (currentIdx < cart.length - 1) {
        // Move to next item
        setCurrentIdx(i => i + 1);
        setOptStep(0);
      } else {
        // Last item processed → go to review
        setStage('review');
      }
      return;
    }

    if (stage === 'review') {
      submitAll();
    }
  }

  function onPrev() {
    if (stage === 'options') {
      if (optStep > 0) {
        setOptStep(s => s - 1);
        return;
      }
      if (currentIdx > 0) {
        // Go back to previous item
        setCurrentIdx(i => i - 1);
        setOptStep(optionSteps.length - 1);
        return;
      }
      // Back to selection
      setStage('choose');
      return;
    }
  }

  // Validation canNext
  function canNext(): boolean {
    if (stage === 'choose') {
      return totalSelected > 0;
    }

    if (stage === 'options') {
      const currentMod = optionSteps[optStep];
      if (!currentMod) return true;

      if (currentMod.required) {
        if (currentMod.type === 'single') {
          return current.single[currentMod.id] !== null && current.single[currentMod.id] !== undefined;
        } else {
          return (current.multi[currentMod.id] ?? []).length > 0;
        }
      }
      return true; // non requis = toujours valide
    }

    return stage === 'review';
  }

  // Compilation pour l'appel RPC
  async function submitAll() {
    if (cart.length === 0) return;

    const payloadItems = cart.map(p => {
      const selectedOptionIds: string[] = [];
      for (const mod of (p.item.modifiers ?? [])) {
        if (mod.type === 'single') {
          const v = p.single[mod.id];
          if (v) selectedOptionIds.push(v);
        } else {
          const arr = p.multi[mod.id] ?? [];
          selectedOptionIds.push(...arr);
        }
      }
      return { item_id: p.item.id, qty: 1, options: selectedOptionIds };
    });

    const { data, error } = await supabase.rpc('place_order', {
      p_event_slug: slug,
      p_join_code: joinCode || 'WB1',
      p_customer_name: firstName || null,
      p_note: note || null,
      p_items: payloadItems
    });

    if (error) { 
      alert('ERROR: ' + error.message); 
      return; 
    }

    // Launch cup filling animation, then redirect
    setShowConfirm(true);
    // animation duration ≈ 1.1s → redirect just after
    setTimeout(() => {
      router.replace(`/order/${data.order_id}?pickup=${data.pickup_code}`);
    }, 1150);
  }

  // Variants anim
  const variants = reduce ? undefined : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };
  const transition = reduce ? { duration: 0 } : { duration: 0.22 };

  // Derived for display
  const trayItems = cart.map((item, index) => ({
    id: item.tempId,
    name: item.item.name.toUpperCase(),
    complete: (() => {
      // AN ITEM IS "COMPLETE" IF ALL REQUIRED FIELDS ARE FILLED
      for (const mod of (item.item.modifiers ?? [])) {
        if (!mod.required) continue;
        if (mod.type === 'single' && !item.single[mod.id]) return false;
        if (mod.type === 'multi' && (item.multi[mod.id] ?? []).length === 0) return false;
      }
      return true;
    })()
  }));

  const reviewData = cart.map(item => ({
    name: item.item.name.toUpperCase(),
    options: (item.item.modifiers ?? []).map(mod => {
      if (mod.type === 'single') {
        const id = item.single[mod.id];
        const name = mod.options.find(o => o.id === id)?.name;
        return { group: mod.name.toUpperCase(), values: name ? [name.toUpperCase()] : [] };
      } else {
        const ids = new Set(item.multi[mod.id] ?? []);
        const names = mod.options.filter(o => ids.has(o.id)).map(o => o.name);
        return { group: mod.name.toUpperCase(), values: names.map(n => n.toUpperCase()) };
      }
    }).filter(g => g.values.length > 0)
  }));

  return (
    <>
      <div className="pb-24">
        {/* Mini-cart */}
        {stage !== 'choose' && (
          <OrderTray
            items={trayItems}
            activeIndex={stage === 'options' ? currentIdx : -1}
            onSelectIndex={(i) => { 
              if (stage === 'options') {
                setCurrentIdx(i);
                setOptStep(0);
              }
            }}
            onRemoveIndex={(i) => removeTemp(trayItems[i].id)}
            onAddNew={() => setStage('choose')}
          />
        )}

        {/* Dots relative to current item */}
        {stage === 'options' && current && (
          <StepDots total={optionSteps.length} index={optStep} />
        )}

        <AnimatePresence mode="wait">
          <motion.div key={`${stage}-${currentIdx}-${optStep}`} initial="initial" animate="animate" exit="exit" variants={variants} transition={transition}>
            {/* Stage: Drink selection */}
            {stage === 'choose' && (
              <>
                <div className="mb-4">
                  <h1 className="text-lg font-semibold">SELECT YOUR DRINKS</h1>
                  {totalSelected > 0 && (
                    <p className="text-sm text-neutral-500 mt-1">
                      {totalSelected} DRINK{totalSelected > 1 ? 'S' : ''} SELECTED
                    </p>
                  )}
                </div>
                <DrinkList
                  categories={categories}
                  getCount={(id) => counts[id] ?? 0}
                  onInc={inc}
                  onDec={dec}
                />
              </>
            )}

            {/* Stage: Option configuration */}
            {stage === 'options' && current && optStep < optionSteps.length && (
              <section className="py-4">
                <h2 className="mb-2 text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500">
                  DRINK {currentIdx + 1} OF {cart.length}
                </h2>
                <h3 className="mb-2 text-sm sm:text-base font-semibold leading-tight">
                  {current.item.name.toUpperCase()} — {optionSteps[optStep].name.toUpperCase()}
                </h3>
                <OptionGroup
                  modifier={optionSteps[optStep]}
                  valueSingle={current.single[optionSteps[optStep].id] ?? null}
                  valueMulti={current.multi[optionSteps[optStep].id] ?? []}
                  onChange={(next) => {
                    const mod = optionSteps[optStep];
                    if (mod.type === 'single') {
                      updateSingle(mod.id, next as string);
                    } else {
                      updateMulti(mod.id, next as string[]);
                    }
                  }}
                />
              </section>
            )}

            {/* Stage: Global review + first name/note */}
            {stage === 'review' && (
              <>
                <div className="mb-4">
                  <h1 className="text-lg font-semibold">REVIEW YOUR ORDER</h1>
                  <p className="text-sm text-neutral-500 mt-1">
                    {cart.length} DRINK{cart.length > 1 ? 'S' : ''} READY TO ORDER
                  </p>
                </div>
                <ReviewList
                  items={reviewData}
                  onEditIndex={(i) => { 
                    setCurrentIdx(i);
                    setOptStep(0);
                    setStage('options');
                  }}
                  onRemoveIndex={(i) => removeTemp(trayItems[i].id)}
                  onAddNew={() => setStage('choose')}
                />
                <section className="py-4 space-y-3">
                  <div className="grid gap-3">
                    <input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="FIRST NAME (OPTIONAL)"
                      className="h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="NOTE FOR BARISTA (OPTIONAL)"
                      className="min-h-[90px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </section>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <WizardNav
          canPrev={stage === 'options' && (optStep > 0 || currentIdx > 0)}
          canNext={canNext()}
          isFinal={stage === 'review'}
          onPrev={onPrev}
          onNext={onNext}
          nextLabel={
            stage === 'choose' ? 'NEXT' :
            stage === 'options' ? 'NEXT' :
            'ORDER'
          }
        />
      </div>

      {/* Overlay confirmation (tasse qui se remplit) */}
      <CoffeeConfirm show={showConfirm} />
    </>
  );
}
