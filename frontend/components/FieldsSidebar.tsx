type ValueCount = { value: string; count: number };
type FieldStats = { field: string; values: ValueCount[] };

type Props = { fields: FieldStats[]; onSelect: (field: string, value: string, type: 'include' | 'exclude') => void };

export default function FieldsSidebar({ fields, onSelect }: Props) {
  return (
    <aside className="w-full md:w-80 rounded-md border border-slate-800 p-3 space-y-3 max-h-[75vh] overflow-y-auto">
      {fields.map((f) => (
        <div key={f.field}>
          <h3 className="font-semibold text-sm mb-1">{f.field}</h3>
          <div className="space-y-1">
            {f.values.map((v) => (
              <div key={`${f.field}-${v.value}`} className="flex items-center justify-between text-xs">
                <span>{v.value}</span>
                <div className="space-x-1">
                  <button onClick={() => onSelect(f.field, v.value, 'include')} className="text-emerald-400">+ filter</button>
                  <button onClick={() => onSelect(f.field, v.value, 'exclude')} className="text-rose-400">- filter</button>
                  <span className="text-slate-400">({v.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
