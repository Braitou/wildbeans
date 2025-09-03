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

type ItemState = {
  item: Item;
  single: Record<string, string | null>;
  multi: Record<string, string[]>;
};

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

  // 🔥 Multi-items
  const [multiItems, setMultiItems] = useState<ItemState[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1); // -1 = pas d'item sélectionné (liste boissons)
  const [step, setStep] = useState(0); // step au sein de l'item courant
  const [firstName, setFirstName] = useState('');
  const [note, setNote] = useState('');

  // Overlay de confirmation (tasse qui se remplit)
  const [showConfirm, setShowConfirm] = useState(false);

  const current = currentIndex >= 0 ? multiItems[currentIndex] : null;
  const optionSteps: Modifier[] = current ? (current.item.modifiers ?? []) : [];

  // Sélection d'une boisson => crée un nouvel item et passe en édition
  function selectItemById(id: string) {
    const it = allItems.find(i => i.id === id);
    if (!it) return;
    setMultiItems(prev => [...prev, { item: it, single: {}, multi: {} }]);
    setCurrentIndex(multiItems.length); // index du nouvel item
    setStep(1); // passe à la première étape d'options (0=liste)
  }

  function updateCurrentSingle(modId: string, value: string) {
    if (currentIndex < 0) return;
    setMultiItems(prev => {
      const next = [...prev];
      const st = { ...next[currentIndex] };
      st.single = { ...st.single, [modId]: value };
      next[currentIndex] = st;
      return next;
    });
  }

  function updateCurrentMulti(modId: string, values: string[]) {
    if (currentIndex < 0) return;
    setMultiItems(prev => {
      const next = [...prev];
      const st = { ...next[currentIndex] };
      st.multi = { ...st.multi, [modId]: values };
      next[currentIndex] = st;
      return next;
    });
  }

  function addAnotherDrink() {
    // retour à la liste des boissons
    setCurrentIndex(-1);
    setStep(0);
  }

  function removeIndex(i: number) {
    setMultiItems(prev => {
      const next = prev.filter((_, idx) => idx !== i);
      // recalc current index
      if (next.length === 0) {
        setCurrentIndex(-1);
        setStep(0);
      } else if (i === currentIndex) {
        setCurrentIndex(Math.min(i, next.length - 1));
        setStep(1);
      } else if (i < currentIndex) {
        setCurrentIndex(ci => ci - 1);
      }
      return next;
    });
  }

  async function onNext() {
    // navigation dans l'item
    if (currentIndex === -1) {
      // rien à faire : l'utilisateur doit choisir une boisson
      return;
    }
    if (step < optionSteps.length) {
      setStep(s => s + 1);
      return;
    }

    // Fin des options de l'item courant → proposer d'ajouter une autre boisson
    // UX : on va directement au récap global, avec CTA "Ajouter une boisson"
    setStep(optionSteps.length + 1);
  }

  function onPrev() {
    if (step > 0) {
      setStep(s => s - 1);
      return;
    }
    // sinon, si on est à 0 → déjà sur la liste; rien
  }

  // Compilation pour l'appel RPC
  async function submitAll() {
    if (multiItems.length === 0) return;

    const p_items = multiItems.map(st => {
      const optionIds: string[] = [];
      (st.item.modifiers ?? []).forEach(mod => {
        if (mod.type === 'single') {
          const v = st.single[mod.id];
          if (v) optionIds.push(v);
        } else {
          optionIds.push(...(st.multi[mod.id] ?? []));
        }
      });
      return { item_id: st.item.id, qty: 1, options: optionIds };
    });

    const { data, error } = await supabase.rpc('place_order', {
      p_event_slug: slug,
      p_join_code: joinCode || 'WB1',
      p_customer_name: firstName || null,
      p_note: note || null,
      p_items
    });

    if (error) { 
      alert('Erreur: ' + error.message); 
      return; 
    }

    // Lance l'anim tasse qui se remplit, puis redirige
    setShowConfirm(true);
    // durée de l'anim ≈ 1.1s → on redirige juste après
    setTimeout(() => {
      router.replace(`/order/${data.order_id}?pickup=${data.pickup_code}`);
    }, 1150);
  }

  // Variants anim
  const variants = reduce ? undefined : { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };
  const transition = reduce ? { duration: 0 } : { duration: 0.22 };

  // Dérivés pour l'affichage
  const trayItems = multiItems.map(st => ({
    id: st.item.id,
    name: st.item.name,
    complete: (() => {
      // un item est "complet" si toutes les requises sont remplies
      for (const mod of (st.item.modifiers ?? [])) {
        if (!mod.required) continue;
        if (mod.type === 'single' && !st.single[mod.id]) return false;
        if (mod.type === 'multi' && (st.multi[mod.id] ?? []).length === 0) return false;
      }
      return true;
    })()
  }));

  const reviewData = multiItems.map(st => ({
    name: st.item.name,
    options: (st.item.modifiers ?? []).map(mod => {
      if (mod.type === 'single') {
        const id = st.single[mod.id];
        const name = mod.options.find(o => o.id === id)?.name;
        return { group: mod.name, values: name ? [name] : [] };
      } else {
        const ids = new Set(st.multi[mod.id] ?? []);
        const names = mod.options.filter(o => ids.has(o.id)).map(o => o.name);
        return { group: mod.name, values: names };
      }
    }).filter(g => g.values.length > 0)
  }));

  return (
    <>
      <div className="pb-24">
        {/* Mini-panier */}
        <OrderTray
          items={trayItems}
          activeIndex={currentIndex}
          onSelectIndex={(i) => { setCurrentIndex(i); setStep(1); }}
          onRemoveIndex={removeIndex}
          onAddNew={addAnotherDrink}
        />

        {/* Dots par rapport à l'item courant */}
        {current && <StepDots total={optionSteps.length + 1} index={Math.min(step, optionSteps.length)} />}

        <AnimatePresence mode="wait">
          <motion.div key={`${currentIndex}-${step}`} initial="initial" animate="animate" exit="exit" variants={variants} transition={transition}>
            {/* 0 : Liste des boissons (quand aucun item en édition) */}
            {currentIndex === -1 && (
              <DrinkList
                categories={categories}
                selectedId={null}
                onSelect={selectItemById}
              />
            )}

            {/* Étapes d'options pour l'item courant */}
            {currentIndex >= 0 && step >= 1 && step <= optionSteps.length && current && (
              <section className="py-4">
                <h2 className="mb-2 text-xs font-semibold tracking-[0.18em] uppercase text-neutral-500">
                  Boisson {currentIndex + 1}
                </h2>
                <h3 className="mb-2 text-[15px] font-semibold">{current.item.name} — {optionSteps[step - 1].name}</h3>
                <OptionGroup
                  modifier={optionSteps[step - 1]}
                  valueSingle={current.single[optionSteps[step - 1].id] ?? null}
                  valueMulti={current.multi[optionSteps[step - 1].id] ?? []}
                  onChange={(next) => {
                    const mod = optionSteps[step - 1];
                    if (mod.type === 'single') {
                      updateCurrentSingle(mod.id, next as string);
                    } else {
                      updateCurrentMulti(mod.id, next as string[]);
                    }
                  }}
                />
              </section>
            )}

            {/* Étape finale : Récap global + prénom/note */}
            {currentIndex >= 0 && step === optionSteps.length + 1 && (
              <>
                <ReviewList
                  items={reviewData}
                  onEditIndex={(i) => { setCurrentIndex(i); setStep(1); }}
                  onRemoveIndex={removeIndex}
                  onAddNew={addAnotherDrink}
                />
                <section className="py-4 space-y-3">
                  <div className="grid gap-3">
                    <input
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Prénom (optionnel)"
                      className="h-11 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Note pour le barista (optionnel)"
                      className="min-h-[90px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </section>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentIndex === -1 ? (
          <WizardNav
            canPrev={false}
            canNext={false}
            isFinal={false}
            onPrev={() => {}}
            onNext={() => {}}
            nextLabel="Suivant"
          />
        ) : (
          <WizardNav
            canPrev={step > 1}
            canNext={step <= optionSteps.length ? true : multiItems.length > 0}
            isFinal={step === optionSteps.length + 1}
            onPrev={onPrev}
            onNext={step === optionSteps.length + 1 ? submitAll : onNext}
            nextLabel={step <= optionSteps.length ? "Suivant" : "Commander"}
          />
        )}
      </div>

      {/* Overlay confirmation (tasse qui se remplit) */}
      <CoffeeConfirm show={showConfirm} />
    </>
  );
}
