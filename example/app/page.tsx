'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
export default function Entry() {
  const router = useRouter();

  function handle제품보러가기() {
    router.push('/product');
  }

  return (
    <div>
      <button onClick={handle제품보러가기}>제품보러가기</button>
      <Link href="/profile">내 프로필 페이지 이동 버튼</Link>
    </div>
  );
}
