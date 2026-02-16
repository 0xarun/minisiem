import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-5">
        <h1 className="text-4xl font-bold">MiniSIEM</h1>
        <p className="text-slate-300">A lightweight log explorer inspired by Elastic Discover.</p>
        <Link href="/datasets" className="rounded-md bg-indigo-600 px-4 py-2 inline-block">Open Datasets</Link>
      </div>
    </main>
  );
}
