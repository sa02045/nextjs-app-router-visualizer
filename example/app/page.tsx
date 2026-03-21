"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  function handleGoToProducts() {
    router.push("/products");
  }

  return (
    <div>
      <h1>Home</h1>
      <button onClick={handleGoToProducts}>Browse Products</button>
      <Link href="/cart">View Cart</Link>
      <Link href="/auth/login">Login</Link>
      <Link href="/settings">Settings</Link>
    </div>
  );
}
