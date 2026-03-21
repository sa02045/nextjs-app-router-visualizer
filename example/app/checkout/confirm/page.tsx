"use client";

import { useRouter } from "next/navigation";

export default function ConfirmPage() {
  const router = useRouter();

  function handleConfirmOrder() {
    router.replace("/checkout/complete");
  }

  function handleEditPayment() {
    router.back();
  }

  return (
    <div>
      <h1>Confirm Order</h1>
      <button onClick={handleConfirmOrder}>Confirm</button>
      <button onClick={handleEditPayment}>Edit Payment</button>
    </div>
  );
}
