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
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 gradient-purple opacity-[0.03]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(107,95,237,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.08),transparent_50%)]" />

          <div className="container mx-auto px-6 relative">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
                A cleaner home,
                <br />
                without the hassle
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
                Book trusted, background-checked cleaners in your area.
                Flexible scheduling, transparent pricing.
              </p>

              {/* Postcode Input */}
              <form action="/booking" method="GET" className="max-w-xl mx-auto mb-12">
                <div className="flex flex-col sm:flex-row gap-4 p-2 bg-white rounded-2xl shadow-xl border border-border/50">
                  <Input
                    name="postcode"
                    placeholder="Enter your postcode"
                    className="h-14 text-base px-6 bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 font-medium"
                    required
                  />
                  <Button type="submit" size="lg" className="h-14 px-8 w-full sm:w-auto rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>

              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-border/40">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <span className="font-medium text-gray-700">Vetted cleaners</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-border/40">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <span className="font-medium text-gray-700">Insured service</span>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-border/40">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <span className="font-medium text-gray-700">Satisfaction guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Our services</h2>
              <p className="text-lg text-muted-foreground">
                From regular maintenance to deep cleans, we've got you covered
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
                  className="bg-white rounded-2xl p-8 shadow-sm border border-border/40 hover:shadow-lg hover:border-primary/20 transition-all group"
                >
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                  <p className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{service.price}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">How it works</h2>
              <p className="text-lg text-muted-foreground">
                Book your clean in under two minutes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
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
                <div key={item.step} className="text-center relative">
                  <div className="text-7xl font-bold bg-gradient-to-br from-primary/20 to-secondary/20 bg-clip-text text-transparent mb-6">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-2xl mb-4">{item.title}</h3>
                  <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 gradient-purple relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container mx-auto px-6 text-center relative">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Ready to get started?</h2>
            <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of happy customers who trust Scrubly for their cleaning needs
            </p>
            <Button asChild size="lg" variant="secondary" className="h-14 px-10 rounded-xl font-bold shadow-2xl hover:shadow-xl transition-all text-base">
              <Link href="/booking">
                Book your clean
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="font-bold text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Scrubly</div>
            <div className="text-sm text-muted-foreground font-medium">
              © {new Date().getFullYear()} Scrubly. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
