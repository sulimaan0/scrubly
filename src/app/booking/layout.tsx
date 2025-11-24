import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Clean",
  description: "Book professional cleaning services online. Choose from standard, deep, move in/out, or office cleaning. Get instant quotes and flexible scheduling.",
  openGraph: {
    title: "Book a Clean | Scrubly",
    description: "Book professional cleaning services online. Get instant quotes and flexible scheduling.",
  },
};

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
