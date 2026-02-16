type Filter = { field: string; value: string; type: 'include' | 'exclude' };

type Props = { filters: Filter[]; onRemove: (index: number) => void };

export default function FilterBar({ filters, onRemove }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f, idx) => (
        <button key={`${f.field}-${idx}`} onClick={() => onRemove(idx)} className="rounded-full bg-indigo-600/30 px-3 py-1 text-xs">
          {f.type === 'exclude' ? 'NOT ' : ''}
          {f.field}:{f.value} ✕
        </button>
      ))}
    </div>
  );
}
