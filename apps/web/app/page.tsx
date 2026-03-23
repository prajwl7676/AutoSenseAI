'use client';

import { useEffect, useState } from 'react';

interface ApiResponse {
  message: string;
  timestamp: string;
}

export default function Home() {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/`)
      .then((res) => res.json())
      .then((data) => {
        setApiData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="w-full text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            AutoSenseAI
          </h1>

          <div className="mt-8 p-4 rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
              Backend Connection Status
            </h2>

            {loading && <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>}

            {error && <p className="text-red-500">Error: {error}</p>}

            {apiData && (
              <div className="text-green-600 dark:text-green-400">
                <p className="font-semibold">Connected!</p>
                <p className="text-sm mt-2 text-zinc-600 dark:text-zinc-400">
                  Message: {apiData.message}
                </p>
                <p className="text-xs text-zinc-500">Timestamp: {apiData.timestamp}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
