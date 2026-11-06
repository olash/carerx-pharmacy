import type { Metadata, Viewport } from "next";
import { Inter, Newsreader } from "next/font/google";
import { RequestListProvider } from "@/components/providers/request-list";
import { ToastProvider } from "@/components/providers/toast";
import { site } from "@/lib/config";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: { default: `${site.name} — Request medicines & talk to a pharmacist`, template: `%s · ${site.name}` },
  description: site.description,
};

export const viewport: Viewport = { themeColor: "#1f5c3e" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <ToastProvider>
          <RequestListProvider>{children}</RequestListProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
