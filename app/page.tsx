'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Mkopo & Rent Tracker</h1>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  );
}
