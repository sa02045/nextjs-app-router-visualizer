import Link from "next/link";
import { useRouter } from "next/navigation";
export default function Product() {
  const router = useRouter();

  function handle로그인() {
    router.push("/product/detail");
  }
  return (
    <div>
      <h1>About Page</h1>
      <button onClick={handle로그인}>Go to Home</button>
    </div>
  );
}
