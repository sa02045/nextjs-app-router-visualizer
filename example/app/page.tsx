"use client";

import { useRouter } from "next/navigation";
export default function Entry() {
  const router = useRouter();

  const a = 3;
  return (
    <div>
      <h1>About Page</h1>
      <button onClick={() => router.push("/product/555")}>Go to product</button>
    </div>
  );
}
