"use client";

import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();
  const hasAccess = true;

  if (!hasAccess) {
    notFound();
  }

  function handleSaveAndGoHome() {
    history.pushState(null, "", "/");
  }

  function handleGoForward() {
    router.forward();
  }

  return (
    <div>
      <h1>Settings</h1>
      <button onClick={handleSaveAndGoHome}>Save & Go Home</button>
      <button onClick={handleGoForward}>Go Forward</button>
      <Link href="/">Home</Link>
      <Link href="/auth/login" replace>Switch Account</Link>
    </div>
  );
}
