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
  const [debugInfo, setDebugInfo] = useState<string>("");

  // Show last login attempt info on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      const lastError = localStorage.getItem('lastLoginError');
      const lastResult = localStorage.getItem('lastLoginResult');
      if (lastError) {
        console.log("[LOGIN] Previous login error:", lastError);
      }
      if (lastResult) {
        console.log("[LOGIN] Previous login result:", lastResult);
        setDebugInfo(lastResult);
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[LOGIN] Form submitted");
    console.log("[LOGIN] Callback URL:", callbackUrl);
    console.log("[LOGIN] Email:", email);

    // Store in localStorage for debugging
    localStorage.setItem('lastLoginAttempt', JSON.stringify({
      timestamp: new Date().toISOString(),
      email,
      callbackUrl
    }));

    setLoading(true);
    setError("");

    try {
      console.log("[LOGIN] Calling signIn.email");
      const result = await signIn.email({ email, password });
      console.log("[LOGIN] SignIn result:", JSON.stringify({
        hasError: !!result.error,
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        hasData: !!result.data
      }, null, 2));

      localStorage.setItem('lastLoginResult', JSON.stringify({
        timestamp: new Date().toISOString(),
        hasError: !!result.error,
        errorMessage: result.error?.message,
        errorCode: result.error?.code,
        hasData: !!result.data
      }));

      if (result.error) {
        console.error("[LOGIN] SignIn failed:", result.error);
        const errorMsg = `Login failed: ${result.error.message || result.error.code || 'Unknown error'}`;
        console.error("[LOGIN]", errorMsg);
        setError(errorMsg);
        localStorage.setItem('lastLoginError', errorMsg);
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
        console.log("[LOGIN] Waiting 500ms for cookies to be set...");

        // Wait for cookies to be fully set before redirecting
        await new Promise(resolve => setTimeout(resolve, 500));

        // Check if cookies are set before redirect
        const allCookies = document.cookie;
        console.log("[LOGIN] All cookies before redirect:", allCookies);
        console.log("[LOGIN] Has better-auth cookie:", allCookies.includes('better-auth'));

        // Log each cookie individually
        if (allCookies) {
          const cookies = allCookies.split(';').map(c => c.trim());
          console.log("[LOGIN] Cookie list:");
          cookies.forEach(cookie => {
            console.log("  -", cookie.substring(0, 50) + (cookie.length > 50 ? "..." : ""));
          });
        } else {
          console.error("[LOGIN] NO COOKIES FOUND! This is the problem!");
        }

        console.log("[LOGIN] Performing redirect now");
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
              <strong>Error:</strong> {error}
            </div>
          )}

          {debugInfo && !error && (
            <div className="p-3 text-xs text-gray-600 bg-gray-50 rounded-xl font-mono">
              <strong>Last attempt:</strong> {debugInfo}
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
