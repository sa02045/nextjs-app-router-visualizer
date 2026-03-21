import { redirect } from "next/navigation";
import { permanentRedirect } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const isRegistered = false;
  const isLegacyUser = false;

  if (isRegistered) {
    redirect("/auth/login");
  }

  if (isLegacyUser) {
    permanentRedirect("/auth/login");
  }

  return (
    <div>
      <h1>Sign Up</h1>
      <Link href="/auth/login">Already have an account?</Link>
    </div>
  );
}
