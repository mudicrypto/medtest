export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-lg bg-ink text-white">
        {/* Simple cross-in-square mark */}
        <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
          <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z" fill="currentColor" opacity="0.92" />
          <path d="M12 9.5v5M9.5 12h5" stroke="#14b8a6" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[1.05rem] font-semibold tracking-tight text-ink">
        Med<span className="text-accent">Prep</span>
      </span>
    </span>
  );
}
