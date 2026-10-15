import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Suspense } from "react";
import { DataProvider } from "@/components/data-provider";
import { ModeIndicator } from "@/components/mode-indicator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Brollow — Borrow instead of buying", template: "%s · Brollow" },
  description: "Find what you need, near you, whenever you need it. Rent cameras, tools, camping and party gear from people nearby.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-GB" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow">
          Skip to content
        </a>
        <DataProvider>
          <Suspense fallback={<div className="h-16 border-b" aria-hidden="true" />}>
            <SiteHeader />
          </Suspense>
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter />
          <ModeIndicator />
          <Toaster position="top-center" />
        </DataProvider>
      </body>
    </html>
  );
}
