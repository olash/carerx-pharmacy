import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { RequestListProvider } from "@/components/providers/request-list";
import { ToastProvider } from "@/components/providers/toast";
import { site } from "@/lib/config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${site.name} — Request medicines & talk to a pharmacist`, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = { themeColor: "#0e9384" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ToastProvider>
          <RequestListProvider>{children}</RequestListProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
