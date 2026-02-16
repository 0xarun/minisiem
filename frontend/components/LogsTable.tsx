import { Fragment, useMemo, useState } from 'react';

type Log = { id: string; timestamp: string | null; line_number: number; raw_message: string; parsed_fields: Record<string, string> };

type Props = {
  logs: Log[];
  selectedColumns: string[];
  onToggleColumn: (col: string) => void;
  onSort: (field: string) => void;
};

export default function LogsTable({ logs, selectedColumns, onToggleColumn, onSort }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const allFields = useMemo(() => Array.from(new Set(logs.flatMap((l) => Object.keys(l.parsed_fields || {})))), [logs]);

  return (
    <div className="space-y-2 w-full overflow-x-auto">
      <div className="flex flex-wrap gap-2 text-xs">
        {allFields.map((f) => (
          <button key={f} className={`rounded px-2 py-1 ${selectedColumns.includes(f) ? 'bg-indigo-700' : 'bg-slate-800'}`} onClick={() => onToggleColumn(f)}>
            {f}
          </button>
        ))}
      </div>
      <table className="min-w-full text-sm border border-slate-800">
        <thead className="bg-slate-900">
          <tr>
            <th className="p-2 cursor-pointer" onClick={() => onSort('timestamp')}>Timestamp</th>
            <th className="p-2 cursor-pointer" onClick={() => onSort('line_number')}>Line</th>
            {selectedColumns.map((c) => (
              <th key={c} className="p-2 cursor-pointer" onClick={() => onSort(c)}>{c}</th>
            ))}
            <th className="p-2">Message</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <Fragment key={log.id}>
              <tr className="border-t border-slate-800 hover:bg-slate-900" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                <td className="p-2">{log.timestamp ?? '-'}</td>
                <td className="p-2">{log.line_number}</td>
                {selectedColumns.map((c) => (
                  <td key={`${log.id}-${c}`} className="p-2">{String(log.parsed_fields?.[c] ?? '-')}</td>
                ))}
                <td className="p-2 truncate max-w-sm">{log.raw_message}</td>
              </tr>
              {expanded === log.id && (
                <tr>
                  <td className="p-2 bg-slate-900" colSpan={4 + selectedColumns.length}>
                    <pre className="text-xs overflow-x-auto">{JSON.stringify(log.parsed_fields, null, 2)}</pre>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
