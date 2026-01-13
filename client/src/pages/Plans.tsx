import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Check, ChevronRight, ChevronUp, ChevronDown, Home, X, ArrowDownRight, Loader2 } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import PlansFaqSection from "@/components/PlansFaqSection";
import { Brand, BrandText } from "@/components/Brand";
import BrandMark from "@/components/BrandMark";
import { useToast } from "@/hooks/use-toast";

export const PRICING_PLANS = [
  {
    id: "trial",
    name: "three day trial",
    tagline: "Start free. Upgrade anytime.",
    cta: "Start Trial",
    monthly: 0,
    yearly: 0,
    priceNote: "three day trial",
    highlights: [
      "Case journey overview",
      "Basic document storage",
      "Learning Hub (education-only resources)",
      "Safety & Support hub access",
      "Child support estimate range",
    ],
    finePrint: "No credit card required.",
  },
  {
    id: "core",
    name: "civilla core",
    tagline: "Build your case workspace.",
    cta: "Start Core",
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
      "Child support estimate range",
    ],
    finePrint: "Cancel anytime.",
  },
  {
    id: "pro",
    name: "civilla pro",
    tagline: "For higher-conflict or higher-volume cases.",
    cta: "Start Pro",
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
      "Child support estimate range",
    ],
    finePrint: "",
  },
  {
    id: "premium",
    name: "civilla premium",
    tagline: "For organizations and people who want hands-on support.",
    cta: "Start Premium",
    monthly: 49.99,
    yearly: 499.99,
    priceNote: "per month",
    highlights: [
      "Everything in pro, plus",
      "Priority support",
      "Onboarding help (setup + best practices)",
      "Nonprofit / shelter pricing options",
      "Team enablement (for approved org use)",
      "Child support estimate range",
    ],
    finePrint: "Contact us for org onboarding details.",
  },
] as const;

