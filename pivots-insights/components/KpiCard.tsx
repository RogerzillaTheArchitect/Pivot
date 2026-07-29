export function KpiCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number | null;
  suffix?: string;
}) {
  return (
    <div className="glass fade-in rounded-xl2 px-5 py-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-2 text-2xl font-medium text-ink">
        {value === null ? <span className="text-muted text-base">—</span> : value}
        {value !== null && suffix ? <span className="ml-1 text-sm text-muted">{suffix}</span> : null}
      </div>
    </div>
  );
}
