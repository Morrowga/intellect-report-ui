import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ReduxProvider } from "@/providers/ReduxProvider";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Supply Chain Intelligence",
  description: "Admin panel for Supply Chain Intelligence System",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        suppressHydrationWarning
        className={`${jetbrainsMono.variable} antialiased bg-[#0a0a0a] text-zinc-100`}
        style={{ fontFamily: "var(--font-jetbrains), monospace" }}
      >
        <ReduxProvider>
          {children}
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}