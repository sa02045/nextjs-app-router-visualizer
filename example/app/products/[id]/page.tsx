"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AddToCartButton } from "../../components/AddToCartButton";

export default function ProductDetailPage() {
  const router = useRouter();

  function handleGoBack() {
    router.back();
  }

  return (
    <div>
      <h1>Product Detail</h1>
      <button onClick={handleGoBack}>Go Back</button>
      <AddToCartButton />
      <Link href="/checkout/payment">Buy Now</Link>
    </div>
  );
}
