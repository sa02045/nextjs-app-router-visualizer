"use client";

import { useRouter } from "next/navigation";

export function AddToCartButton() {
  const router = useRouter();

  function handleAddToCart() {
    router.push("/cart");
  }

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
