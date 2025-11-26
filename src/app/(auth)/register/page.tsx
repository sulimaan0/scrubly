"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signUp } from "@/lib/auth-client";

function RegisterForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CUSTOMER",
    postcode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[REGISTER] Form submitted");
    console.log("[REGISTER] Callback URL:", callbackUrl);
    setLoading(true);
    setError("");

    try {
      // Step 1: Create user with Better Auth (proper password hashing)
      console.log("[REGISTER] Calling signUp.email");
      const signUpResult = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (signUpResult.error) {
        console.error("[REGISTER] SignUp failed:", signUpResult.error);
        setError(signUpResult.error.message || "Registration failed");
        return;
      }

      console.log("[REGISTER] User created successfully");

      // Step 2: Update role and create cleaner profile (no auth required)
      console.log("[REGISTER] Setting role to:", formData.role);
      const roleResponse = await fetch("/api/users/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          role: formData.role,
          postcode: formData.role === "CLEANER" ? formData.postcode : undefined,
        }),
      });

      if (!roleResponse.ok) {
        const roleError = await roleResponse.json();
        console.error("[REGISTER] Failed to set role:", roleError);
        setError("Failed to set user role. Please contact support.");
        return;
      }

      console.log("[REGISTER] Role set successfully to:", formData.role);

      // Step 3: Handle post-registration flow based on role
      if (formData.role === "CLEANER") {
        // Cleaners: Auto-login and redirect to dashboard immediately
        console.log("[REGISTER] Cleaner registration, auto-logging in");

        const signInResult = await signIn.email({
          email: formData.email,
          password: formData.password,
        });

        if (signInResult.error) {
          console.error("[REGISTER] Auto sign-in failed:", signInResult.error);
          setError("Registration successful but sign-in failed. Please sign in manually.");
          return;
        }

        // Send verification email in background (optional, doesn't block access)
        fetch("/api/auth/send-verification-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        }).catch(err => console.error("Failed to send verification email:", err));

        // Wait for session to establish
        await new Promise(resolve => setTimeout(resolve, 500));

        console.log("[REGISTER] Redirecting cleaner to dashboard");
        window.location.href = "/dashboard/cleaner";
      } else {
        // Customers: Require email verification before access
        await fetch("/api/auth/send-verification-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: formData.email }),
        });

        console.log("[REGISTER] Registration successful, redirecting to verify email page");
        window.location.href = `/verify-email?email=${encodeURIComponent(formData.email)}`;
      }
    } catch (err) {
      console.error("[REGISTER] Registration error:", err);
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
          <h1 className="text-2xl font-semibold mt-6 mb-2">Create an account</h1>
          <p className="text-muted-foreground">Get started with Scrubly</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <Label className="text-sm mb-2 block">Full name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-14"
              required
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="h-14"
              required
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="h-14"
              required
              minLength={8}
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">I want to</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="CUSTOMER">Book cleaning services</SelectItem>
                <SelectItem value="CLEANER">Work as a cleaner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "CLEANER" && (
            <div>
              <Label className="text-sm mb-2 block">Your postcode</Label>
              <Input
                id="postcode"
                value={formData.postcode}
                onChange={(e) => setFormData({ ...formData, postcode: e.target.value.toUpperCase() })}
                placeholder="e.g. SW1A 1AA"
                className="h-14"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive jobs within 10 miles of this location
              </p>
            </div>
          )}

          <Button type="submit" className="w-full h-14" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-foreground hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
