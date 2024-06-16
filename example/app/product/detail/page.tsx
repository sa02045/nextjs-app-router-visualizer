'use client';

import { useRouter } from 'next/navigation';
import { Component as UserComponent } from './component';
import Link from 'next/link';
export default function ProductDetail() {
  const router = useRouter();

  return (
    <div>
      <h1>Home Page</h1>
      <UserComponent
        onNext={() => {
          router.push('/product/123123');
        }}
      ></UserComponent>
    </div>
  );
}
