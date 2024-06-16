'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Profile() {
  const router = useRouter();

  return (
    <div>
      <h1>내 프로필 페이지</h1>
      <Link href="/profile/about">내 정보 보러가기 버튼</Link>
    </div>
  );
}
