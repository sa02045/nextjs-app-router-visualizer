import { useRouter } from "next/navigation";
export default function Home() {
  const router = useRouter();
  return (
    <div>
      <h1>Home Page</h1>
      <button onClick={() => router.push("/product")}>Go to Home</button>
      <button onClick={() => router.push("/about")}>Go to Home</button>
      <button onClick={() => router.push("/product/detail")}>Go to Home</button>
    </div>
  );
}
