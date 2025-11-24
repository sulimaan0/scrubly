"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signUp } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
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
    setLoading(true);
    setError("");

    try {
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });

      if (result.error) {
        setError(result.error.message || result.error.code || "Registration failed");
      } else {
        // Update user role
        const roleResponse = await fetch("/api/users/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: formData.role,
            postcode: formData.role === "CLEANER" ? formData.postcode : undefined,
          }),
        });

        if (!roleResponse.ok) {
          setError("Failed to set user role");
          return;
        }

        const userData = await roleResponse.json();

        // Redirect based on role
        let redirectPath = "/dashboard/customer";
        if (userData.role === "CLEANER") {
          redirectPath = "/dashboard/cleaner";
        } else if (userData.role === "ADMIN") {
          redirectPath = "/dashboard/admin";
        } else if (userData.role === "SUPER_ADMIN") {
          redirectPath = "/dashboard/super-admin";
        }

        window.location.href = redirectPath;
      }
    } catch (err) {
      console.error("Registration error:", err);
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
              className="h-12"
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
              className="h-12"
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
              className="h-12"
              required
              minLength={8}
            />
          </div>

          <div>
            <Label className="text-sm mb-2 block">I want to</Label>
            <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
              <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
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
                className="h-12"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive jobs within 10 miles of this location
              </p>
            </div>
          )}

          <Button type="submit" className="w-full h-12" disabled={loading}>
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
