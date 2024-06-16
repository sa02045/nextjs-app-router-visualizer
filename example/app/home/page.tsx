'use client';
import { useRouter } from 'next/navigation';
export default function Home() {
  const router = useRouter();
  return (
    <div>
      <h1>Home Page</h1>
    </div>
  );
}
