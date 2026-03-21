"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartPage() {
  const router = useRouter();

  function handleCheckout() {
    router.push("/checkout/payment");
  }

  function handleContinueShopping() {
    router.replace("/products");
  }

  return (
    <div>
      <h1>Cart</h1>
      <button onClick={handleCheckout}>Proceed to Checkout</button>
      <button onClick={handleContinueShopping}>Continue Shopping</button>
      <Link href="/">Home</Link>
    </div>
  );
}
