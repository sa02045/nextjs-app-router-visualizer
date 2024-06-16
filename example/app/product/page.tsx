'use client';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Product() {
  const router = useRouter();

  function handle제품클릭() {
    router.push('/product/detail');
  }

  return (
    <div>
      <button onClick={handle제품클릭}>제품1</button>
      <Link href="/product/detail">제품보러가기 버튼</Link>
    </div>
  );
}
