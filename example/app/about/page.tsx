import Link from "next/link";
import { useRouter } from "next/navigation";
export default function About() {
  const router = useRouter();
  return (
    <div>
      <h1>About Page</h1>
      <button onClick={() => router.push("/home")}>Go to Home</button>
      <Link href="/product/detail">Go to product detail</Link>
    </div>
  );
}
