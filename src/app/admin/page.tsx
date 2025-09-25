'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page redirects to the Payload admin panel
export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/api/payload/admin');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">Redirecting to Admin Panel...</h1>
      <p>If you are not redirected automatically, click the button below:</p>
      <button
        onClick={() => router.push('/api/payload/admin')}
        className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800"
      >
        Go to Admin Panel
      </button>
    </div>
  );
}
