import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Dataset = { id: string; name: string; created_at: string };

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [name, setName] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [rawLogs, setRawLogs] = useState('');

  const load = async () => {
    const res = await fetch(`${API}/datasets`);
    setDatasets(await res.json());
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('dataset_name', name);
    if (rawLogs.trim()) {
      fd.append('raw_logs', rawLogs);
    }
    if (files) {
      Array.from(files).forEach((f) => fd.append('files', f));
    }

    await fetch(`${API}/upload`, { method: 'POST', body: fd });
    setName('');
    setRawLogs('');
    await load();
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Datasets</h1>
      <form onSubmit={upload} className="space-y-3 rounded-md border border-slate-800 p-4">
        <input required className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2" placeholder="Dataset name" value={name} onChange={(e) => setName(e.target.value)} />
        <input type="file" multiple accept=".log,.json,.zip" onChange={(e) => setFiles(e.target.files)} />
        <textarea className="w-full rounded bg-slate-900 border border-slate-700 px-3 py-2 h-32" placeholder="Or paste raw logs" value={rawLogs} onChange={(e) => setRawLogs(e.target.value)} />
        <button className="rounded bg-indigo-600 px-4 py-2" type="submit">Upload</button>
      </form>

      <ul className="space-y-2">
        {datasets.map((d) => (
          <li key={d.id} className="rounded border border-slate-800 p-3 flex justify-between">
            <div>
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-slate-400">{new Date(d.created_at).toLocaleString()}</p>
            </div>
            <Link href={`/datasets/${d.id}`} className="text-indigo-400">Open Discover</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
