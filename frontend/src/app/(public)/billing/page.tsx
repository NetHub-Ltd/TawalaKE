// app/(public)/billing/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { 
  CheckCircle2, 
  Store, 
  TrendingUp, 
  Building2, 
  Lock,
  Sparkles,
  HelpCircle,
  ShieldCheck
} from "lucide-react";

export const metadata: Metadata = {
  title: "Simple Plans Built for Your Biashara Scale | Tawala",
  description:
    "No confusing software talk or hidden pricing surprises. Explore our three tailored options built around the real size of your Kenyan business.",
  alternates: {
    canonical: "https://tawala.co.ke/billing", // Absolute canonical URLs prevent cross-domain duplicate indexing issues
  },
};

export default function BillingPage() {
  // Enhanced schema offering structured product and availability data to search engines
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Tawala Platform Plans Breakdown",
    "description": "Simple, easy-to-understand plans crafted to match single shops, growing retail brands, and multi-branch networks in Kenya.",
    "publisher": {
      "@type": "Organization",
      "name": "Tawala Technology",
      "url": "https://tawala.co.ke"
    },
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Single Biashara"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Business Growth"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Enterprise Network"
        }
      ]
    }
  };

  const tiers = [
    {
      name: "Single Biashara",
      icon: <Store size={22} className="text-blue-600" aria-hidden="true" />,
      tagline: "Ditch the exercise books",
      description: "Crafted specifically for single retail shops, small kiosks, duka storefronts, and early-stage entrepreneurs ready to clean up their operations and track everyday sales effortlessly.",
      features: [
        "Record daily counter sales in seconds",
        "Move completely away from missing physical logs",
        "Basic stock count tracking to know what's on shelves",
        "Simple end-of-day summary reports sent to your phone",
        "Works smoothly offline even when local networks drop",
      ],
      isPopular: false,
      badge: "Single Shop Base",
      bgClass: "from-blue-50/30",
    },
    {
      name: "Business Growth",
      icon: <TrendingUp size={22} className="text-primary" aria-hidden="true" />,
      tagline: "Our Sweet Spot for Expanding Brands",
      description: "Engineered for busy retail hubs, mini-marts, hardwares, and pharmacies looking for tight, automated staff accountability and complete protection over daily margins.",
      features: [
        "Add unlimited counter cashiers and attendants",
        "Live stock countdowns with automatic low-supply alerts",
        "Smart alerts to clear out items before they expire",
        "True daily net profit tracking minus store expenses",
        "Link multiple physical branch store data streams together",
        "Priority access to our local support team whenever needed",
      ],
      isPopular: true,
      badge: "Highly Recommended Option",
      bgClass: "from-primary/[0.03]",
    },
    {
      name: "Enterprise Network",
      icon: <Building2 size={22} className="text-purple-600" aria-hidden="true" />,
      tagline: "Heavy-duty retail infrastructure",
      description: "Tailored directly for complex, high-volume operational ecosystems like regional supermarkets, wholesale depots, and sprawling shopping malls requiring large distribution.",
      features: [
        "Includes everything found inside our Growth Plan",
        "Synchronize massive central warehouse distribution streams",
        "Track corporate supplier invoices and purchases automatically",
        "Dedicated database architecture for absolute speed stability",
        "Deep audit logs to track exact user permissions back in time",
        "Direct 24/7 priority phone line for onboarding help",
      ],
      isPopular: false,
      badge: "Malls & Supermarkets",
      bgClass: "from-purple-50/30",
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main id="main-content" className="min-h-screen w-full bg-[#fafbfc] text-[#2d3142] relative overflow-x-hidden selection:bg-primary/20 scroll-smooth">
        
        {/* Soft atmospheric background branding elements */}
        <div className="absolute top-[-5%] right-[-5%] w-[600px] h-[600px] bg-[#f0f5ff] rounded-full blur-[130px] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-[#fff0f2] rounded-full blur-[110px] pointer-events-none" aria-hidden="true" />

        {/* --- HERO SECTION --- */}
        <section className="max-w-4xl mx-auto text-center pt-24 pb-16 px-6 relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full">
            <Sparkles size={14} className="text-primary" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Simple, Honest Choices
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-[#1e2229] leading-[1.15]">
            Plans Built for Your Scale. <br />
            <span className="text-primary bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text">
              No Hidden Surprises.
            </span>
          </h1>

          <p className="text-[#5c6479] text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            We don&apos;t believe in hitting you with complex corporate enterprise pricing games. Choose the plan that mirrors your physical storefront layout.
          </p>
        </section>

        {/* --- THREE TIER MARKETING MATRIX --- */}
        <section className="max-w-6xl mx-auto px-6 pb-24 relative z-10" aria-label="Available subscription choices">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {tiers.map((tier, index) => (
              <article
                key={index}
                className={`bg-white rounded-[2rem] border p-6 md:p-8 flex flex-col justify-between relative transition-all duration-300 shadow-soft group bg-gradient-to-br via-transparent to-transparent ${
                  tier.isPopular 
                    ? "border-primary ring-4 ring-primary/5 lg:scale-[1.04] z-20" 
                    : "border-slate-100 hover:border-primary/20 hover:shadow-md"
                } ${tier.bgClass}`}
              >
                {/* Floating Category Badge */}
                <div className="absolute top-5 right-5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                    tier.isPopular 
                      ? "bg-primary text-white" 
                      : "bg-[#f1f3f7] text-[#5c6479]"
                  }`}>
                    {tier.badge}
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Category Header Card info */}
                  <div className="space-y-3">
                    <div className="h-11 w-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
                      {tier.icon}
                    </div>
                    <div>
                      {/* Fixed Hierarchy: Adjusted to H2 to guarantee sequential heading orders */}
                      <h2 className="text-xl font-black text-[#1e2229] uppercase tracking-tight">{tier.name}</h2>
                      <p className="text-[11px] font-bold text-primary uppercase tracking-wide mt-0.5">{tier.tagline}</p>
                    </div>
                    <p className="text-[#5c6479] text-xs font-medium leading-relaxed pt-1">
                      {tier.description}
                    </p>
                  </div>

                  {/* Soft Visual Separator Line */}
                  <div className="border-t border-dashed border-slate-100" aria-hidden="true" />

                  {/* Features Checklist */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">What you get to achieve:</p>
                    <ul className="space-y-3" aria-label={`${tier.name} features list`}>
                      {tier.features.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5 text-xs font-semibold text-[#3a3f50] leading-snug">
                          <CheckCircle2 size={15} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Conversion Interface Element */}
                <div className="pt-8 mt-auto">
                  <button
                    disabled
                    aria-describedby={`desc-${index}`}
                    className={`w-full h-14 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed transition-all duration-200 border ${
                      tier.isPopular
                        ? "bg-primary/90 text-white shadow-sm border-transparent"
                        : "bg-[#fafbfc] text-[#7d859a] border-slate-200/80"
                    }`}
                  >
                    <Lock size={13} aria-hidden="true" />
                    <span>Deployment Coming Soon</span>
                  </button>
                  <p id={`desc-${index}`} className="text-center text-[10px] font-medium text-slate-400 mt-2.5">
                    This operational blueprint is currently locked for early access deployment.
                  </p>
                </div>

              </article>
            ))}
          </div>
        </section>

        {/* --- REASSURANCE TRUST SECTION --- */}
        <section className="bg-white border-t border-slate-100 py-16 px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            {/* Fixed Hierarchy: Adjusted to H3 to follow the H2 cards sequentially */}
            <h3 className="text-lg font-bold text-[#1e2229]">Unsure which plan matches your shop setup?</h3>
            <p className="text-xs md:text-sm font-medium text-[#5c6479] max-w-md mx-auto leading-relaxed">
              Don&apos;t stress about making the wrong call. Most expanding business owners safely start with our <span className="text-primary font-bold">Business Growth Plan</span> to get full staff tracking running immediately.
            </p>
            <div className="pt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400 font-medium">
              <HelpCircle size={13} className="text-primary" aria-hidden="true" />
              <span>Need special multi-warehouse setups? <Link href="/features" className="text-slate-700 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1">See Feature Details</Link> or <Link href="/" className="text-slate-700 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-primary/40 rounded px-1">Return Home</Link>.</span>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}