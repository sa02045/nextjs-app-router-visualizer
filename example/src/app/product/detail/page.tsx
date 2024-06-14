import { useRouter } from "next/navigation";
import { Component } from "./component";
export default function ProductDetail() {
  const router = useRouter();

  function handleClick2() {
    router.push("/product33");
  }

  function handleClick() {
    router.push("/product");
  }

  return (
    <div>
      <h1>Home Page</h1>
      <Component onNext={handleClick}></Component>
    </div>
  );
}
