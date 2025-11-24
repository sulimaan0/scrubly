import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Scrubly account to manage bookings, view history, and track your cleaning appointments.",
  openGraph: {
    title: "Sign In | Scrubly",
    description: "Sign in to your Scrubly account to manage bookings and track appointments.",
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