export const YEARLY_SAVINGS_LABEL = "2 Mo. Free";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] dark:bg-neutral-darkest/80" data-testid="section-header">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="min-w-0">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[0.95] text-neutral-darkest dark:text-cream">
              Plans &amp; Pricing
            </h1>
          </div>

          <div className="min-w-0">
            <p className="text-base sm:text-lg leading-relaxed text-neutral-darkest/80 dark:text-cream/80 max-w-[34rem]">
              Choose a plan that fits where you are. Whether you're learning the process,
              organizing your information, or preparing your next steps. No surprises, no hidden
              fees.
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
    <section className="bg-cream dark:bg-neutral-darkest w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-most-popular">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest dark:text-cream text-center w-full">
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
            className="inline-flex items-center rounded-full border border-black/20 dark:border-cream/20 bg-white dark:bg-neutral-darkest p-1"
            role="group"
            aria-label="Billing period selection"
          >
            <button
              type="button"
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold transition",
                billingPeriod === "monthly" ? "bg-black dark:bg-cream text-white dark:text-neutral-darkest shadow-sm" : "text-black/70 dark:text-cream/70 hover:text-black dark:hover:text-cream",
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
                "ml-1 rounded-full px-5 py-2 text-sm font-semibold transition",
                billingPeriod === "yearly" ? "bg-black dark:bg-cream text-white dark:text-neutral-darkest shadow-sm" : "text-black/70 dark:text-cream/70 hover:text-black dark:hover:text-cream",
              ].join(" ")}
              onClick={() => setBillingPeriod("yearly")}
              aria-pressed={billingPeriod === "yearly"}
              aria-label="Select yearly billing with 2 months free"
              data-testid="button-yearly"
            >
              Yearly*
            </button>
          </div>
          <p className="mt-3 text-xs text-neutral-darkest/70 dark:text-cream/70 text-center max-w-md">
            *Yearly plans include two months free — at signup and every renewal.
          </p>

          <div className="bg-cream dark:bg-neutral-darkest/60 border-2 border-neutral-darkest dark:border-cream/30 rounded-2xl p-6 md:p-8 flex flex-col gap-6 md:gap-8 items-center w-full">
            <div className="flex flex-col gap-2 items-center text-neutral-darkest dark:text-cream text-center w-full">
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
                  <Check className="w-5 md:w-6 h-5 md:h-6 text-neutral-darkest dark:text-cream flex-shrink-0 mt-0.5" />
                  <span className="cv-panel-body font-sans text-sm md:text-[16px] leading-[1.6] text-neutral-darkest dark:text-cream">
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
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSelectPlan = async (planId: string) => {
    if (planId === "trial") {
      navigate("/auth");
      return;
    }

    setLoadingPlan(planId);
    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId,
          billingPeriod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Unable to start checkout",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handleBuyPack = async (packType: "overlimit_200" | "plus_600") => {
    setLoadingPack(packType);
    try {
      const response = await fetch("/api/billing/processing-pack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Pack checkout error:", error);
      toast({
        title: "Unable to purchase pack",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoadingPack(null);
    }
  };

  const plans = [
    {
      id: "trial",
      name: "3-Day Trial",
      monthlyPrice: "Free",
      yearlyPrice: "Free",
      tagline: "Ends after 3 days. No auto-billing.",
      highlights: [
        "One family law case",
        "Evidence upload (documents only)",
        "Timeline (read-only)",
        "Pattern insights (limited)",
        "Lexi education",
        "Educational document creator (watermarked, no download)",
      ],
      cta: "Start Trial",
    },
    {
      id: "core",
      name: "civilla core",
      monthlyPrice: "$19.99",
      yearlyPrice: "$199",
      tagline: "Built for one active case — full tools, downloads, and tracking.",
      highlights: [
        "One active family law case",
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
      name: "civilla pro",
      monthlyPrice: "$29.99",
      yearlyPrice: "$299",
      tagline: "For higher-volume cases — deeper evidence workflows and court prep exports.",
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
      name: "civilla premium",
      monthlyPrice: "$49.99",
      yearlyPrice: "$499",
      tagline: "For complex cases — maximum storage, tracking, and organization tools.",
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
      price: "$9.99 / month",
      description: "Add another active case without changing your base plan.",
      bullets: [
        "+30 GB storage for that case",
        "Same features as your current plan",
        "Helpful for cases in multiple states, or children with different parents",
      ],
    },
    {
      title: "Archive Mode",
      price: "$4.99 / month",
      description: "Downgrade to preserve your case between active periods.",
      bullets: [
        "Evidence uploads and journaling",
        "Timeline and storage preserved",
        "No new analysis while archived",
        "Reactivate full features anytime",
      ],
    },
  ] as const;

  const processingPacks = [
    {
      id: "overlimit_200" as const,
      title: "Over-Limit Processing Pack",
      price: "$19.99",
      priceNote: "one-time",
      credits: 200,
      bullets: [
        "200 additional analysis credits",
        "Use for OCR, AI analysis, claims, patterns, document generation",
        "Credits consumed before plan limits",
        "Never expires",
      ],
    },
    {
      id: "plus_600" as const,
      title: "Processing Pack Plus",
      price: "$49.99",
      priceNote: "one-time",
      credits: 600,
      bullets: [
        "600 additional analysis credits",
        "Use for OCR, AI analysis, claims, patterns, document generation",
        "Credits consumed before plan limits",
        "Never expires",
      ],
      highlight: true,
    },
  ] as const;

  const groups = [
    {
      title: "Included In Every Plan",
      rows: [
        { label: "One Family Law Case", trial: true, core: true, pro: true, premium: true },
        { label: "Evidence Upload (Documents)", trial: true, core: true, pro: true, premium: true },
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
        { label: "Storage (30 GB+)", trial: false, core: true, pro: true, premium: true },
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

  type PaidTierKey = "core" | "pro" | "premium";
  const PAID_TIER_ORDER: PaidTierKey[] = ["core", "pro", "premium"];
  const tierIndex = (t: PaidTierKey) => PAID_TIER_ORDER.indexOf(t);

  const paidFeatureGroups: Array<{
    title: string;
    rows: Array<{ label: string; startsIn: PaidTierKey }>;
  }> = [
    {
      title: "Starts in Core",
      rows: [
        { label: "One active family law case", startsIn: "core" },
        { label: "Storage (30 GB)", startsIn: "core" },
        { label: "Unlimited document uploads (reasonable use)", startsIn: "core" },
        { label: "Interactive timeline", startsIn: "core" },
        { label: "Lexi research with citations", startsIn: "core" },
        { label: "AI document analysis", startsIn: "core" },
        { label: "AI deadline extraction (confirmation required)", startsIn: "core" },
        { label: "Task & deadline tracking", startsIn: "core" },
        { label: "Reminders (opt-in)", startsIn: "core" },
        { label: "Educational document creator", startsIn: "core" },
        { label: "Downloads with required acknowledgments + disclaimers", startsIn: "core" },
        { label: "Audio uploads + transcription", startsIn: "core" },
        { label: "Basic exhibits builder", startsIn: "core" },
        { label: "Parenting plan builder", startsIn: "core" },
        { label: "Child support estimator (education only)", startsIn: "core" },
      ],
    },
    {
      title: "Starts in Pro",
      rows: [
        { label: "Storage (50 GB)", startsIn: "pro" },
        { label: "Advanced exhibits builder", startsIn: "pro" },
        { label: "Video uploads", startsIn: "pro" },
        { label: "Dual OCR verification (cross-checked)", startsIn: "pro" },
        { label: "Advanced pattern reporting (timeline → evidence → mapping)", startsIn: "pro" },
        { label: "Hearing & trial prep organization", startsIn: "pro" },
      ],
    },
    {
      title: "Starts in Premium",
      rows: [
        { label: "Storage (100 GB)", startsIn: "premium" },
        { label: "Advanced narrative reports (still educational)", startsIn: "premium" },
        { label: "Full exhibits management", startsIn: "premium" },
        { label: "Multi-child, multi-issue analytics", startsIn: "premium" },
        { label: "Advanced reminders + escalation tracking", startsIn: "premium" },
        { label: "Complex discovery tracking", startsIn: "premium" },
        { label: "Post-judgment workflows (education only)", startsIn: "premium" },
      ],
    },
  ];

  const getPaidMobileValue = (startsIn: PaidTierKey) => {
    if (mobilePlan === "trial") return false;
    return tierIndex(mobilePlan as PaidTierKey) >= tierIndex(startsIn);
  };

  const PaidCell = ({ startsIn, tier }: { startsIn: PaidTierKey; tier: PaidTierKey }) => {
    const ok = tierIndex(tier) >= tierIndex(startsIn);
    return (
      <div className="flex justify-center text-lg font-semibold text-neutral-900 dark:text-cream">
        {ok ? "✓" : "×"}
      </div>
    );
  };

  const scrollToFullFeatures = () => {
    const el = document.getElementById("full-features");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const PriceLine = ({ plan }: { plan: (typeof plans)[number] }) => {
    const price = billingPeriod === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    const suffix =
      plan.id === "trial" ? "" : billingPeriod === "yearly" ? "/yr" : "/mo";
    return (
      <div>
        <div className="flex items-end gap-2">
          <div className="text-4xl font-black leading-none text-neutral-900 dark:text-cream">
            {price}
          </div>
          <div className="pb-1 text-sm font-semibold text-neutral-900/70 dark:text-cream/70">{suffix}</div>
        </div>
        <p className="mt-2 text-sm text-neutral-900/70 dark:text-cream/70">{plan.tagline}</p>
      </div>
    );
  };

  const Cell = ({ on }: { on: boolean }) => (
    <div className="flex justify-center">
      {on ? (
        <Check className="h-4 w-4 text-neutral-900 dark:text-cream" aria-label="Included" />
      ) : (
        <X className="h-4 w-4 text-neutral-900/40 dark:text-cream/40" aria-label="Not included" />
      )}
    </div>
  );

  const MobileRow = ({ label, on }: { label: string; on: boolean }) => (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-900/10 dark:border-cream/10 py-3 last:border-b-0">
      <div className="min-w-0 text-sm font-semibold text-neutral-900/85 dark:text-cream/85">{label}</div>
      <div className="pt-[2px]">
        {on ? (
          <Check className="h-4 w-4 text-neutral-900 dark:text-cream" aria-label="Included" />
        ) : (
          <X className="h-4 w-4 text-neutral-900/40 dark:text-cream/40" aria-label="Not included" />
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
      <div className="rounded-[28px] border border-neutral-900/15 dark:border-cream/15 bg-white/40 dark:bg-neutral-darkest/60 p-6 md:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h2 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-cream md:text-5xl">
              Choose Your Plan
            </h2>
            <p className="mt-2 max-w-xl text-base text-neutral-900/75 dark:text-cream/75">
              Educational, research, and organization tools for family<br />
              law cases, powered by information you enter.
            </p>

            <button
              type="button"
              onClick={scrollToFullFeatures}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-cream hover:opacity-80"
              data-testid="button-see-full-features"
            >
              See Full List Of Features
              <ArrowDownRight className="h-4 w-4" />
            </button>
          </div>

          {/* Toggle */}
          <div className="inline-flex items-center rounded-full border border-neutral-900/15 dark:border-cream/15 bg-white/60 dark:bg-neutral-darkest/60 p-1">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold transition",
                billingPeriod === "monthly"
                  ? "bg-neutral-900 dark:bg-cream text-white dark:text-neutral-darkest"
                  : "text-neutral-900/70 dark:text-cream/70 hover:text-neutral-900 dark:hover:text-cream",
              ].join(" ")}
              data-testid="button-cards-monthly"
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod("yearly")}
              className={[
                "ml-1 rounded-full px-5 py-2 text-sm font-semibold transition",
                billingPeriod === "yearly"
                  ? "bg-neutral-900 dark:bg-cream text-white dark:text-neutral-darkest"
                  : "text-neutral-900/70 dark:text-cream/70 hover:text-neutral-900 dark:hover:text-cream",
              ].join(" ")}
              data-testid="button-cards-yearly"
            >
              Yearly*
            </button>
          </div>
        </div>
        <p className="mt-3 text-xs text-neutral-900/60 dark:text-cream/60">
          *Yearly plans include two months free — at signup and every renewal.
        </p>

        {/* 4 plan cards */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative flex h-full flex-col rounded-[24px] border border-neutral-900/15 dark:border-cream/15 bg-white/60 dark:bg-neutral-darkest/60 p-6 min-w-0"
              data-testid={`pricing-card-${plan.id}`}
            >
              {"badge" in plan && plan.badge ? (
                <div className="absolute -top-3 left-6 rounded-full bg-neutral-900 dark:bg-cream px-3 py-1 text-xs font-semibold text-white dark:text-neutral-darkest">
                  {plan.badge}
                </div>
              ) : null}

              <div className="text-lg font-black text-neutral-900 dark:text-cream">{plan.name}</div>
              <div className="mt-4">
                <PriceLine plan={plan} />
              </div>

              <div className="my-5 h-px w-full bg-neutral-900/10 dark:bg-cream/10" />

              <div className="text-sm font-semibold text-neutral-900 dark:text-cream">Highlights</div>
              <ul className="mt-3 space-y-2 text-sm text-neutral-900/80 dark:text-cream/80 mb-6">
                {plan.highlights.map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-[2px] h-4 w-4 text-neutral-900/70 dark:text-cream/70" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className="mt-auto w-full rounded-full bg-[#0F3B2E] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-95 disabled:opacity-70"
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loadingPlan !== null}
                data-testid={`button-${plan.cta.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {loadingPlan === plan.id ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </span>
                ) : (
                  plan.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Add-ons under the cards */}
        <div className="mt-10">
          <h3 className="text-2xl font-black text-neutral-900 dark:text-cream">Add-Ons</h3>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
            {addOns.map((a) => (
              <div
                key={a.title}
                className="h-full rounded-[24px] border border-neutral-900/15 dark:border-cream/15 bg-white/60 dark:bg-neutral-darkest/60 p-6 min-w-0"
              >
                <div className="text-lg font-black text-neutral-900 dark:text-cream">{a.title}</div>
                <div className="mt-2 text-sm font-semibold text-neutral-900/70 dark:text-cream/70">{a.price}</div>
                {a.description ? (
                  <p className="mt-2 text-sm text-neutral-900/75 dark:text-cream/75">{a.description}</p>
                ) : null}
                <ul className="mt-4 space-y-2 text-sm text-neutral-900/80 dark:text-cream/80">
                  {a.bullets.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-[2px] h-4 w-4 text-neutral-900/70 dark:text-cream/70" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Packs */}
        <div className="mt-10">
          <h3 className="text-2xl font-black text-neutral-900 dark:text-cream">Processing Packs</h3>
          <p className="mt-2 text-sm text-neutral-900/70 dark:text-cream/70">
            One-time credit purchases for AI-powered features. Credits are consumed before your subscription limits.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 items-stretch">
            {processingPacks.map((pack) => (
              <div
                key={pack.id}
                className={`h-full rounded-[24px] border ${
                  "highlight" in pack && pack.highlight 
                    ? "border-[#0F3B2E] dark:border-cream/40 ring-2 ring-[#0F3B2E]/20 dark:ring-cream/20" 
                    : "border-neutral-900/15 dark:border-cream/15"
                } bg-white/60 dark:bg-neutral-darkest/60 p-6 min-w-0 flex flex-col`}
              >
                {"highlight" in pack && pack.highlight && (
                  <div className="text-xs font-bold text-[#0F3B2E] dark:text-cream/80 uppercase tracking-wider mb-2">
                    Best Value
                  </div>
                )}
                <div className="text-lg font-black text-neutral-900 dark:text-cream">{pack.title}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-neutral-900 dark:text-cream">{pack.price}</span>
                  <span className="text-sm font-semibold text-neutral-900/70 dark:text-cream/70">{pack.priceNote}</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-neutral-900/80 dark:text-cream/80 flex-1">
                  {pack.bullets.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-[2px] h-4 w-4 text-neutral-900/70 dark:text-cream/70" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="mt-4 w-full rounded-full bg-[#0F3B2E] px-5 py-3 text-center text-sm font-semibold text-white hover:opacity-95 disabled:opacity-70"
                  onClick={() => handleBuyPack(pack.id)}
                  disabled={loadingPack !== null}
                  data-testid={`button-buy-pack-${pack.id}`}
                >
                  {loadingPack === pack.id ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Buy ${pack.title.replace("Processing Pack", "Pack")}`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Organizations hero box */}
      <div className="mt-12 rounded-[24px] border border-neutral-900/20 dark:border-cream/20 bg-white/40 dark:bg-neutral-darkest/60 p-6 md:p-10">
        <h3 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-cream">
          Organizations &amp; DV Shelters
        </h3>

        <p className="mt-2 text-neutral-900/70 dark:text-cream/70 max-w-3xl">
          Custom pricing for domestic violence shelters, legal aid, and advocacy groups.
        </p>

        <p className="mt-4 italic text-neutral-900/70 dark:text-cream/70 max-w-3xl">
          We're actively pursuing grant and sponsor partnerships to help subsidize access where possible.
        </p>

        <div className="mt-6">
          <ul className="grid gap-3 md:grid-cols-2 max-w-3xl">
            {[
              "Custom onboarding",
              "Privacy-first configurations",
              "Non-profit pricing",
              "Bulk access options",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-neutral-900/80 dark:text-cream/80">
                <span className="mt-[2px] font-semibold text-emerald-900">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <a
            href="/contact"
            className="inline-flex items-center justify-center rounded-full bg-emerald-950 px-8 py-3 font-semibold text-white shadow-sm hover:bg-emerald-900 transition"
            data-testid="button-contact-org"
          >
            Contact Us
          </a>
        </div>
      </div>

      {/* Full feature comparison */}
      <div id="full-features" className="mt-10 rounded-[28px] border border-neutral-900/15 dark:border-cream/15 bg-white/40 dark:bg-neutral-darkest/60 p-6 md:p-10">
        <div className="min-w-0">
          <h3 className="text-3xl font-black text-neutral-900 dark:text-cream">Full Feature Comparison</h3>
          <p className="mt-2 text-base text-neutral-900/75 dark:text-cream/75">
            Features listed by where they start. Higher tiers add more checkmarks.
          </p>
        </div>

        {/* Trial callout */}
        <div className="mt-6 rounded-[18px] border border-neutral-900/15 dark:border-cream/15 bg-white/60 dark:bg-neutral-darkest/60 p-5 md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-bold text-neutral-900 dark:text-cream">3-Day Trial</p>
              <p className="text-neutral-900/70 dark:text-cream/70">
                Try Premium workflows first — with a few protective limits.
              </p>
            </div>
            <div className="text-sm font-semibold text-neutral-900/70 dark:text-cream/70">
              Ends automatically • No auto-billing
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-neutral-900/80 dark:text-cream/80">
            <li className="flex gap-2">
              <span className="mt-[2px]">✓</span>
              <span>Access to Premium-level features to explore the workflow.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[2px]">✓</span>
              <span>Includes child support estimate range using the information you enter. Not court-accurate. Not legal advice.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[2px]">×</span>
              <span>No audio or video uploads during trial.</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[2px]">×</span>
              <span>No full exhibit builder access (you can generate 1 sample exhibit).</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[2px]">×</span>
              <span>
                No document downloads (you can generate 1 sample educational document with a large
                watermark).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-[2px]">✓</span>
              <span>Upgrade anytime to unlock full access immediately.</span>
            </li>
          </ul>
        </div>

        {/* Mobile: plan tabs + readable lists (Core/Pro/Premium only) */}
        <div className="mt-6 md:hidden">
          <div className="inline-flex w-full overflow-x-auto rounded-full border border-neutral-900/15 dark:border-cream/15 bg-white/60 dark:bg-neutral-darkest/60 p-1">
            {[
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
                    ? "bg-neutral-900 dark:bg-cream text-white dark:text-neutral-darkest"
                    : "text-neutral-900/70 dark:text-cream/70 hover:text-neutral-900 dark:hover:text-cream",
                ].join(" ")}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-5">
            {paidFeatureGroups.map((g) => (
              <div key={g.title} className="rounded-2xl border border-neutral-900/15 dark:border-cream/15 bg-white/60 dark:bg-neutral-darkest/60 p-4">
                <div className="text-sm font-black text-neutral-900 dark:text-cream">{g.title}</div>
                <div className="mt-2">
                  {g.rows.map((r) => (
                    <MobileRow key={r.label} label={r.label} on={getPaidMobileValue(r.startsIn)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: table (Core/Pro/Premium only) */}
        <div className="mt-6 hidden md:block overflow-x-auto rounded-2xl border border-neutral-900/15 bg-white/60">
          <table className="min-w-[720px] w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-900/10">
                <th className="px-4 py-4 text-left text-sm font-black text-neutral-900">Feature</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Core</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Pro</th>
                <th className="px-4 py-4 text-center text-sm font-black text-neutral-900">Premium</th>
              </tr>
            </thead>

            {paidFeatureGroups.map((g) => (
              <tbody key={g.title}>
                <tr className="border-b border-neutral-900/10 bg-white/40">
                  <td colSpan={4} className="px-4 py-3 text-sm font-black text-neutral-900">
                    {g.title}
                  </td>
                </tr>

                {g.rows.map((r) => (
                  <tr key={r.label} className="border-b border-neutral-900/10 last:border-b-0">
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900/85">{r.label}</td>
                    <td className="px-4 py-3"><PaidCell startsIn={r.startsIn} tier="core" /></td>
                    <td className="px-4 py-3"><PaidCell startsIn={r.startsIn} tier="pro" /></td>
                    <td className="px-4 py-3"><PaidCell startsIn={r.startsIn} tier="premium" /></td>
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
                Contact Us
              </button>
              <button 
                className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-[18px] leading-[1.6]"
                data-testid="button-learn-more"
              >
                Learn More
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
    <div className="min-h-screen flex flex-col bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <MostPopularSection billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} />
        <PricingCardsSection />
        <PlansFaqSection />
      </main>
      <Footer />
    </div>
  );
}
