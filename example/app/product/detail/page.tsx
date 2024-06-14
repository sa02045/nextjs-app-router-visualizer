import { useRouter } from "next/router";
export default function Page() {
  const router = useRouter();
  return (
    <div>
      <button onClick={() => router.push("/")}>entry</button>
    </div>
  );
}
