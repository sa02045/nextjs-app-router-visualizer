import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js App Router Visualizer - Example",
  description: "Example app showcasing various Next.js navigation patterns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
