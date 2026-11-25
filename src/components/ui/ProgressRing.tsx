interface Props {
  value: number; // 0-100
  label: string;
  size?: number;
}

/** Circular progress with the percentage in the middle. */
export function ProgressRing({ value, label, size = 88 }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 500ms ease' }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-xl font-bold tabular-nums">{pct}%</span>
    </div>
  );
}
