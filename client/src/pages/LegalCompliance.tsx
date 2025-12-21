import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, Check, Ban, BarChart3 } from "lucide-react";
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
              className="p-1.5"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              data-testid="button-menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-neutral-darkest" />
              ) : (
                <Menu className="w-5 h-5 text-neutral-darkest" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="absolute top-9 left-0 right-0 bg-cream border-t border-neutral-darkest/10 z-50">
          <div className="flex flex-col p-4 max-w-container mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-3 font-sans text-[16px] leading-[1.6] ${
                  location === link.href 
                    ? "text-neutral-darkest font-bold" 
                    : "text-neutral-darkest"
                }`}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function EducationSection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-16 py-28"
      data-testid="section-education"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-center w-full">
          <div className="flex-1 aspect-[600/640] rounded-2xl overflow-hidden">
            <img 
              src="https://www.figma.com/api/mcp/asset/45617208-0482-4b11-9665-f57d418aec3c"
              alt="Open book representing education"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col gap-8 items-start">
            <div className="flex flex-col gap-6 items-start w-full">
              <div className="flex flex-col gap-6 items-start text-neutral-darkest w-full">
                <h2 className="cv-h font-heading font-bold tracking-[0.6px] leading-[1.2] w-full" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
                  Education only, never legal advice
                </h2>
                <p className="cv-p font-sans font-normal text-[20px] leading-[1.6] w-full">
                  Everything on Civilla is designed to inform and explain. We do not provide legal advice, and nothing here replaces an attorney.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-xl"
                data-testid="button-learn-more"
              >
                Learn
              </button>
              <button 
                className="flex gap-2 items-center text-neutral-darkest font-bold text-[18px] leading-[1.6]"
                data-testid="button-read"
              >
                Read
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BoundariesSection() {
  const items = [
    {
      icon: Check,
      text: "We can explain what service of process means",
      type: "can"
    },
    {
      icon: Ban,
      text: "We cannot tell you when to file for custody",
      type: "cannot"
    },
    {
      icon: BarChart3,
      text: "We can show you your state's custody factors",
      type: "can"
    }
  ];

  return (
    <section 
      className="bg-bush w-full flex flex-col items-center px-16 py-28"
      data-testid="section-boundaries"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-center w-full">
          <div className="flex-1 flex flex-col gap-8 items-start">
            <div className="flex flex-col gap-8 items-start w-full">
              <div className="flex flex-col gap-4 items-start w-full">
                <span className="font-sans font-bold text-[16px] leading-[1.5] text-white">
                  Boundaries
                </span>
                <div className="flex flex-col gap-6 items-start text-white w-full">
                  <h2 className="cv-h font-heading font-bold tracking-[0.6px] leading-[1.2] w-full" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
                    What we can and cannot do for you. Understanding these limits keeps you safe and informed.
                  </h2>
                  <p className="cv-p font-sans font-normal text-[20px] leading-[1.6] w-full">
                    Civilla answers educational questions. We explain legal terms, show how courts work, and help you organize evidence. We do not answer case-specific questions or tell you what decisions to make.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 items-start py-2 w-full">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-center w-full">
                    <item.icon className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="font-sans font-normal text-[18px] leading-[1.6] text-white">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <button 
                className="bg-transparent border-2 border-white text-white font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-xl"
                data-testid="button-learn-boundaries"
              >
                Learn
              </button>
              <button 
                className="flex gap-2 items-center text-white font-bold text-[18px] leading-[1.6]"
                data-testid="button-read-boundaries"
              >
                Read
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 aspect-[600/640] rounded-2xl overflow-hidden">
            <img 
              src="https://www.figma.com/api/mcp/asset/a8e88eac-3797-4930-8f68-b462609e9e2a"
              alt="Door representing boundaries"
              className="w-full h-full object-cover"
            />
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
      question: "Can Civilla give me legal advice?",
      answer: "No. Civilla is built for education only. We explain how family law works, help you organize your case, and show you what options exist. We never tell you what to file, when to file it, or how to argue your case. That requires a lawyer."
    },
    {
      question: "Is my information private?",
      answer: "Yes. Your documents, messages, and case details stay on Civilla's secure servers. We do not share your information with courts, opposing parties, or third parties. See our Privacy Policy for full details."
    },
    {
      question: "What if I need a real lawyer?",
      answer: "Civilla helps you prepare and understand your case, but it does not replace legal representation. If you can afford an attorney, we recommend consulting one. We can help you organize your materials to share with a lawyer."
    },
    {
      question: "Can I use Civilla's documents in court?",
      answer: "Civilla's documents come with clear disclaimers that they are educational drafts, not legal documents. You are responsible for ensuring any document you file meets your court's rules and requirements. Always verify with your local court."
    },
    {
      question: "Who decides what I do with my case?",
      answer: "You do. Civilla gives you information and options. You make all decisions about your case. We support your choices by helping you understand the law and organize your evidence."
    }
  ];

  return (
    <section 
      className="bg-[#f2f2f2] w-full flex flex-col items-center px-16 py-28"
      data-testid="section-faq"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-start w-full">
          <div className="flex flex-col gap-8 items-start w-[500px]">
            <div className="flex flex-col gap-6 items-start text-neutral-darkest w-full">
              <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] w-full" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
                Questions
              </h2>
              <p className="cv-p font-sans text-[20px] leading-[1.6] w-full">
                Find answers about how Civilla works and what it cannot do.
              </p>
            </div>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-[18px] leading-[1.6] px-6 py-2.5 rounded-xl"
              data-testid="button-contact-faq"
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
                  data-testid={`button-faq-${index}`}
                >
                  <span className="flex-1 text-left font-sans font-bold text-[20px] leading-[1.6] text-neutral-darkest">
                    {faq.question}
                  </span>
                  <X className={`w-6 h-6 text-neutral-darkest transition-transform flex-shrink-0 ${openIndex === index ? "" : "rotate-45"}`} />
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="cv-p font-sans text-[18px] leading-[1.6] text-neutral-darkest">
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

export default function LegalCompliance() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <EducationSection />
        <BoundariesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
