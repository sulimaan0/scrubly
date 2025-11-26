"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedCode = value.slice(0, 6).split("");
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (index + i < 6) {
          newCode[index + i] = char;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    if (verificationCode.length !== 6) {
      setMessage("Please enter the complete 6-digit code.");
      return;
    }

    setVerifying(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: verificationCode, email }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log("[VERIFY] Verification successful, user data:", data.user);

        // Redirect to dashboard based on role
        let redirectPath = "/dashboard/customer";
        if (data.user?.role === "CLEANER") {
          redirectPath = "/dashboard/cleaner";
          console.log("[VERIFY] User is CLEANER, redirecting to cleaner dashboard");
        } else if (data.user?.role === "ADMIN") {
          redirectPath = "/dashboard/admin";
        } else if (data.user?.role === "SUPER_ADMIN") {
          redirectPath = "/dashboard/super-admin";
        } else {
          console.log("[VERIFY] User role is:", data.user?.role, "redirecting to customer dashboard");
        }

        console.log("[VERIFY] Final redirect path:", redirectPath);
        window.location.href = redirectPath;
      } else {
        setMessage(data.error || "Invalid or expired code. Please try again.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setMessage("New code sent! Check your inbox.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to send code. Please try again.");
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold">
            Scrubly
          </Link>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-foreground rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-background" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Enter verification code</h1>
            <p className="text-muted-foreground">
              {email
                ? `We've sent a 6-digit code to ${email}`
                : "We've sent a 6-digit code to your email"}
            </p>
          </div>

          {message && (
            <div className={`p-3 text-sm rounded-xl ${
              message.includes("sent") || message.includes("success")
                ? "text-green-600 bg-green-50"
                : "text-red-600 bg-red-50"
            }`}>
              {message}
            </div>
          )}

          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-xl font-semibold"
                disabled={verifying}
              />
            ))}
          </div>

          <Button
            onClick={handleVerify}
            disabled={verifying || code.join("").length !== 6}
            className="w-full h-14"
          >
            {verifying ? "Verifying..." : "Verify email"}
          </Button>

          <div className="text-center">
            <button
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {resending ? (
                <>
                  <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                "Didn't receive the code? Resend"
              )}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
