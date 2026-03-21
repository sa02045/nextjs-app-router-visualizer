import { redirect } from "next/navigation";
import Link from "next/link";

export default function CompletePage() {
  const orderSuccess = true;

  if (!orderSuccess) {
    redirect("/checkout/payment");
  }

  return (
    <div>
      <h1>Order Complete!</h1>
      <Link href="/">Back to Home</Link>
      <Link href="/products">Continue Shopping</Link>
    </div>
  );
}
