"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[LOGIN] Form submitted");
    console.log("[LOGIN] Callback URL:", callbackUrl);
    setLoading(true);
    setError("");

    try {
      console.log("[LOGIN] Calling signIn.email");
      const result = await signIn.email({ email, password });
      console.log("[LOGIN] SignIn result:", { error: result.error, data: result.data });

      if (result.error) {
        console.error("[LOGIN] SignIn failed:", result.error);
        setError(result.error.message || "Login failed");
      } else {
        console.log("[LOGIN] SignIn successful, fetching user role");
        const roleRes = await fetch("/api/users/role");

        console.log("[LOGIN] Role API response status:", roleRes.status);

        if (!roleRes.ok) {
          console.error("[LOGIN] Failed to fetch user role");
          setError("Failed to fetch user information");
          return;
        }

        const userData = await roleRes.json();
        console.log("[LOGIN] User data:", userData);

        // Use callbackUrl if present, otherwise redirect based on role
        let redirectPath = callbackUrl || "/dashboard/customer";

        if (!callbackUrl) {
          if (userData.role === "CLEANER") {
            redirectPath = "/dashboard/cleaner";
          } else if (userData.role === "ADMIN") {
            redirectPath = "/dashboard/admin";
          } else if (userData.role === "SUPER_ADMIN") {
            redirectPath = "/dashboard/super-admin";
          }
        }

        console.log("[LOGIN] Redirecting to:", redirectPath);
        window.location.href = redirectPath;
      }
    } catch (err) {
      console.error("[LOGIN] Login error:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-xl font-semibold">
            Scrubly
          </Link>
          <h1 className="text-2xl font-semibold mt-6 mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <Label className="text-sm mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12"
              required
            />
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
