import { useState } from "react";
import { Link } from "wouter";
import { Check, ChevronRight, ChevronUp, ChevronDown, Home } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
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

export const YEARLY_SAVINGS_LABEL = "Save 17%";

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
              Choose a plan that fits where you are—whether you're learning the process,
              organizing your information, or preparing your next steps. No surprises, no hidden
              fees.
            </p>

            <p className="mt-4 text-sm leading-relaxed text-neutral-darkest/70 max-w-[34rem]">
              <BrandMark text="civilla" /> is educational only and does not provide legal advice.
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
              Most Popular
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              Choose what works for your situation
            </p>
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
              aria-label="Select yearly billing with 17% savings"
              data-testid="button-yearly"
            >
              <span>Yearly</span>
              {billingPeriod === "yearly" ? (
                <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                  Save 17%
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-black">
                  Save 17%
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
                <span className="font-sans text-sm md:text-[18px] leading-[1.6]">
                  {billingPeriod === "monthly" ? "billed monthly" : "billed yearly"}
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

function PricingCardsSection({ billingPeriod, setBillingPeriod }: { billingPeriod: "monthly" | "yearly"; setBillingPeriod: (v: "monthly" | "yearly") => void }) {
  return (
    <section className="bg-[#cfd7d5] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-pricing-cards" id="compare">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-start w-full">
          <div className="flex-1 flex flex-col gap-4 items-start max-w-[768px]">
            <div className="flex flex-col gap-4 md:gap-6 items-start text-neutral-darkest w-full">
              <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                What you get
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Every plan includes educational tools to help you understand, organize, and prepare. Choose the level that fits your needs.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-start">
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
                data-testid="button-cards-monthly"
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
                aria-label="Select yearly billing with 17% savings"
                data-testid="button-cards-yearly"
              >
                <span>Yearly</span>
                {billingPeriod === "yearly" ? (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white">
                    {YEARLY_SAVINGS_LABEL}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-black">
                    {YEARLY_SAVINGS_LABEL}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch w-full">
          {PRICING_PLANS.map((plan) => (
            <div 
              key={plan.id}
              className="bg-[#cfd7d5] border-2 border-neutral-darkest rounded-2xl p-5 flex flex-col"
              data-testid={`pricing-card-${plan.id}`}
            >
              <div className="flex flex-col gap-1 text-neutral-darkest pricing-card-header">
                <h3 className="cv-h font-heading font-bold text-[18px] md:text-[20px] tracking-[0.18px] md:tracking-[0.2px] leading-[1.2]">
                  <BrandText>{plan.name}</BrandText>
                </h3>
                {plan.tagline && (
                  <p className="cv-panel-body font-sans text-[13px] md:text-[14px] leading-[1.5]">
                    {plan.tagline}
                  </p>
                )}
              </div>

              <div className="w-full h-[2px] bg-neutral-darkest my-4" />

              <div className="flex flex-col gap-4 pricing-card-price">
                <div className="flex flex-col gap-1 text-neutral-darkest">
                  <div className="pricing-display font-heading font-bold">
                    <span className="price-value">
                      ${billingPeriod === "monthly" ? plan.monthly : plan.yearly}
                    </span>
                    <span className="price-period">{billingPeriod === "monthly" ? "/mo" : "/yr"}</span>
                  </div>
                  <p className="font-sans text-[12px] md:text-[13px] leading-[1.5] min-h-[40px]">
                    {plan.priceNote}
                  </p>
                </div>

                <button 
                  className="w-full bg-bush text-white font-bold text-[13px] md:text-[14px] leading-[1.5] px-4 py-2 rounded-md button-inset-shadow relative"
                  data-testid={`button-${plan.cta.replace(" ", "-")}`}
                >
                  {plan.cta}
                </button>
              </div>

              <div className="w-full h-[2px] bg-neutral-darkest my-4" />

              <div className="flex flex-col gap-3 pricing-card-features flex-1">
                {plan.highlights.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex gap-2 items-start">
                    <Check className="w-4 md:w-5 h-4 md:h-5 text-neutral-darkest flex-shrink-0" />
                    <span className="cv-panel-body font-sans text-[13px] md:text-[14px] leading-[1.5] text-neutral-darkest">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {plan.finePrint && (
                <p className="mt-4 text-xs text-neutral-darkest/70">{plan.finePrint}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 text-center text-xs md:text-sm text-neutral-darkest/70 max-w-xl mx-auto">
          <p>
            Subscriptions are non-refundable.
            Refunds may be issued only for billing errors, service unavailability,
            or where required by law.
          </p>
          <Link
            href="/terms"
            className="underline underline-offset-4 hover:text-neutral-darkest transition-colors"
            data-testid="link-refund-policy"
          >
            View refund policy
          </Link>
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

function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const faqs = [
    {
      id: 0,
      question: "Can I cancel anytime?",
      answer: "Yes. You can cancel your subscription at any time through your account settings. Your access continues until the end of your current billing period."
    },
    {
      id: 1,
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express) and debit cards. All payments are processed securely through Stripe."
    },
    {
      id: 2,
      question: "Is there a free trial?",
      answer: "Yes, we offer a 3-day free trial so you can explore civilla before committing. No credit card required to start your trial."
    },
    {
      id: 3,
      question: "Can I switch plans?",
      answer: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle."
    },
    {
      id: 4,
      question: "Do you offer refunds?",
      answer: "We offer refunds on a case-by-case basis. If you're not satisfied with civilla, contact our support team within 14 days of your purchase."
    }
  ];

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-faq">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
              Common questions
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              Everything you need to know about our plans
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start max-w-[768px] w-full border-b-2 border-neutral-darkest">
          {faqs.map((faq) => (
            <div key={faq.id} className="flex flex-col items-start w-full">
              <button
                onClick={() => toggleItem(faq.id)}
                className="flex gap-4 md:gap-6 items-center w-full py-5 border-t-2 border-neutral-darkest text-left"
                data-testid={`button-faq-${faq.id}`}
              >
                <span className="flex-1 font-sans font-bold text-sm md:text-[18px] leading-[1.6] text-neutral-darkest">
                  {faq.question}
                </span>
                {openItems.includes(faq.id) ? (
                  <ChevronUp className="w-6 md:w-8 h-6 md:h-8 text-neutral-darkest shrink-0" />
                ) : (
                  <ChevronDown className="w-6 md:w-8 h-6 md:h-8 text-neutral-darkest shrink-0" />
                )}
              </button>
              {openItems.includes(faq.id) && (
                <div className="flex items-start pb-6 w-full">
                  <p className="flex-1 font-sans font-normal text-sm md:text-[18px] leading-[1.6] text-neutral-darkest">
                    <BrandText>{faq.answer}</BrandText>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 md:gap-6 items-center max-w-[560px] w-full">
          <div className="flex flex-col gap-4 items-center text-neutral-darkest text-center w-full">
            <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] tracking-[0.32px] md:tracking-[0.4px] leading-[1.2] w-full">
              Still have questions?
            </h3>
            <p className="font-sans font-normal text-sm md:text-[20px] leading-[1.6] w-full">
              Our team is here to help
            </p>
          </div>
          <div className="flex items-center">
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-[18px] leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-contact-faq"
            >
              Contact us
            </button>
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
        <PricingCardsSection billingPeriod={billingPeriod} setBillingPeriod={setBillingPeriod} />
        <OrganizationsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
