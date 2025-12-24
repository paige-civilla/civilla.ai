import { Phone, Check, LogOut, ChevronDown } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import { FAQ_SAFETY, type FaqItem } from "@/content/faqs";
import { Link } from "wouter";
import foggyLandscape from "@assets/foggy-landscape-reflected-in-lake_1766286894997.jpg";

const imgTabPane1 = "https://www.figma.com/api/mcp/asset/692b1d30-a133-4b7e-9584-de390e708ba4";

const safetyTools = [
  {
    title: "Neutral username option",
    description: "Use a non-identifying account name",
    details: "When you create your account, you can choose any name you'd like. You don't have to use your real name, and we won't ask you to verify your identity."
  },
  {
    title: "Customized notifications",
    description: "Control when and how civilla contacts you",
    details: "You decide if and when civilla sends you emails or notifications. You can turn them off entirely, or set specific times when you're comfortable receiving them."
  },
  {
    title: "Private browsing tips",
    description: "Guidance for safer browsing habits",
    details: "For extra privacy, consider using your browser's private/incognito mode and clearing your browsing history after each session."
  }
];

const resourceLinks = [
  { name: "National Domestic Violence Hotline", url: "https://www.thehotline.org/", description: "24/7 support for survivors of domestic violence" },
  { name: "RAINN (Rape, Abuse & Incest National Network)", url: "https://www.rainn.org/", description: "Support for survivors of sexual violence" },
  { name: "National Suicide Prevention Lifeline", url: "https://988lifeline.org/", description: "24/7 crisis support (call or text 988)" },
  { name: "LawHelp.org", url: "https://www.lawhelp.org/", description: "Free legal help by state" },
  { name: "WomensLaw.org", url: "https://www.womenslaw.org/", description: "Legal resources for survivors of abuse" }
];

