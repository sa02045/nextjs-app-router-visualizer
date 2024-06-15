"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
export default function About() {
  const router = useRouter();
  return (
    <div>
      <h1>About Page</h1>
      <Link href="/product">Go to product detail</Link>
    </div>
  );
}
