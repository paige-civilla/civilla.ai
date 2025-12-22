import { useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight, ChevronUp, ChevronDown, Home, X, ArrowDownRight } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import { Brand, BrandText } from "@/components/Brand";
import BrandMark from "@/components/BrandMark";

export const PRICING_PLANS = [
  {
    id: "trial",
    name: "three day trial",
    tagline: "Start free. Upgrade anytime.",
    cta: "start trial",
    monthly: 0,
    yearly: 0,
    priceNote: "three day trial",
    highlights: [
      "Case journey overview",
      "Basic document storage",
      "Learning Hub (education-only resources)",
      "Safety & Support hub access",
    ],
    finePrint: "No credit card required.",
  },
  {
    id: "core",
    name: "civilla core",
    tagline: "Build your case workspace.",
    cta: "start core",
    monthly: 19.99,
    yearly: 199.99,
    priceNote: "per month",
    highlights: [
      "Everything in trial, plus",
      "Create & manage your case journey",
      "Timeline building (events + milestones)",
      "Tasks & deadline tracking",
      "Document uploads + organization",
      "Readiness / preparation checklists",
      "Schedule templates",
    ],
    finePrint: "Cancel anytime.",
  },
  {
    id: "pro",
    name: "civilla pro",
    tagline: "For higher-conflict or higher-volume cases.",
    cta: "start pro",
    monthly: 29.99,
    yearly: 299.99,
    priceNote: "per month",
    highlights: [
      "Everything in core, plus",
      "Evidence map + communication log",
      "Court Prep Packet builder (organized export-ready packet)",
      "Draft documents workspace (education-only) + export",
      "PDF + DOCX export with watermark/disclaimer enforcement",
      "Lexi in-app guidance (context + navigation help)",
      "Quick wins + case health insights",
    ],
    finePrint: "Cancel anytime. Education-only tools — not legal advice.",
  },
  {
    id: "premium",
    name: "civilla premium",
    tagline: "For organizations and people who want hands-on support.",
    cta: "start premium",
    monthly: 49.99,
    yearly: 499.99,
    priceNote: "per month",
    highlights: [
      "Everything in pro, plus",
      "Priority support",
      "Onboarding help (setup + best practices)",
      "Nonprofit / shelter pricing options",
      "Team enablement (for approved org use)",
    ],
    finePrint: "Contact us for org onboarding details.",
  },
] as const;

