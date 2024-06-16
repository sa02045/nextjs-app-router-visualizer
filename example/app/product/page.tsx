'use client';
import { useRouter } from 'next/router';
export default function Product() {
  const router = useRouter();
  return (
    <div>
      <button onClick={() => router.push('/products/detail')}>Products Detail</button>
    </div>
  );
}
