"use client";

import { useRouter } from "next/navigation";
import { Component } from "./component";
import Link from "next/link";
export default function ProductDetail() {
  const router = useRouter();

  return (
    <div>
      <h1>Home Page</h1>
      <Component
        onNext={() => {
          router.push("/home");
        }}
      ></Component>
    </div>
  );
}
