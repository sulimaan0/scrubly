"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, Home, Calendar, LayoutDashboard, Settings, User, LogOut, Sparkles, Building2, Users, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const router = useRouter();
  const { data: session, isPending, error } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Refresh session on window focus to catch auth state changes
  useEffect(() => {
    const handleFocus = () => {
      // Trigger a re-render by forcing session refresh
      router.refresh();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  // Don't show auth state until client has mounted to prevent hydration mismatch
  const isLoggedIn = hasMounted && !isPending && session && !error;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-semibold text-xl tracking-tight">
            Scrubly
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Services
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/booking?service=standard" className="cursor-pointer">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Standard Cleaning
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/booking?service=deep" className="cursor-pointer">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Deep Cleaning
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/booking?service=move" className="cursor-pointer">
                    <Home className="h-4 w-4 mr-2" />
                    Move In/Out Cleaning
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/booking?service=office" className="cursor-pointer">
                    <Building2 className="h-4 w-4 mr-2" />
                    Office Cleaning
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link href="/how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            {isLoggedIn && (
              <Link href="/dashboard/customer" className="text-sm font-medium text-foreground hover:text-muted-foreground transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-4">
            {!hasMounted || isPending ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-lg" />
            ) : isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium max-w-[120px] truncate">{session.user?.name || "Account"}</span>
                      <span className="text-xs text-muted-foreground">My Account</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{session.user?.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{session.user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/customer" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/booking" className="cursor-pointer">
                      <Calendar className="h-4 w-4 mr-2" />
                      New Booking
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/customer?tab=bookings" className="cursor-pointer">
                      <Home className="h-4 w-4 mr-2" />
                      My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Button asChild size="sm" className="h-9 px-4">
                  <Link href="/booking">Book Now</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <nav className="flex flex-col gap-1">
              {/* Services Section */}
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">Services</div>
              <Link
                href="/booking?service=standard"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                Standard Cleaning
              </Link>
              <Link
                href="/booking?service=deep"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                Deep Cleaning
              </Link>
              <Link
                href="/booking?service=move"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                Move In/Out Cleaning
              </Link>
              <Link
                href="/booking?service=office"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Building2 className="h-4 w-4" />
                Office Cleaning
              </Link>

              {/* Company Section */}
              <div className="px-3 py-2 mt-2 text-xs font-semibold text-muted-foreground uppercase">Company</div>
              <Link
                href="/how-it-works"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="/pricing"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/about"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Phone className="h-4 w-4" />
                Contact
              </Link>

              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2 mt-2 text-xs font-semibold text-muted-foreground uppercase">Account</div>
                  <Link
                    href="/dashboard/customer"
                    className="px-3 py-2.5 text-sm font-medium hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/booking"
                    className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Calendar className="h-4 w-4" />
                    New Booking
                  </Link>
                  <Link
                    href="/settings"
                    className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/profile"
                    className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-2.5 text-sm text-red-600 hover:bg-secondary rounded-lg text-left transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-border/40">
                  <Link
                    href="/login"
                    className="px-3 py-2.5 text-sm hover:bg-secondary rounded-lg transition-colors text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/booking"
                    className="px-3 py-2.5 text-sm bg-primary text-primary-foreground rounded-lg text-center transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Book Now
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
