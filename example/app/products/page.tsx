"use client";

import Link from "next/link";

export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      <Link href="/products/1">Product 1</Link>
      <Link href="/products/2">Product 2</Link>
      <Link href="/">Back to Home</Link>
    </div>
  );
}
