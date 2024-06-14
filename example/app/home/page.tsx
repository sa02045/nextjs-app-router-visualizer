import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={() => router.push("/product")}>Go to product</button>
      <button onClick={() => router.push("/about")}>Go to about</button>
      <button onClick={() => router.push("/product/detail")}>
        Go to detail
      </button>
    </div>
  );
}
