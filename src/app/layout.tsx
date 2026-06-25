import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { AttributionLogger } from "@/components/attribution-logger";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Py — Workflow Builder",
  description: "Build and run LLM workflows on a visual canvas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${inter.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">
          <AttributionLogger />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
