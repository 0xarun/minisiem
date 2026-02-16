import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import FieldsSidebar from '../../components/FieldsSidebar';
import FilterBar from '../../components/FilterBar';
import LogsTable from '../../components/LogsTable';
import SearchBar from '../../components/SearchBar';
import TimeRangeDropdown from '../../components/TimeRangeDropdown';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type FieldStats = { field: string; values: { value: string; count: number }[] };
type Filter = { field: string; value: string; type: 'include' | 'exclude' };

export default function DiscoverPage() {
  const { query } = useRouter();
  const datasetId = query.id as string;

  const [fields, setFields] = useState<FieldStats[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filter[]>([]);
  const [timeRange, setTimeRange] = useState('24h');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortField, setSortField] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  const computeTime = useMemo(() => {
    if (timeRange === 'custom') {
      return { time_from: customFrom || null, time_to: customTo || null };
    }
    const now = new Date();
    const from = new Date(now);
    const map: Record<string, number> = { '15m': 15 * 60, '1h': 3600, '24h': 86400, '7d': 604800, '30d': 2592000 };
    from.setSeconds(from.getSeconds() - (map[timeRange] || 86400));
    return { time_from: from.toISOString(), time_to: now.toISOString() };
  }, [timeRange, customFrom, customTo]);

  const loadFields = async () => {
    if (!datasetId) return;
    const res = await fetch(`${API}/datasets/${datasetId}/fields`);
    setFields(await res.json());
  };

  const loadLogs = async (pageValue = page) => {
    if (!datasetId) return;
    const body = {
      query: search,
      filters,
      page: pageValue,
      page_size: 50,
      sort_field: sortField,
      sort_order: sortOrder,
      ...computeTime
    };
    const res = await fetch(`${API}/datasets/${datasetId}/logs/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    setLogs(data.items || []);
    setTotal(data.total || 0);
  };

  useEffect(() => {
    loadFields();
  }, [datasetId]);

  useEffect(() => {
    setPage(1);
    loadLogs(1);
  }, [datasetId, search, JSON.stringify(filters), JSON.stringify(computeTime), sortField, sortOrder]);

  const addFilter = (field: string, value: string, type: 'include' | 'exclude') => {
    setFilters((prev) => [...prev, { field, value, type }]);
  };

  const removeFilter = (index: number) => {
    setFilters((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleColumn = (c: string) => {
    setSelectedColumns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };

  const onSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const hasTimestamp = logs.some((l) => l.timestamp);

  return (
    <main className="p-4 md:p-6 space-y-4">
      <h1 className="text-xl font-bold">Discover</h1>
      <div className="flex flex-col md:flex-row gap-2">
        <SearchBar value={search} onSearch={setSearch} />
        <TimeRangeDropdown value={timeRange} onChange={setTimeRange} />
      </div>
      {timeRange === 'custom' && hasTimestamp && (
        <div className="flex gap-2">
          <input type="datetime-local" className="rounded bg-slate-900 border border-slate-700 px-3 py-2" onChange={(e) => setCustomFrom(new Date(e.target.value).toISOString())} />
          <input type="datetime-local" className="rounded bg-slate-900 border border-slate-700 px-3 py-2" onChange={(e) => setCustomTo(new Date(e.target.value).toISOString())} />
        </div>
      )}
      {!hasTimestamp && <p className="text-xs text-amber-300">No timestamp field detected in this dataset. Time filter is disabled.</p>}
      <FilterBar filters={filters} onRemove={removeFilter} />

      <div className="flex flex-col md:flex-row gap-4">
        <FieldsSidebar fields={fields} onSelect={addFilter} />
        <div className="flex-1 space-y-3">
          <LogsTable logs={logs} selectedColumns={selectedColumns} onToggleColumn={toggleColumn} onSort={onSort} />
          <div className="flex justify-between text-sm">
            <span>Total: {total}</span>
            <div className="space-x-2">
              <button className="px-3 py-1 rounded bg-slate-800" disabled={page <= 1} onClick={() => { const n = page - 1; setPage(n); loadLogs(n); }}>Prev</button>
              <button className="px-3 py-1 rounded bg-slate-800" disabled={page * 50 >= total} onClick={() => { const n = page + 1; setPage(n); loadLogs(n); }}>Next</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
