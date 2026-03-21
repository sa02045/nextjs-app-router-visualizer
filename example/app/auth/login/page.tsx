"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  function handleLogin() {
    router.replace("/");
  }

  return (
    <div>
      <h1>Login</h1>
      <button onClick={handleLogin}>Login</button>
      <Link href="/auth/signup">Create Account</Link>
    </div>
  );
}
