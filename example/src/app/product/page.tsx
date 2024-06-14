import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Product() {
  const router = useRouter();
  return (
    <div>
      <h1>About Page</h1>
      <button onClick={() => router.push("/product/detail")}>Go to Home</button>
    </div>
  );
}
