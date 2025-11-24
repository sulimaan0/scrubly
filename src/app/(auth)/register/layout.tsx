import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a Scrubly account to book professional cleaning services. Join as a customer or register as a cleaner.",
  openGraph: {
    title: "Create Account | Scrubly",
    description: "Create a Scrubly account to book professional cleaning services.",
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