export const YEARLY_SAVINGS_LABEL = "2 Mo. Free";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea]" data-testid="section-header">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="min-w-0">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] text-neutral-darkest">
              Plans &amp; Pricing
            </h1>
          </div>

          <div className="min-w-0">
            <p className="text-base sm:text-lg leading-relaxed text-neutral-darkest/80 max-w-[34rem]">
              Choose a plan that fits where you are. Whether you're learning the process,
              organizing your information, or preparing your next steps. No surprises, no hidden
              fees.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-neutral-darkest/70 max-w-[34rem] italic">
              *Educational, Research, And Organizational Support. Not Legal Advice Or Representation.*
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MostPopularSection({ billingPeriod, setBillingPeriod }: { billingPeriod: "monthly" | "yearly"; setBillingPeriod: (v: "monthly" | "yearly") => void }) {
  const proPlan = PRICING_PLANS.find(p => p.id === "pro")!;

  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-most-popular">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
              <span className="relative inline-block pb-2 md:pb-4">
                Most Popular
                <svg 
                  className="absolute left-0 right-0 -bottom-1 md:-bottom-2 w-full h-3 md:h-5" 
                  viewBox="0 0 200 20" 
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path 
                    d="M5 15 Q 40 5, 100 12 T 195 8" 
                    stroke="#0F3B2E" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.5"
                  />
                </svg>
              </span>
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-8 md:gap-12 items-center w-full md:max-w-[640px]">
          <div 
            className="inline-flex items-center rounded-full border border-black/20 bg-white p-1"
            role="group"
            aria-label="Billing period selection"
          >
            <button
              type="button"
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold transition",
                billingPeriod === "monthly" ? "bg-black text-white shadow-sm" : "text-black/70 hover:text-black",
              ].join(" ")}
              onClick={() => setBillingPeriod("monthly")}
              aria-pressed={billingPeriod === "monthly"}
              aria-label="Select monthly billing"
              data-testid="button-monthly"
            >
              Monthly
            </button>
            <button
              type="button"
              className={[
                "ml-1 rounded-full px-5 py-2 text-sm font-semibold transition flex items-center gap-2",
                billingPeriod === "yearly" ? "bg-black text-white shadow-sm" : "text-black/70 hover:text-black",
              ].join(" ")}
              onClick={() => setBillingPeriod("yearly")}
              aria-pressed={billingPeriod === "yearly"}
              aria-label="Select yearly billing with 2 months free"
              data-testid="button-yearly"
            >
              <span>Yearly</span>
              {billingPeriod === "yearly" ? (
                <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                  2 Mo. Free
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-black">
                  2 Mo. Free
                </span>
              )}
            </button>
          </div>

          <div className="bg-cream border-2 border-neutral-darkest rounded-2xl p-6 md:p-8 flex flex-col gap-6 md:gap-8 items-center w-full">
            <div className="flex flex-col gap-2 items-center text-neutral-darkest text-center w-full">
              <div className="text-2xl sm:text-3xl font-semibold">
                <BrandMark className="cv-brand-tight" />{" "}
                <span className="font-semibold">pro</span>
              </div>
              <div className="flex flex-col gap-1 items-center mt-2">
                <span className="pricing-display font-heading font-bold tracking-[0.48px] md:tracking-[0.84px] leading-[1.1]" style={{ fontSize: 'clamp(48px, 6vw, 84px)' }}>
                  {billingPeriod === "monthly" ? `$${proPlan.monthly}` : `$${proPlan.yearly}`}
                  <span className="price-period">{billingPeriod === "monthly" ? "/mo" : "/yr"}</span>
                </span>
              </div>
              <p className="mt-4 text-sm sm:text-base max-w-xl mx-auto opacity-90">
                {proPlan.tagline}
                <span className="font-semibold"> {proPlan.finePrint}</span>
              </p>
            </div>

            <div className="flex flex-col gap-4 py-2 w-full text-left">
              {proPlan.highlights.map((feature, index) => (
                <div key={index} className="flex gap-3 items-start w-full">
                  <Check className="w-5 md:w-6 h-5 md:h-6 text-neutral-darkest flex-shrink-0 mt-0.5" />
                  <span className="cv-panel-body font-sans text-sm md:text-[16px] leading-[1.6] text-neutral-darkest">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <Link 
              href="/plans#compare"
              className="w-full bg-bush text-white font-bold text-sm md:text-[18px] leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative text-center inline-flex items-center justify-center"
              data-testid="button-compare-plans"
            >
              Compare plans below
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCardsSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [mobilePlan, setMobilePlan] = useState<"trial" | "core" | "pro" | "premium">("core");

  const plans = [
    {
      id: "trial",
      name: "3-Day Trial",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      priceNote: "Ends automatically after 3 days. No auto-billing.",
      highlights: [
        "1 family law case",
        "Evidence upload",
        "Timeline",
        "Pattern insights",
        "Lexi education",
        "Educational document creator",
      ],
      cta: "Start Trial",
    },
    {
      id: "core",
      name: "Core",
      monthlyPrice: "$19.99",
      yearlyPrice: "$199",
      priceNote: "2 Mo. Free billed yearly",
      highlights: [
        "1 active family law case",
        "30 GB storage",
        "Interactive timeline",
        "Lexi research with citations",
        "Downloads and exports",
        "Tasks and reminders",
      ],
      cta: "Choose Core",
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: "$29.99",
      yearlyPrice: "$299",
      priceNote: "Advanced evidence workflows",
      badge: "Most Popular",
      highlights: [
        "50 GB storage",
        "Video uploads",
        "Advanced exhibits",
        "Dual OCR cross-check",
        "Trial prep organization",
        "Post-judgment workflows",
      ],
      cta: "Choose Pro",
    },
    {
      id: "premium",
      name: "Premium",
      monthlyPrice: "$49.99",
      yearlyPrice: "$499",
      priceNote: "Maximum capacity and tracking",
      highlights: [
        "100 GB storage",
        "Full exhibits management",
        "Multi-issue analytics views",
        "Discovery tracking",
        "Escalation reminders",
        "Appeals awareness",
      ],
      cta: "Choose Premium",
    },
  ] as const;

  const addOns = [
    {
      title: "Additional Case Slot",
      price: "$9.99 per month per additional case",
      bullets: ["+30 GB storage per case", "Full feature parity with your current plan"],
    },
    {
      title: "Archive Mode",
      price: "$4.99 per month",
      bullets: [
        "For high-conflict cases between court dates",
        "Evidence uploads and journaling",
        "Timeline storage preserved",
        "Reactivate full features anytime",
      ],
    },
    {
      title: "Over-Limit Processing Pack",
      price: "Starts at $19.99 one-time",
      bullets: [
        "Includes 200 additional analysis credits",
        "Internal soft limits",
        "In-app warnings if you get close",
        "No automatic overage charges",
        "Offered only if exceeded",
      ],
      footnote:
        "If you approach internal limits, we'll warn you. If exceeded, you'll see an optional one-time pack before any additional processing runs.",
    },
  ] as const;

  const groups = [
    {
      title: "Included In Every Plan",
      rows: [
        { label: "One Family Law Case", trial: true, core: true, pro: true, premium: true },
        { label: "Evidence Upload", trial: true, core: true, pro: true, premium: true },
        { label: "Timeline", trial: true, core: true, pro: true, premium: true },
        { label: "Pattern Insights", trial: true, core: true, pro: true, premium: true },
        { label: "Lexi Education", trial: true, core: true, pro: true, premium: true },
        { label: "Educational Document Creator", trial: true, core: true, pro: true, premium: true },
      ],
    },
    {
      title: "Starts In Core",
      rows: [
        { label: "One Active Family Law Case", trial: false, core: true, pro: true, premium: true },
        { label: "Storage", trial: false, core: true, pro: true, premium: true },
        { label: "Unlimited Document Uploads", trial: false, core: true, pro: true, premium: true },
        { label: "Interactive Timeline", trial: false, core: true, pro: true, premium: true },
        { label: "Lexi Research With Citations", trial: false, core: true, pro: true, premium: true },
        { label: "AI Document Analysis", trial: false, core: true, pro: true, premium: true },
        { label: "AI Deadline Extraction", trial: false, core: true, pro: true, premium: true },
        { label: "Task And Deadline Tracking", trial: false, core: true, pro: true, premium: true },
        { label: "Reminders", trial: false, core: true, pro: true, premium: true },
        { label: "Downloads And Exports", trial: false, core: true, pro: true, premium: true },
        { label: "Notices Of Service", trial: false, core: true, pro: true, premium: true },
        { label: "Certificates Of Service", trial: false, core: true, pro: true, premium: true },
        { label: "Parenting Plan Builder", trial: false, core: true, pro: true, premium: true },
        { label: "Child Support Estimator", trial: false, core: true, pro: true, premium: true },
        { label: "Exhibit Builder", trial: false, core: true, pro: true, premium: true },
        { label: "Audio Uploads", trial: false, core: true, pro: true, premium: true },
        { label: "Transcription", trial: false, core: true, pro: true, premium: true },
      ],
    },
    {
      title: "Starts In Pro",
      rows: [
        { label: "Video Uploads", trial: false, core: false, pro: true, premium: true },
        { label: "Advanced Exhibits", trial: false, core: false, pro: true, premium: true },
        { label: "Dual OCR Cross-Check", trial: false, core: false, pro: true, premium: true },
        { label: "Advanced Pattern Reporting", trial: false, core: false, pro: true, premium: true },
        { label: "Trial Prep Organization", trial: false, core: false, pro: true, premium: true },
        { label: "Draft Trial Binder Structure", trial: false, core: false, pro: true, premium: true },
        { label: "Mediation And Pre-Trial Workflows", trial: false, core: false, pro: true, premium: true },
        { label: "Post-Judgment Workflows", trial: false, core: false, pro: true, premium: true },
      ],
    },
    {
      title: "Premium Only",
      rows: [
        { label: "Two Active Family Law Cases", trial: false, core: false, pro: false, premium: true },
        { label: "Full Exhibits Management", trial: false, core: false, pro: false, premium: true },
        { label: "Multi-Issue Analytics Views", trial: false, core: false, pro: false, premium: true },
        { label: "Complex Discovery Tracking", trial: false, core: false, pro: false, premium: true },
        { label: "Escalation Reminders", trial: false, core: false, pro: false, premium: true },
        { label: "Appeals Awareness", trial: false, core: false, pro: false, premium: true },
      ],
    },
  ] as const;

  const scrollToFullFeatures = () => {
    const el = document.getElementById("full-features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const PriceLine = ({ plan }: { plan: (typeof plans)[number] }) => {
    const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    const suffix =
      plan.id === "trial" ? "" : billingPeriod === "yearly" ? "/yr" : "/mo";
    return (
      <div className="flex items-end gap-2">
        <div className="text-4xl font-black leading-none text-neutral-900">
          {price}
        </div>
        <div className="pb-1 text-sm font-semibold text-neutral-900/70">{suffix}</div>
      </div>
    );
  };

  const Cell = ({ on }: { on: boolean }) => (
    <div className="flex justify-center">
      {on ? (
        <Check className="h-4 w-4 text-neutral-900" aria-label="Included" />
      ) : (
        <X className="h-4 w-4 text-neutral-900/40" aria-label="Not included" />
      )}
    </div>
  );

  const MobileRow = ({ label, on }: { label: string; on: boolean }) => (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-900/10 py-3 last:border-b-0">
      <div className="min-w-0 text-sm font-semibold text-neutral-900/85">{label}</div>
      <div className="pt-[2px]">
        {on ? (
          <Check className="h-4 w-4 text-neutral-900" aria-label="Included" />
        ) : (
          <X className="h-4 w-4 text-neutral-900/40" aria-label="Not included" />
        )}
      </div>
    </div>
  );

  const getMobileValue = (row: { trial: boolean; core: boolean; pro: boolean; premium: boolean }) => {
    if (mobilePlan === "trial") return row.trial;
    if (mobilePlan === "core") return row.core;
    if (mobilePlan === "pro") return row.pro;
    return row.premium;
  };

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-10 md:px-6" id="compare">
      {/* SECOND HERO — Plans + Toggle + Button */}
      <div className="rounded-[28px] border border-neutral-900/15 bg-white/40 p-6 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="text-4xl font-black tracking-tight text-neutral-900 md:text-5xl">
              Choose Your Plan
            </h2>
            <p className="mt-2 max-w-2xl text-base text-neutral-900/75">
              All plans are educational and organizational tools for family law.
            </p>

            <button
              type="button"
              onClick={scrollToFullFeatures}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:opacity-80"
              data-testid="button-see-full-features"
            >
              See Full List Of Features
              <ArrowDownRight className="h-4 w-4" />
            </button>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full border border-neutral-900/15 bg-white/60 p-1">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  billingPeriod === "monthly"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-900/70 hover:text-neutral-900",
                ].join(" ")}
                data-testid="button-cards-monthly"
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={[
                  "ml-1 rounded-full px-4 py-2 text-sm font-semibold transition flex items-center gap-2",
                  billingPeriod === "yearly"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-900/70 hover:text-neutral-900",
                ].join(" ")}
                data-testid="button-cards-yearly"
              >
                <span>Yearly</span>
                {billingPeriod === "yearly" ? (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    2 Mo. Free
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-black">
                    2 Mo. Free
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 4 plan cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative flex h-full flex-col rounded-[24px] border border-neutral-900/15 bg-white/60 p-6 min-w-0"
              data-testid={`pricing-card-${plan.id}`}
            >
              {"badge" in plan && plan.badge ? (
                <div className="absolute -top-3 left-6 rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </div>
              ) : null}

              <div className="text-lg font-black text-neutral-900">{plan.name}</div>
              <div className="mt-4">
                <PriceLine plan={plan} />
              </div>

              <div className="my-5 h-px w-full bg-neutral-900/10" />

              <div className="text-sm font-semibold text-neutral-900">Highlights</div>
              <ul className="mt-3 space-y-2 text-sm text-neutral-900/80 mb-6">
                {plan.highlights.map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-[2px] h-4 w-4 text-neutral-900/70" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="mt-auto w-full rounded-full bg-[#0F3B2E] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-95"
                onClick={() => console.log("Selected plan:", plan.id)}
                data-testid={`button-${plan.cta.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Add-ons under the cards */}
        <div className="mt-10">
          <h3 className="text-2xl font-black text-neutral-900">Add-Ons</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
            {addOns.map((a) => (
              <div
                key={a.title}
                className="h-full rounded-[24px] border border-neutral-900/15 bg-white/60 p-6 min-w-0"
              >
                <div className="text-lg font-black text-neutral-900">{a.title}</div>
                <div className="mt-2 text-sm font-semibold text-neutral-900/70">{a.price}</div>
                <ul className="mt-4 space-y-2 text-sm text-neutral-900/80">
                  {a.bullets.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-[2px] h-4 w-4 text-neutral-900/70" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                {"footnote" in a && a.footnote ? (
                  <div className="mt-4 text-xs text-neutral-900/60">{a.footnote}</div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organizations hero box */}
      <div className="mt-10 rounded-[28px] border border-neutral-900/15 bg-white/40 p-6 md:p-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-start">
          <div className="md:col-span-7 min-w-0">
            <h3 className="text-3xl font-black text-neutral-900">Organizations & DV Shelters</h3>
            <p className="mt-2 text-base text-neutral-900/75">
              Custom pricing for domestic violence shelters, legal aid organizations, and advocacy groups.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {["Custom onboarding", "Privacy-first configurations", "Non-profit pricing", "Bulk access options"].map(
                (t) => (
                  <div
                    key={t}
                    className="rounded-2xl border border-neutral-900/15 bg-white/60 p-4 text-sm font-semibold text-neutral-900/80"
                  >
                    {t}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="md:col-span-5 min-w-0">
            <div className="rounded-[24px] border border-neutral-900/15 bg-white/60 p-6">
              <div className="text-sm font-semibold text-neutral-900">Custom pricing</div>
              <div className="mt-2 text-sm text-neutral-900/75">
                Contact us for onboarding and privacy-first configuration options.
              </div>

              <button
                type="button"
                className="mt-5 w-full rounded-full bg-[#0F3B2E] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-95"
                onClick={() => (window.location.href = "/contact")}
                data-testid="button-contact-org"
              >
                Contact Us
              </button>

              <div className="mt-4 text-xs text-neutral-900/60">
                <BrandMark /> is educational and organizational only. Not legal advice.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full feature comparison — MOBILE first */}
      <div id="full-features" className="mt-10 rounded-[28px] border border-neutral-900/15 bg-white/40 p-6 md:p-10">
        <div className="min-w-0">
          <h3 className="text-3xl font-black text-neutral-900">Full Feature Comparison</h3>
          <p className="mt-2 text-base text-neutral-900/75">
            Features listed by where they start. Higher tiers add more checkmarks.
          </p>
        </div>

        {/* Mobile: plan tabs + readable lists */}
        <div className="mt-6 md:hidden">
          <div className="inline-flex w-full overflow-x-auto rounded-full border border-neutral-900/15 bg-white/60 p-1">
            {[
              { id: "trial", label: "Trial" },
              { id: "core", label: "Core" },
              { id: "pro", label: "Pro" },
              { id: "premium", label: "Premium" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setMobilePlan(p.id as "trial" | "core" | "pro" | "premium")}
                className={[
                  "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
                  mobilePlan === p.id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-900/70 hover:text-neutral-900",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-5">
            {groups.map((g) => (
              <div key={g.title} className="rounded-2xl border border-neutral-900/15 bg-white/60 p-4">
                <div className="text-sm font-black text-neutral-900">{g.title}</div>
                <div className="mt-2">
                  {g.rows.map((r) => (
                    <MobileRow key={r.label} label={r.label} on={getMobileValue(r)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: table */}
        <div className="mt-6 hidden md:block overflow-x-auto rounded-2xl border border-neutral-900/15 bg-white/60">
          <table className="min-w-[720px] w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-900/10">
                <th className="px-4 py-4 text-left text-sm font-black text-neutral-900">Feature</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Trial</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Core</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Pro</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Premium</th>
              </tr>
            </thead>

            {groups.map((g) => (
              <tbody key={g.title}>
                <tr className="border-b border-neutral-900/10 bg-white/40">
                  <td colSpan={5} className="px-4 py-3 text-sm font-black text-neutral-900">
                    {g.title}
                  </td>
                </tr>

                {g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-neutral-900/10 last:border-b-0">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900/85">{r.label}</td>
                    <td className="px-4 py-3"><Cell on={r.trial} /></td>
                    <td className="px-4 py-3"><Cell on={r.core} /></td>
                    <td className="px-4 py-3"><Cell on={r.pro} /></td>
                    <td className="px-4 py-3"><Cell on={r.premium} /></td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      </div>
    </section>
  );
}

function OrganizationsSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-organizations">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-20 items-start w-full">
          <div className="flex-1 flex flex-col gap-4 md:gap-6 items-start">
            <Home className="w-10 md:w-12 h-10 md:h-12 text-neutral-darkest" />
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] text-neutral-darkest">
              Custom pricing for organizations
            </h2>
          </div>
          <div className="flex-1 flex flex-col gap-6 md:gap-8 items-start">
            <p className="cv-panel-body font-sans text-sm md:text-[20px] leading-[1.6] text-neutral-darkest">
              <BrandText>Domestic violence shelters, legal aid nonprofits, and family service organizations can access civilla at custom rates. We work with you to make education and case support available to those who need it most. Your team gets dedicated onboarding and bulk access for the families you serve.</BrandText>
            </p>
            <div className="flex flex-wrap gap-4 md:gap-6 items-center">
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-[18px] leading-[1.6] px-6 py-2.5 rounded-md"
                data-testid="button-contact-us"
              >
                Contact us
              </button>
              <button 
                className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-[18px] leading-[1.6]"
                data-testid="button-learn-more"
              >
                Learn more
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Plans() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <MostPopularSection billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} />
        <PricingCardsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