function StyledCivilla({ text }: { text: string }) {
  const parts = text.split(/(civilla(?:'s)?)/gi);
  return (
    <>
      {parts.map((part, i) => 
        /^civilla('s)?$/i.test(part) ? (
          <span key={i} className="italic font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function FAQAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-neutral-darkest/10 rounded-2xl border border-neutral-darkest/15 bg-white/40">
      {items.map((item) => (
        <details key={item.id} className="group p-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
            <span className="font-arimo text-base sm:text-lg font-semibold text-neutral-darkest">
              <StyledCivilla text={item.q} />
            </span>
            <ChevronDown className="h-5 w-5 opacity-70 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="mt-3 font-arimo text-sm sm:text-base leading-relaxed text-neutral-darkest/80">
            <StyledCivilla text={item.a} />
          </div>
        </details>
      ))}
    </div>
  );
}

export default function SafetySupport() {
  const jumpLinks = [
    { label: "Quick Exit", href: "#quick-exit" },
    { label: "Privacy And Data", href: "#privacy" },
    { label: "Designed For Discretion", href: "#discretion" },
    { label: "Emotional Safety", href: "#emotional" },
    { label: "Not An Emergency Service", href: "#emergency" },
    { label: "Resources", href: "#resources" }
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col" data-testid="page-safety-support">
      <NavbarCream />
      
      {/* Hero Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col items-center text-center max-w-[768px] mx-auto gap-6">
            <h1 className="font-figtree font-bold text-[clamp(48px,6vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
              Safety And Support
            </h1>
            <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
              Tools and guidance designed to help you stay safe, steady, and in control.
            </p>
            
            {/* Jump links nav */}
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-3 pt-4" aria-label="On this page">
              {jumpLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="font-arimo text-base text-neutral-darkest underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
                  data-testid={`link-jump-${link.href.slice(1)}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </section>

      {/* Quick Exit Section */}
      <section id="quick-exit" className="bg-cream py-28 px-4 md:px-16 scroll-mt-20" data-testid="section-quick-exit">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col items-center">
            <div className="w-full max-w-3xl border-2 border-neutral-darkest rounded-2xl p-8 md:p-12">
              <div className="flex flex-col gap-8 items-center text-center">
                <div className="flex flex-col gap-6">
                  <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                    Quick Exit
                  </h2>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    Need to leave quickly? Use Quick Exit at the top of any page to jump to a neutral site.
                  </p>
                  <ul className="flex flex-col gap-2 text-left mx-auto">
                    <li className="font-arimo text-base leading-[1.6] text-neutral-darkest/80 flex items-start gap-2">
                      <span className="text-neutral-darkest/60">•</span>
                      For extra safety, consider private browsing.
                    </li>
                    <li className="font-arimo text-base leading-[1.6] text-neutral-darkest/80 flex items-start gap-2">
                      <span className="text-neutral-darkest/60">•</span>
                      If you share a device, clear history when it's safe to do so.
                    </li>
                  </ul>
                </div>
                
                <div className="flex flex-col items-center gap-4 pt-4">
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(to right, #3d7a6a, #2a5c4e)' }}
                    aria-hidden="true"
                  >
                    <LogOut className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-arimo text-sm text-neutral-darkest/70">
                    Look for this button in the top-right corner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy And Data Section */}
      <section id="privacy" className="bg-[#f2f2f2] py-28 px-4 md:px-16 scroll-mt-20" data-testid="section-privacy">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-6 items-center text-center max-w-3xl mx-auto">
            <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
              Privacy And Data
            </h2>
            <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest">
              Your information is sensitive. We minimize access and protect it with security controls.
            </p>
            <ul className="flex flex-col gap-2 text-left w-full max-w-md mx-auto mt-4">
              <li className="font-arimo text-base md:text-lg leading-[1.6] text-neutral-darkest flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-bush/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-bush" />
                </div>
                You control what you download or share.
              </li>
              <li className="font-arimo text-base md:text-lg leading-[1.6] text-neutral-darkest flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-bush/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-bush" />
                </div>
                We do not sell personal information.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Designed for Discretion Section */}
      <section id="discretion" className="bg-[#0c2f24] py-28 px-4 md:px-16 scroll-mt-20" data-testid="section-discretion">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-12 items-center max-w-3xl mx-auto">
            <div className="w-full">
              <img 
                src={foggyLandscape} 
                alt="Foggy landscape reflected in lake" 
                className="w-full aspect-[16/9] object-cover rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-6 text-center">
              <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                Designed For Discretion
              </h2>
              <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                <span className="italic font-medium">civilla</span> is built to feel calm and unobtrusive.
              </p>
              <ul className="flex flex-col gap-2 text-left w-full max-w-md mx-auto">
                <li className="font-arimo text-base md:text-lg leading-[1.6] text-white flex items-start gap-3">
                  <span className="text-white/60">•</span>
                  No flashing alerts
                </li>
                <li className="font-arimo text-base md:text-lg leading-[1.6] text-white flex items-start gap-3">
                  <span className="text-white/60">•</span>
                  No surprise pop-ups
                </li>
                <li className="font-arimo text-base md:text-lg leading-[1.6] text-white flex items-start gap-3">
                  <span className="text-white/60">•</span>
                  No noisy notifications by default
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tools Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-safety-tools">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-16 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Safety Tools Inside <span className="italic font-medium">civilla</span>
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Features designed to help you stay safe and in control.
                </p>
              </div>
            </div>

            <div className="w-full max-w-3xl">
              <div className="flex flex-col gap-4">
                {safetyTools.map((tool) => (
                  <details key={tool.title} className="group border-2 border-neutral-darkest/30 rounded-2xl overflow-hidden bg-white/40">
                    <summary className="flex items-center gap-4 p-6 cursor-pointer list-none">
                      <div className="w-8 h-8 rounded-full bg-bush/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-bush" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-figtree font-bold text-xl leading-[1.2] text-neutral-darkest">
                          {tool.title}
                        </h3>
                        <p className="font-arimo text-base leading-[1.6] text-neutral-darkest/80 mt-1">
                          {tool.description}
                        </p>
                      </div>
                    </summary>
                    <div className="px-6 pb-6 pt-0 pl-[72px]">
                      <p className="font-arimo text-base leading-[1.6] text-neutral-darkest/70">
                        {tool.details}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Your Emotional Safety Matters Section */}
      <section id="emotional" className="bg-[#f2f2f2] py-28 px-4 md:px-16 scroll-mt-20" data-testid="section-emotional-safety">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Your Emotional Safety Matters
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Family court can feel overwhelming. <span className="italic font-medium">civilla</span> is designed to reduce chaos and help you stay oriented.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-16 items-center w-full">
              <div className="w-full aspect-[1280/738] rounded-2xl overflow-hidden">
                <img 
                  src={imgTabPane1} 
                  alt="Calm and supportive environment" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full flex flex-col md:flex-row">
                <div className="flex-1 border-t-2 border-bush px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You Are Heard
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    <span className="italic font-medium">civilla</span> is non-judgmental and designed to validate your experience.
                  </p>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You Are In Control
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    Every feature is built around your choices and your pace.
                  </p>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You Are Supported
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    We provide education, resources, and a calm space to organize your case.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Service Section */}
      <section id="emergency" className="bg-[#0c2f24] py-28 px-4 md:px-16 scroll-mt-20" data-testid="section-emergency">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-8 items-center text-center max-w-3xl mx-auto">
            <div className="flex flex-col gap-6">
              <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                Not An Emergency Service
              </h2>
              <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                If you are in immediate danger, call 911 (U.S.). If you are in crisis, call or text 988 (U.S.).
              </p>
            </div>
            <div className="flex flex-col gap-4 py-2">
              <a href="tel:911" className="flex gap-4 items-center group">
                <Phone className="w-6 h-6 text-white flex-shrink-0" />
                <span className="font-arimo text-lg leading-[1.6] text-white underline underline-offset-4 decoration-white/40 group-hover:decoration-white transition-colors">
                  Call 911 for emergencies
                </span>
              </a>
              <a href="tel:988" className="flex gap-4 items-center group">
                <Phone className="w-6 h-6 text-white flex-shrink-0" />
                <span className="font-arimo text-lg leading-[1.6] text-white underline underline-offset-4 decoration-white/40 group-hover:decoration-white transition-colors">
                  Call or text 988 for crisis support (24/7)
                </span>
              </a>
              <a href="tel:18007997233" className="flex gap-4 items-center group">
                <Phone className="w-6 h-6 text-white flex-shrink-0" />
                <span className="font-arimo text-lg leading-[1.6] text-white underline underline-offset-4 decoration-white/40 group-hover:decoration-white transition-colors">
                  National DV Hotline: 1-800-799-7233 or text START to 88788
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="bg-cream py-28 px-4 md:px-16 scroll-mt-20" data-testid="section-resources">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col gap-6 text-center">
              <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                Resources
              </h2>
              <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest">
                A starting point for safety planning and support services. If you need help right now, use the emergency resources above.
              </p>
            </div>
            
            <ul className="flex flex-col gap-4 mt-4">
              {resourceLinks.map((resource) => (
                <li key={resource.name} className="flex flex-col gap-1">
                  <a 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-arimo text-base md:text-lg font-semibold text-neutral-darkest underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
                    data-testid={`link-resource-${resource.name.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {resource.name}
                  </a>
                  <span className="font-arimo text-sm md:text-base text-neutral-darkest/70">
                    {resource.description}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Safety FAQ Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-faq">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-12 max-w-3xl mx-auto">
            <div className="flex flex-col gap-4 text-center">
              <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                Safety FAQ
              </h2>
              <p className="font-arimo text-lg md:text-xl leading-[1.6] text-neutral-darkest">
                Common questions about staying safe with <span className="italic font-medium">civilla</span>.
              </p>
            </div>
            
            <FAQAccordion items={FAQ_SAFETY} />
            
            <div className="text-center pt-4">
              <Link 
                href="/contact" 
                className="font-arimo font-bold text-base md:text-lg text-neutral-darkest underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
                data-testid="link-contact-support"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
