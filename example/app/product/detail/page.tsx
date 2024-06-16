'use client';

import { useRouter } from 'next/navigation';
import { Component as UserComponent } from './component';

export default function ProductDetail() {
  const router = useRouter();

  function handle카드결제하기() {
    router.push('/payment/card');
  }

  return (
    <div>
      <h1>Product Detail Page</h1>
      <UserComponent onNext={handle카드결제하기}></UserComponent>
    </div>
  );
}
