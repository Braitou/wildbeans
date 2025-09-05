export default function WizardNav({
  canPrev,
  canNext,
  isFinal,
  onPrev,
  onNext,
  nextLabel = 'NEXT',
  finalLabel = 'ORDER',
}: {
  canPrev: boolean;
  canNext: boolean;
  isFinal: boolean;
  onPrev: () => void;
  onNext: () => void;
  nextLabel?: string;
  finalLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-gray-200 py-3 font-sans">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex gap-3">
        <button
          className="flex-1 h-11 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
          onClick={onPrev}
          disabled={!canPrev}
        >
          PREVIOUS
        </button>
        <button
          className="flex-1 h-11 rounded-md bg-black text-white disabled:opacity-40"
          onClick={onNext}
          disabled={!canNext}
        >
          {isFinal ? finalLabel : nextLabel}
        </button>
      </div>
    </div>
  );
}
