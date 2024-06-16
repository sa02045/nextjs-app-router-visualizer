'use client';
import { useRouter } from 'next/navigation';
export default function Page() {
  const router = useRouter();

  function handle결제완료하기() {}

  function handle결제취소하기() {
    router.push('/payment/cancel');
  }

  return (
    <div>
      <h1>Card Payment Page</h1>
      <button onClick={handle결제완료하기}>결제완료하기</button>
      <button onClick={handle결제취소하기}>결제취소하기</button>
    </div>
  );
}
