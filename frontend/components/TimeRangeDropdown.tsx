const ranges = ['15m', '1h', '24h', '7d', '30d', 'custom'] as const;

type Props = { value: string; onChange: (v: string) => void };

export default function TimeRangeDropdown({ value, onChange }: Props) {
  return (
    <select className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
      {ranges.map((r) => (
        <option key={r} value={r}>
          Last {r}
        </option>
      ))}
    </select>
  );
}
