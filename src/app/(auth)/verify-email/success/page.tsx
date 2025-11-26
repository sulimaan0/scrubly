"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/" className="text-xl font-semibold">
            Scrubly
          </Link>
        </div>

        <div className="bg-secondary/30 rounded-2xl p-8 mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>

          <h1 className="text-2xl font-semibold mb-2">Email verified!</h1>
          <p className="text-muted-foreground mb-6">
            Your email has been successfully verified. You can now sign in to your account.
          </p>

          <Button asChild className="w-full">
            <Link href="/login">Sign in to your account</Link>
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Go back to{" "}
          <Link href="/" className="text-foreground hover:underline">
            home page
          </Link>
        </p>
      </div>
    </div>
  );
}
