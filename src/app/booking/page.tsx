"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { calculatePrice, formatPrice, EXTRAS_PRICES, OFFICE_EXTRAS_PRICES, cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { PaymentForm } from "@/components/payment-form";
import { useSession, signUp, signIn } from "@/lib/auth-client";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STEPS = ["Service", "Property", "Schedule", "Review", "Payment"];

const TIME_SLOTS = [
  { value: "08:00-10:00", label: "8:00 – 10:00 AM" },
  { value: "10:00-12:00", label: "10:00 AM – 12:00 PM" },
  { value: "12:00-14:00", label: "12:00 – 2:00 PM" },
  { value: "14:00-16:00", label: "2:00 – 4:00 PM" },
  { value: "16:00-18:00", label: "4:00 – 6:00 PM" },
];

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [clientSecret, setClientSecret] = useState("");

  // Inline auth state
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [authData, setAuthData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Initialize form data
  const [formData, setFormData] = useState({
    postcode: searchParams.get("postcode") || "",
    serviceType: "STANDARD" as "STANDARD" | "DEEP" | "MOVE_IN_OUT" | "OFFICE",
    propertyType: "APARTMENT" as "APARTMENT" | "HOUSE" | "STUDIO" | "OFFICE",
    bedrooms: 1,
    bathrooms: 1,
    desks: 0,
    meetingRooms: 0,
    restrooms: 1,
    extras: [] as string[],
    address: "",
    city: "",
    date: "",
    timeSlot: "",
    instructions: "",
  });

  const price = calculatePrice(
    formData.serviceType,
    formData.bedrooms,
    formData.bathrooms,
    formData.extras,
    formData.serviceType === "OFFICE" ? {
      desks: formData.desks,
      meetingRooms: formData.meetingRooms,
      restrooms: formData.restrooms,
    } : undefined
  );


  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!formData.address || !formData.city || !formData.postcode) {
        setError("Please fill in all address fields");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.date || !formData.timeSlot) {
        setError("Please select a date and time");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleCreatePaymentIntent = async () => {
    console.log("[BOOKING] handleCreatePaymentIntent called");
    console.log("[BOOKING] Current session state:", {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
      isPending: sessionLoading
    });

    setLoading(true);
    setError("");

    try {
      console.log("[BOOKING] Making API call to create payment intent");
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, price }),
      });

      console.log("[BOOKING] API response status:", res.status);

      if (res.status === 401) {
        // This shouldn't happen with inline auth, but handle it gracefully
        const data = await res.json();
        console.log("[BOOKING] 401 Unauthorized");
        setError(data.error || "Please sign in to continue");
        return;
      }

      const data = await res.json();
      console.log("[BOOKING] Payment intent response:", data);

      if (data.clientSecret) {
        console.log("[BOOKING] Client secret received, moving to payment step");
        setClientSecret(data.clientSecret);
        setStep(4);
      } else {
        console.error("[BOOKING] No client secret in response:", data);
        setError(data.error || "Failed to create payment");
      }
    } catch (err) {
      console.error("[BOOKING] Payment intent error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Use window.location.href for full page reload to ensure session is active
    window.location.href = "/dashboard/customer?success=true";
  };

  // Inline authentication handlers
  const handleInlineSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const result = await signUp.email({
        email: authData.email,
        password: authData.password,
        name: authData.name,
      });

      if (result.error) {
        setAuthError(result.error.message || "Registration failed");
        setAuthLoading(false);
        return;
      }

      // Sign in to establish session for setting role
      const signInResult = await signIn.email({
        email: authData.email,
        password: authData.password,
      });

      if (!signInResult.error) {
        // Set user role
        await fetch("/api/users/role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ role: "CUSTOMER" }),
        });
      }

      // Send verification code
      await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authData.email }),
      });

      // Redirect to verify email page with email parameter
      setAuthLoading(false);
      window.location.href = `/verify-email?email=${encodeURIComponent(authData.email)}`;
    } catch (err) {
      setAuthError("An error occurred during registration");
      setAuthLoading(false);
    }
  };

  const handleInlineSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const result = await signIn.email({
        email: authData.email,
        password: authData.password,
      });

      if (result.error) {
        setAuthError(result.error.message || "Login failed");
        setAuthLoading(false);
        return;
      }

      // Check if email is verified
      const userData = await fetch("/api/users/role", { credentials: "include" });
      if (userData.ok) {
        const user = await userData.json();
        if (!user.emailVerified) {
          // Redirect to verify page
          window.location.href = `/verify-email?email=${encodeURIComponent(authData.email)}`;
          return;
        }
      }

      // Wait for session to be established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Automatically proceed to payment
      setAuthLoading(false);
      handleCreatePaymentIntent();
    } catch (err) {
      setAuthError("An error occurred during login");
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Fixed Progress Bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-2xl">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium transition-colors",
                  i < step ? "bg-foreground text-background" :
                  i === step ? "bg-foreground text-background" :
                  "bg-secondary text-muted-foreground"
                )}>
                  {i < step ? <Check className="h-3 w-3 sm:h-4 sm:w-4" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-16 md:w-24 h-0.5 mx-1 sm:mx-2",
                    i < step ? "bg-foreground" : "bg-secondary"
                  )} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            {STEPS.map((s) => (
              <span key={s} className="hidden sm:inline">{s}</span>
            ))}
            <span className="sm:hidden">{STEPS[step]}</span>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-row gap-8">
          {/* Main content */}
          <div className="flex-1 max-w-2xl">
            {/* Form Content */}
            <div className="space-y-8">
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 rounded-xl">
                  {error}
                </div>
              )}

              {step === 0 && (
                <div className="space-y-8">
                  <div>
                <h2 className="text-2xl font-semibold mb-2">Select your service</h2>
                <p className="text-muted-foreground">Choose the type of cleaning you need</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  {
                    value: "STANDARD",
                    label: "Standard",
                    desc: "Regular cleaning",
                    includes: [
                      "Dusting all surfaces",
                      "Vacuuming & mopping floors",
                      "Bathroom cleaning",
                      "Kitchen surfaces & sink",
                      "Making beds",
                      "Emptying bins"
                    ]
                  },
                  {
                    value: "DEEP",
                    label: "Deep Clean",
                    desc: "Thorough cleaning",
                    includes: [
                      "Everything in Standard, plus:",
                      "Inside oven & fridge",
                      "Inside cabinets & drawers",
                      "Window sills & frames",
                      "Skirting boards",
                      "Light switches & door handles",
                      "Behind furniture"
                    ]
                  },
                  {
                    value: "MOVE_IN_OUT",
                    label: "Move In/Out",
                    desc: "End of tenancy",
                    includes: [
                      "Everything in Deep Clean, plus:",
                      "Inside all appliances",
                      "Limescale removal",
                      "Wall marks & scuffs",
                      "Carpet deep clean",
                      "Window cleaning (interior)",
                      "Garage/storage areas"
                    ]
                  },
                  {
                    value: "OFFICE",
                    label: "Office",
                    desc: "Commercial spaces",
                    includes: [
                      "Desk & workstation cleaning",
                      "Computer & equipment dusting",
                      "Meeting rooms",
                      "Kitchen & break areas",
                      "Reception & common areas",
                      "Restroom sanitization",
                      "Floor care"
                    ]
                  },
                ].map((service) => (
                  <div
                    key={service.value}
                    className="group relative"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        // Auto-select extras based on service type
                        let autoExtras: string[] = [];
                        let updates: any = {
                          serviceType: service.value as typeof formData.serviceType,
                          extras: autoExtras,
                        };

                        if (service.value === "DEEP") {
                          autoExtras = ["oven", "fridge", "cabinets"];
                          updates.extras = autoExtras;
                        } else if (service.value === "MOVE_IN_OUT") {
                          autoExtras = ["oven", "fridge", "cabinets", "windows"];
                          updates.extras = autoExtras;
                        } else if (service.value === "OFFICE") {
                          updates.propertyType = "OFFICE";
                          updates.desks = 5;
                          updates.meetingRooms = 1;
                          updates.restrooms = 1;
                        }

                        setFormData({
                          ...formData,
                          ...updates
                        });
                      }}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                        formData.serviceType === service.value
                          ? "border-foreground bg-secondary/50"
                          : "border-border hover:border-foreground/30"
                      )}
                    >
                      <div className="font-medium">{service.label}</div>
                      <div className="text-sm text-muted-foreground">{service.desc}</div>
                      {service.value !== "STANDARD" && service.value !== "OFFICE" && (
                        <div className="text-xs text-green-600 mt-1">Includes extras</div>
                      )}
                    </button>
                    {/* Hover tooltip */}
                    <div className="absolute left-0 right-0 top-full mt-2 p-4 bg-white rounded-xl border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <div className="text-sm font-medium mb-2">What's included:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {service.includes.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Add extras</Label>
                <div className="space-y-3">
                  {Object.entries(
                    formData.serviceType === "OFFICE" ? OFFICE_EXTRAS_PRICES : EXTRAS_PRICES
                  ).map(([key, extraPrice]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between p-3 rounded-xl border hover:bg-secondary/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={key}
                          checked={formData.extras.includes(key)}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              extras: checked
                                ? [...formData.extras, key]
                                : formData.extras.filter((e: string) => e !== key),
                            });
                          }}
                        />
                        <span className="text-sm capitalize">{key.replace(/-/g, " ")}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">+{formatPrice(extraPrice)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Property details</h2>
                <p className="text-muted-foreground">Tell us about your space</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Property type</Label>
                  <Select value={formData.propertyType} onValueChange={(v) => setFormData({ ...formData, propertyType: v as typeof formData.propertyType })}>
                    <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STUDIO">Studio</SelectItem>
                      <SelectItem value="APARTMENT">Apartment</SelectItem>
                      <SelectItem value="HOUSE">House</SelectItem>
                      <SelectItem value="OFFICE">Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.serviceType === "OFFICE" ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm mb-2 block">Number of Desks</Label>
                        <Select value={String(formData.desks)} onValueChange={(v) => setFormData({ ...formData, desks: parseInt(v) })}>
                          <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0, 5, 10, 15, 20, 25, 30, 40, 50].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm mb-2 block">Meeting Rooms</Label>
                        <Select value={String(formData.meetingRooms)} onValueChange={(v) => setFormData({ ...formData, meetingRooms: parseInt(v) })}>
                          <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Restrooms</Label>
                      <Select value={String(formData.restrooms)} onValueChange={(v) => setFormData({ ...formData, restrooms: parseInt(v) })}>
                        <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm mb-2 block">Bedrooms</Label>
                      <Select value={String(formData.bedrooms)} onValueChange={(v) => setFormData({ ...formData, bedrooms: parseInt(v) })}>
                        <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Bathrooms</Label>
                      <Select value={String(formData.bathrooms)} onValueChange={(v) => setFormData({ ...formData, bathrooms: parseInt(v) })}>
                        <SelectTrigger className="h-14"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm mb-2 block">Street address</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="h-14"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm mb-2 block">City</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-14"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm mb-2 block">Postcode</Label>
                    <Input
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      className="h-14"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Schedule</h2>
                <p className="text-muted-foreground">Pick a date and time</p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Date</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="h-14"
                    required
                  />
                </div>

                <div>
                  <Label className="text-sm mb-3 block">Time slot</Label>
                  <div className="grid grid-cols-1 gap-3">
                    {TIME_SLOTS.map((slot) => (
                      <button
                        key={slot.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, timeSlot: slot.value })}
                        className={cn(
                          "p-4 min-h-[56px] rounded-xl border-2 text-left text-sm font-medium transition-all",
                          formData.timeSlot === slot.value
                            ? "border-foreground bg-secondary/50"
                            : "border-border hover:border-foreground/30"
                        )}
                      >
                        {slot.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm mb-2 block">Special instructions (optional)</Label>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    className="flex min-h-[100px] w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Any specific requirements..."
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Review your booking</h2>
                <p className="text-muted-foreground">Confirm the details before payment</p>
              </div>

              <div className="rounded-2xl bg-secondary/50 p-6 space-y-4">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Service</span>
                  <span className="font-medium">{formData.serviceType.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Property</span>
                  <span>
                    {formData.serviceType === "OFFICE"
                      ? `${formData.desks} desks, ${formData.meetingRooms} rooms, ${formData.restrooms} restrooms`
                      : `${formData.bedrooms} bed, ${formData.bathrooms} bath ${formData.propertyType.toLowerCase()}`
                    }
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Address</span>
                  <span className="text-right">{formData.address}, {formData.city}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Date & time</span>
                  <span>{formData.date} · {formData.timeSlot}</span>
                </div>
                {formData.extras.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Extras</span>
                    <span className="capitalize">{formData.extras.map((e: string) => e.replace(/-/g, " ")).join(", ")}</span>
                  </div>
                )}
                <div className="flex justify-between pt-4">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-semibold">{formatPrice(price)}</span>
                </div>
              </div>

              {/* Inline Authentication */}
              {!session && !sessionLoading && (
                <div className="space-y-6 pt-6 border-t">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold">
                      {authMode === "register" ? "Create your account" : "Welcome back"}
                    </h3>
                    <p className="text-muted-foreground">
                      {authMode === "register"
                        ? "Get started with Scrubly"
                        : "Sign in to your account"}
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl">
                      {authError}
                    </div>
                  )}

                  <form onSubmit={authMode === "register" ? handleInlineSignUp : handleInlineSignIn} className="space-y-4">
                    {authMode === "register" && (
                      <div>
                        <Label className="text-sm mb-2 block">Full name</Label>
                        <Input
                          value={authData.name}
                          onChange={(e) => setAuthData({ ...authData, name: e.target.value })}
                          className="h-14"
                          required
                          disabled={authLoading}
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-sm mb-2 block">Email</Label>
                      <Input
                        type="email"
                        value={authData.email}
                        onChange={(e) => setAuthData({ ...authData, email: e.target.value })}
                        className="h-14"
                        required
                        disabled={authLoading}
                      />
                    </div>

                    <div>
                      <Label className="text-sm mb-2 block">Password</Label>
                      <Input
                        type="password"
                        value={authData.password}
                        onChange={(e) => setAuthData({ ...authData, password: e.target.value })}
                        className="h-14"
                        required
                        minLength={8}
                        disabled={authLoading}
                      />
                      {authMode === "register" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Minimum 8 characters
                        </p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-14" disabled={authLoading}>
                      {authLoading
                        ? (authMode === "register" ? "Creating account..." : "Signing in...")
                        : (authMode === "register" ? "Create account" : "Sign in")}
                    </Button>
                  </form>

                  <p className="text-center text-sm text-muted-foreground">
                    {authMode === "register" ? (
                      <>
                        Already have an account?{" "}
                        <button
                          onClick={() => {
                            setAuthMode("login");
                            setAuthError("");
                          }}
                          className="text-foreground hover:underline"
                          type="button"
                        >
                          Sign in
                        </button>
                      </>
                    ) : (
                      <>
                        Don't have an account?{" "}
                        <button
                          onClick={() => {
                            setAuthMode("register");
                            setAuthError("");
                          }}
                          className="text-foreground hover:underline"
                          type="button"
                        >
                          Sign up
                        </button>
                      </>
                    )}
                  </p>
                </div>
              )}

            </div>
          )}

          {step === 4 && clientSecret && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-2">Payment</h2>
                <p className="text-muted-foreground">Enter your card details to complete the booking</p>
              </div>

              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <PaymentForm price={price} onSuccess={handlePaymentSuccess} />
              </Elements>
            </div>
          )}

              {/* Navigation */}
              {step < 4 && (
                <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-6 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 0}
                    className="h-14 w-full sm:w-auto"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  {step < 3 ? (
                    <Button onClick={handleNext} className="h-14 px-6 w-full sm:w-auto">
                      Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    session && (
                      <Button onClick={handleCreatePaymentIntent} disabled={loading} className="h-14 px-8 w-full sm:w-auto">
                        {loading ? "Processing..." : "Continue to Payment"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Cart */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-40">
              <div className="rounded-2xl border bg-secondary/30 p-6">
                <h3 className="font-semibold mb-4">Your Booking</h3>

                {/* Service Type */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">
                      {formData.serviceType === "STANDARD" && "Standard Clean"}
                      {formData.serviceType === "DEEP" && "Deep Clean"}
                      {formData.serviceType === "MOVE_IN_OUT" && "Move In/Out"}
                      {formData.serviceType === "OFFICE" && "Office Clean"}
                    </span>
                  </div>

                  {/* Property */}
                  {formData.serviceType === "OFFICE" ? (
                    formData.desks > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Office Size</span>
                        <span>{formData.desks} desks</span>
                      </div>
                    )
                  ) : (
                    (formData.bedrooms > 0 || formData.bathrooms > 0) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Property</span>
                        <span>{formData.bedrooms} bed, {formData.bathrooms} bath</span>
                      </div>
                    )
                  )}

                  {/* Date & Time */}
                  {formData.date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date</span>
                      <span>{new Date(formData.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short"
                      })}</span>
                    </div>
                  )}
                  {formData.timeSlot && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time</span>
                      <span>{formData.timeSlot}</span>
                    </div>
                  )}

                  {/* Extras */}
                  {formData.extras.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="text-muted-foreground mb-2">Extras</div>
                      <div className="space-y-1">
                        {formData.extras.map((extra: string) => (
                          <div key={extra} className="flex justify-between">
                            <span className="capitalize">{extra.replace(/-/g, " ")}</span>
                            <span>+{formatPrice(EXTRAS_PRICES[extra] || OFFICE_EXTRAS_PRICES[extra] || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-semibold">{formatPrice(price)}</span>
                  </div>
                </div>

                {/* Location preview */}
                {formData.postcode && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      Location: {formData.city || "—"} {formData.postcode}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
