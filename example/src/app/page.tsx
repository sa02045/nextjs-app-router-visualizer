import { useRouter } from "next/navigation";
export default function Entry() {
  const router = useRouter();
  return (
    <div>
      <h1>About Page</h1>
      <input
        onBlur={() => {
          //
        }}
        onClick={() => router.push("/about")}
      >
        Go to About
      </input>
    </div>
  );
}
