import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Check, ChevronRight, Home } from "lucide-react";
import Footer from "@/components/Footer";
import logoDark from "@assets/noBgColor_(1)_1766261333621.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-civilla-works", label: "How Civilla Works" },
  { href: "/about-civilla", label: "About Civilla" },
  { href: "/plans", label: "Plans" },
];

function NavbarCream() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <nav className="bg-cream w-full" data-testid="navbar-cream">
      <div className="h-9 md:h-9 flex items-center justify-center px-3 md:px-6 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <Link href="/" className="relative h-[30px] w-auto" data-testid="link-logo">
              <img 
                src={logoDark} 
                alt="civilla.ai" 
                className="h-full w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button 
              className="hidden md:block bg-transparent border border-neutral-darkest text-neutral-darkest font-bold text-xs leading-[1.6] px-3 py-0.5 rounded"
              data-testid="button-login"
            >
              Login
            </button>
            <button 
              className="p-1"
              data-testid="button-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 text-neutral-darkest" />
              ) : (
                <Menu className="w-4 h-4 text-neutral-darkest" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="bg-cream border-t border-neutral-darkest/20 px-3 md:px-6 py-4" data-testid="mobile-menu">
          <div className="flex flex-col gap-3 max-w-container mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-neutral-darkest font-bold text-sm leading-[1.6] py-2 px-3 rounded ${
                  location === link.href ? "bg-neutral-darkest/10" : "hover-elevate active-elevate-2"
                }`}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`mobile-link-${link.href.replace("/", "") || "home"}`}
              >
                {link.label}
              </Link>
            ))}
            <button 
              className="text-left text-neutral-darkest font-bold text-sm leading-[1.6] py-2 px-3 rounded hover-elevate active-elevate-2"
              data-testid="mobile-button-login"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-16 py-28" data-testid="section-header">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-start w-full">
          <div className="flex-1">
            <h1 className="cv-h font-heading font-bold text-[84px] tracking-[0.84px] leading-[1.1] text-neutral-darkest">
              Plans for everyone
            </h1>
          </div>
          <div className="flex-1">
            <p className="cv-p font-sans text-[20px] leading-[1.6] text-neutral-darkest">
              Transparent, simple plans for self-represented parents and organizations. No hidden fees.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function MostPopularSection() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  const features = [
    "Case journey overview",
    "Document organization tools",
    "Educational research resources",
    "Timeline building",
    "Basic deadline tracking"
  ];

  return (
    <section className="bg-cream w-full flex flex-col items-center px-16 py-28" data-testid="section-most-popular">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
            Plans
          </span>
          <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] w-full">
              Most Popular
            </h2>
            <p className="cv-p font-sans text-[20px] w-full">
              Choose what works for your situation
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-12 items-center max-w-[560px] w-full">
          <div className="bg-cream border-2 border-neutral-darkest rounded-[10px] p-1 flex">
            <button
              className={`px-6 py-2.5 rounded-lg font-bold text-[18px] leading-[1.6] transition-colors ${
                billingPeriod === "monthly" 
                  ? "border-2 border-neutral-darkest text-neutral-darkest" 
                  : "border border-transparent text-neutral-darkest"
              }`}
              onClick={() => setBillingPeriod("monthly")}
              data-testid="button-monthly"
            >
              Monthly
            </button>
            <button
              className={`px-6 py-2.5 rounded-lg text-[18px] leading-[1.6] transition-colors ${
                billingPeriod === "yearly" 
                  ? "border-2 border-neutral-darkest font-bold text-neutral-darkest" 
                  : "border border-transparent font-normal text-neutral-darkest"
              }`}
              onClick={() => setBillingPeriod("yearly")}
              data-testid="button-yearly"
            >
              Yearly
            </button>
          </div>

          <div className="bg-cream border-2 border-neutral-darkest rounded-2xl p-8 flex flex-col gap-8 items-center w-full">
            <div className="flex flex-col gap-2 items-center text-neutral-darkest text-center w-full">
              <span className="font-heading font-bold text-[26px] tracking-[0.26px] leading-[1.2]">
                civilla pro
              </span>
              <span className="font-heading font-bold text-[84px] tracking-[0.84px] leading-[1.1]">
                {billingPeriod === "monthly" ? "29.99" : "249.99"}
              </span>
            </div>

            <div className="flex flex-col gap-4 py-2 w-full">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4 items-start w-full">
                  <Check className="w-6 h-6 text-neutral-darkest flex-shrink-0" />
                  <span className="cv-panel-body font-sans text-[18px] leading-[1.6] text-neutral-darkest">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            <button 
              className="w-full bg-bush text-white font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
              data-testid="button-start-now"
            >
              Start now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCardsSection() {
  const plans = [
    {
      name: "three day trial",
      subtitle: "Start free, upgrade when",
      price: "$0",
      period: "/mo",
      priceNote: "three day trial",
      buttonText: "start trial",
      features: [
        "Case journey overview",
        "Document organization tools",
        "Educational research resources",
        "Timeline building",
        "Basic deadline tracking"
      ]
    },
    {
      name: "civilla pro",
      subtitle: "Full access, monthly billing",
      price: "$29.99",
      period: "/mo",
      priceNote: "Billed monthly",
      buttonText: "start pro",
      features: [
        "Case journey overview",
        "Document organization tools",
        "Educational research resources",
        "Timeline building",
        "Basic deadline tracking"
      ]
    },
    {
      name: "organizations",
      subtitle: "Dedicated onboarding",
      price: "Custom",
      period: "",
      priceNote: "Contact for pricing",
      buttonText: "start premium",
      features: [
        "Shelter and nonprofit rates",
        "Team training included",
        "Contact us",
        "Learn more",
        "Priority support"
      ]
    }
  ];

  return (
    <section className="bg-[#cfd7d5] w-full flex flex-col items-center px-16 py-28" data-testid="section-pricing-cards">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex items-start w-full">
          <div className="flex-1 flex flex-col gap-4 items-start max-w-[768px]">
            <span className="font-sans font-bold text-[16px] text-neutral-darkest leading-[1.5]">
              Plans
            </span>
            <div className="flex flex-col gap-6 items-start text-neutral-darkest w-full">
              <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] w-full">
                What you get
              </h2>
              <p className="cv-p font-sans text-[20px] w-full">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-start w-full">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className="flex-1 bg-[#cfd7d5] border-2 border-neutral-darkest rounded-2xl p-6 flex flex-col gap-8 self-stretch"
              data-testid={`pricing-card-${index}`}
            >
              <div className="flex flex-col gap-1 text-neutral-darkest">
                <h3 className="cv-h font-heading font-bold text-[26px] tracking-[0.26px] leading-[1.2]">
                  {plan.name}
                </h3>
                <p className="cv-panel-body font-sans text-[18px] leading-[1.6]">
                  {plan.subtitle}
                </p>
              </div>

              <div className="w-full h-[2px] bg-neutral-darkest" />

              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-2 text-neutral-darkest">
                  <div className="font-heading font-bold leading-[1.2]">
                    <span className="text-[60px] tracking-[0.6px]">{plan.price}</span>
                    {plan.period && <span className="text-[32px] tracking-[0.32px]">{plan.period}</span>}
                  </div>
                  <p className="font-sans text-[18px] leading-[1.6]">
                    {plan.priceNote}
                  </p>
                </div>

                <button 
                  className="w-full bg-bush text-white font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
                  data-testid={`button-${plan.buttonText.replace(" ", "-")}`}
                >
                  {plan.buttonText}
                </button>
              </div>

              <div className="w-full h-[2px] bg-neutral-darkest" />

              <div className="flex flex-col gap-4 py-2">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex gap-4 items-start">
                    <Check className="w-6 h-6 text-neutral-darkest flex-shrink-0" />
                    <span className="cv-panel-body font-sans text-[18px] leading-[1.6] text-neutral-darkest">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OrganizationsSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-16 py-28" data-testid="section-organizations">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-start w-full">
          <div className="flex-1 flex flex-col gap-6 items-start">
            <Home className="w-12 h-12 text-neutral-darkest" />
            <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] text-neutral-darkest">
              Custom pricing for organizations
            </h2>
          </div>
          <div className="flex-1 flex flex-col gap-8 items-start">
            <p className="cv-panel-body font-sans text-[20px] leading-[1.6] text-neutral-darkest">
              Domestic violence shelters, legal aid nonprofits, and family service organizations can access Civilla at custom rates. We work with you to make education and case support available to those who need it most. Your team gets dedicated onboarding and bulk access for the families you serve.
            </p>
            <div className="flex gap-6 items-center">
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-md"
                data-testid="button-contact-us"
              >
                Contact us
              </button>
              <button 
                className="flex gap-2 items-center text-neutral-darkest font-bold text-[18px] leading-[1.6]"
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
  const [openIndex, setOpenIndex] = useState<number>(0);

  const faqs = [
    {
      question: "Can I cancel anytime?",
      answer: "Yes. There's no contract or commitment. You can pause or cancel your subscription at any time from your account settings. We want you to use Civilla only when it serves you."
    },
    {
      question: "Is my information secure?",
      answer: "Your documents and personal information are encrypted and stored securely. We follow industry standards for data protection and never share your case details with third parties."
    },
    {
      question: "Do you offer a free trial?",
      answer: "We offer limited free access to explore the platform and understand how Civilla works. Paid plans unlock full features like document organization, timeline building, and research tools."
    },
    {
      question: "What about organizations?",
      answer: "Domestic violence shelters, legal aid nonprofits, and family service organizations can reach out for custom pricing and bulk access. We work with you to make Civilla available to those who need it most."
    },
    {
      question: "Why isn't this free?",
      answer: "Building a trauma-informed, secure platform takes real resources. Our pricing reflects the cost of maintaining your data safely, updating legal information by state, and supporting users. We keep costs low and transparent."
    }
  ];

  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-16 py-28" data-testid="section-faq">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-start w-full">
          <div className="flex flex-col gap-8 items-start w-[500px]">
            <div className="flex flex-col gap-6 items-start text-neutral-darkest w-full">
              <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] w-full">
                Questions
              </h2>
              <p className="cv-p font-sans text-[20px] w-full">
                Find answers about how Civilla works, what you'll get, and how to get started.
              </p>
            </div>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-contact"
            >
              Contact
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div 
                key={index}
                className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl overflow-hidden"
                data-testid={`faq-item-${index}`}
              >
                <button
                  className="w-full flex gap-6 items-center px-6 py-5"
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                >
                  <span className="flex-1 text-left font-sans font-bold text-[20px] leading-[1.6] text-neutral-darkest">
                    {faq.question}
                  </span>
                  <X className={`w-6 h-6 text-neutral-darkest transition-transform ${openIndex === index ? "" : "rotate-45"}`} />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="cv-panel-body font-sans text-[18px] leading-[1.6] text-neutral-darkest">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Plans() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <MostPopularSection />
        <PricingCardsSection />
        <OrganizationsSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
