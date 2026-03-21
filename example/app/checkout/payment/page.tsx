"use client";

import { useRouter } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();

  function handlePaymentSuccess() {
    router.push("/checkout/confirm");
  }

  function handleCancel() {
    router.back();
  }

  return (
    <div>
      <h1>Payment</h1>
      <button onClick={handlePaymentSuccess}>Pay Now</button>
      <button onClick={handleCancel}>Cancel</button>
    </div>
  );
}
