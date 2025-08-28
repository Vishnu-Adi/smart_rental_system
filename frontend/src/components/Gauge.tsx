export function Gauge({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <div className="absolute inset-0 origin-bottom rounded-b-full" style={{
          background: `conic-gradient(var(--foreground) ${pct * 1.8}deg, var(--border) 0deg)`,
          clipPath: 'inset(50% 0 0 0)'
        }} />
        <div className="absolute inset-0 flex items-end justify-center pb-2 text-lg font-semibold">{pct.toFixed(0)}%</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}


