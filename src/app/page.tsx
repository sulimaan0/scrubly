import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/navbar";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Scrubly",
  description: "Professional cleaning services. Book vetted, insured cleaners in minutes.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  priceRange: "££",
  serviceType: ["House Cleaning", "Deep Cleaning", "Office Cleaning", "End of Tenancy Cleaning"],
  areaServed: {
    "@type": "Country",
    name: "United Kingdom",
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative py-24 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight mb-6">
                A cleaner home,
                <br />
                without the hassle
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
                Book trusted, background-checked cleaners in your area.
                Flexible scheduling, transparent pricing.
              </p>

              {/* Postcode Input */}
              <form action="/booking" method="GET" className="max-w-md mx-auto mb-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    name="postcode"
                    placeholder="Your postcode"
                    className="h-14 sm:h-14 text-base px-5 bg-secondary/50 border-0 focus-visible:ring-1"
                    required
                  />
                  <Button type="submit" size="lg" className="h-14 sm:h-14 px-8 w-full sm:w-auto">
                    Get started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Vetted cleaners</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Insured service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Satisfaction guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-semibold mb-4">Our services</h2>
              <p className="text-muted-foreground">
                From regular maintenance to deep cleans, we've got you covered
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {[
                {
                  name: "Standard Clean",
                  price: "From £50",
                  desc: "Regular upkeep for a consistently clean home"
                },
                {
                  name: "Deep Clean",
                  price: "From £100",
                  desc: "Thorough cleaning for every corner and surface"
                },
                {
                  name: "Move In/Out",
                  price: "From £150",
                  desc: "Get your deposit back with end of tenancy clean"
                },
                {
                  name: "Office Clean",
                  price: "From £80",
                  desc: "Professional workspace cleaning services"
                },
              ].map((service) => (
                <div
                  key={service.name}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-border/50 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg mb-1">{service.name}</h3>
                  <p className="text-2xl font-semibold mb-3">{service.price}</p>
                  <p className="text-sm text-muted-foreground">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-semibold mb-4">How it works</h2>
              <p className="text-muted-foreground">
                Book your clean in under two minutes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto">
              {[
                {
                  step: "01",
                  title: "Enter your details",
                  desc: "Tell us about your property and choose a service that fits your needs",
                },
                {
                  step: "02",
                  title: "Pick a time",
                  desc: "Select a date and time slot that works for your schedule",
                },
                {
                  step: "03",
                  title: "Relax",
                  desc: "A vetted cleaner arrives at your door. Payment is handled securely online",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="text-5xl font-light text-muted-foreground/30 mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-foreground text-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-semibold mb-4">Ready to get started?</h2>
            <p className="text-background/70 mb-8 max-w-md mx-auto">
              Join thousands of happy customers who trust Scrubly for their cleaning needs
            </p>
            <Button asChild size="lg" variant="secondary" className="h-12 px-8">
              <Link href="/booking">
                Book your clean
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-semibold text-lg">Scrubly</div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Scrubly. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
