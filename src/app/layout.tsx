import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "Scrubly - Professional Cleaning Services",
    template: "%s | Scrubly",
  },
  description: "Book vetted, insured professional cleaners in minutes. Standard cleans, deep cleans, move in/out, and office cleaning. Satisfaction guaranteed.",
  keywords: [
    "cleaning services",
    "professional cleaners",
    "house cleaning",
    "deep cleaning",
    "end of tenancy cleaning",
    "office cleaning",
    "domestic cleaning",
    "home cleaning",
    "cleaning company",
    "book cleaner online",
  ],
  authors: [{ name: "Scrubly" }],
  creator: "Scrubly",
  publisher: "Scrubly",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: "Scrubly",
    title: "Scrubly - Professional Cleaning Services",
    description: "Book vetted, insured professional cleaners in minutes. Satisfaction guaranteed.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scrubly - Professional Cleaning Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrubly - Professional Cleaning Services",
    description: "Book vetted, insured professional cleaners in minutes. Satisfaction guaranteed.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} antialiased`}>{children}</body>
    </html>
  );
}
