import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { DemoStoreProvider } from "@/lib/demo-store";
import "./globals.css";

// Both families include Cyrillic so Russian text renders in the same typeface.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "MedPrep — Learn the medicine. Master the Russian exam.",
    template: "%s · MedPrep",
  },
  description:
    "Exam preparation for English-speaking medical graduates taking Russian Primary Accreditation in General Medicine.",
};

export const viewport: Viewport = {
  themeColor: "#f7f9fb",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full">
        <DemoStoreProvider>{children}</DemoStoreProvider>
      </body>
    </html>
  );
}
