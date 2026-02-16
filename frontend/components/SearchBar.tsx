import { useState } from 'react';

type Props = { value: string; onSearch: (q: string) => void };

export default function SearchBar({ value, onSearch }: Props) {
  const [local, setLocal] = useState(value);
  return (
    <input
      className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2"
      placeholder="Search logs (e.g. host:web01 AND status:failed)"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSearch(local)}
    />
  );
}
