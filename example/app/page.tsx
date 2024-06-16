'use client';

import { useRouter } from 'next/navigation';
export default function Entry() {
  const router = useRouter();

  const a = 3;
  return (
    <div>
      <button onClick={() => router.push('/about')}>Go to About</button>
    </div>
  );
}
