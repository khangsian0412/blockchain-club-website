import type { Metadata } from "next";
import "./styles.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Blockchain Club",
  description: "A decentralized campus club platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
