import { useRouter } from "next/navigation";
import { Component } from "./component";
export default function ProductDetail() {
  const router = useRouter();

  return (
    <div>
      <h1>Home Page</h1>
      <Component
        onNext={() => {
          router.push("/product");
        }}
      ></Component>
    </div>
  );
}
