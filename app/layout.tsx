import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Sidebar from "@/app/components/Sidebar";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "it-for-me",
  description: "Clean portfolio job tracker shell for biomedical, healthcare IT, and technical career projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <div className="min-h-screen bg-canvas md:grid md:grid-cols-[292px_minmax(0,1fr)]">
          <Sidebar />
          <main className="min-w-0 p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
