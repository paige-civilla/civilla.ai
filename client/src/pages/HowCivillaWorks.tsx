import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, User, Moon, Sun, LogOut } from "lucide-react";
import Footer from "@/components/Footer";
import logoDark from "@assets/noBgColor_(1)_1766261333621.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-civilla-works", label: "How Civilla Works" },
  { href: "/about-civilla", label: "About Civilla" },
  { href: "/plans", label: "Plans & Pricing" },
  { href: "/legal-compliance", label: "Legal & Compliance" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

const logoDarkUrl = "https://www.figma.com/api/mcp/asset/4389936b-52f2-402c-bdc3-7e8926ee5f89";
const imgPlaceholderImage = "https://www.figma.com/api/mcp/asset/c0dba5d6-8871-4138-b2ce-bb7c8038878a";
const imgPlaceholderImage1 = "https://www.figma.com/api/mcp/asset/9a0ac209-9561-45fe-b293-55d1583c7ca2";
const imgPlaceholderImage2 = "https://www.figma.com/api/mcp/asset/b6f578e1-f8c6-4a83-a231-b37ce3725e41";
const imgAvatarImage = "https://www.figma.com/api/mcp/asset/56ff492f-7eaa-408f-a9f2-2256c46176ba";
const imgVector = "https://www.figma.com/api/mcp/asset/733776f2-b811-4d3c-84db-e74919032fd1";
const imgVector1 = "https://www.figma.com/api/mcp/asset/e735d03f-ac75-40ca-bfe1-7e7077182662";
const imgVector2 = "https://www.figma.com/api/mcp/asset/91268db6-076c-4db4-9141-c3f3fa218d73";
const imgChevronDark = "https://www.figma.com/api/mcp/asset/324665d6-f92e-4588-8abc-6f01d178f111";
const imgChevronWhite = "https://www.figma.com/api/mcp/asset/5988c768-95a9-4b79-905a-e64fdef8c6a3";
const imgRuleIcon = "https://www.figma.com/api/mcp/asset/eb534531-c64a-41f5-8ac8-db343f842da1";
const imgExploreIcon = "https://www.figma.com/api/mcp/asset/b7406a41-4908-40e6-bf88-31270c1ca4cb";
const imgStars = "https://www.figma.com/api/mcp/asset/9a8784d4-e265-4a60-8093-549fabd13b41";

function NavbarCream() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleQuickExit = () => {
    window.location.replace("https://www.google.com");
  };

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
              onClick={toggleDarkMode}
              className="p-1.5"
              aria-label="Toggle dark mode"
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-neutral-darkest" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-darkest" />
              )}
            </button>
            <button 
              className="p-1.5"
              aria-label="User login"
              data-testid="button-user-login"
            >
              <User className="w-4 h-4 text-neutral-darkest" />
            </button>
            <button 
              ref={menuButtonRef}
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
            <button 
              onClick={handleQuickExit}
              className="ml-2 p-1.5 rounded-md"
              style={{ background: "linear-gradient(135deg, #2D5A4A 0%, #3D7A5A 50%, #4A8A6A 100%)" }}
              aria-label="Quick exit"
              data-testid="button-quick-exit"
            >
              <LogOut className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} className="bg-cream border-t border-neutral-darkest/20 px-3 md:px-6 py-4" data-testid="mobile-menu">
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
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
              Process
            </span>
            <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-[84px] tracking-[0.84px] w-full">
                How Civilla works
              </h1>
              <p className="cv-p font-sans text-[20px] w-full">
                A calm, step-by-step guide to understanding your case and taking control
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
              data-testid="button-explore"
            >
              Explore
            </button>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-signup"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-16 py-28" data-testid="section-journey">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
            Journey
          </span>
          <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading text-[60px] tracking-[0.6px] w-full">
              Your case, step by step
            </h2>
            <p className="cv-p font-sans text-[20px] w-full">
              See how family law cases typically move through the courts
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex gap-8 items-start w-full">
            <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 flex flex-col">
              <div className="flex flex-col gap-6 items-start justify-center p-8">
                <div className="flex flex-col gap-2 items-start w-full">
                  <span className="font-sans font-bold text-[16px] text-neutral-darkest leading-[1.5]">
                    Step one
                  </span>
                  <div className="flex flex-col gap-4 items-start text-neutral-darkest w-full">
                    <h3 className="font-heading font-bold text-[40px] leading-[1.2] tracking-[0.4px] w-full">
                      Understand your case type and timeline
                    </h3>
                    <p className="font-sans font-normal text-body-regular leading-[1.6] w-full">
                      Learn what happens when
                    </p>
                  </div>
                </div>
                <button className="flex gap-2 items-center" data-testid="button-step1-explore">
                  <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                    Explore
                  </span>
                  <ChevronRight className="w-6 h-6 text-neutral-darkest" />
                </button>
              </div>
              <div className="h-[416px] w-full">
                <img src={imgPlaceholderImage} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex flex-col gap-8 items-start w-[864px]">
              <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 w-full flex">
                <div className="flex flex-1 flex-col gap-6 items-start justify-center p-8">
                  <div className="flex flex-col gap-2 items-start w-full">
                    <span className="font-sans font-bold text-[16px] text-neutral-darkest leading-[1.5]">
                      Step two
                    </span>
                    <div className="flex flex-col gap-4 items-start text-neutral-darkest w-full">
                      <h3 className="font-heading font-bold text-[40px] leading-[1.2] tracking-[0.4px] w-full">
                        Gather and organize your documents
                      </h3>
                      <p className="font-sans font-normal text-body-regular leading-[1.6] w-full">
                        Upload evidence, messages, photos, and timelines in one place
                      </p>
                    </div>
                  </div>
                  <button className="flex gap-2 items-center" data-testid="button-step2-explore">
                    <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                      Explore
                    </span>
                    <ChevronRight className="w-6 h-6 text-neutral-darkest" />
                  </button>
                </div>
                <div className="h-full w-[432px]">
                  <img src={imgPlaceholderImage1} alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex gap-8 items-start w-full">
                <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 flex flex-col">
                  <div className="flex flex-col gap-6 items-start justify-center p-8">
                    <div className="flex flex-col gap-6 items-start w-full">
                      <div className="w-12 h-12 relative">
                        <img src={imgRuleIcon} alt="" className="w-full h-full" />
                      </div>
                      <div className="flex flex-col gap-4 items-start text-neutral-darkest w-full">
                        <h3 className="font-heading font-bold text-[40px] leading-[1.2] tracking-[0.4px] w-full">
                          Step three
                        </h3>
                        <p className="font-sans font-normal text-body-regular leading-[1.6] w-full">
                          Research the laws and rules that apply to you
                        </p>
                      </div>
                    </div>
                    <button className="flex gap-2 items-center" data-testid="button-step3-explore">
                      <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                        Find state-specific statutes, court rules, and educational resources
                      </span>
                      <ChevronRight className="w-6 h-6 text-neutral-darkest" />
                    </button>
                  </div>
                </div>

                <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 flex flex-col">
                  <div className="flex flex-col gap-6 items-start justify-center p-8">
                    <div className="flex flex-col gap-6 items-start w-full">
                      <div className="w-12 h-12 relative">
                        <img src={imgExploreIcon} alt="" className="w-full h-full" />
                      </div>
                      <div className="flex flex-col gap-4 items-start text-neutral-darkest w-full">
                        <h3 className="font-heading font-bold text-[40px] leading-[1.2] tracking-[0.4px] w-full">
                          Explore
                        </h3>
                        <p className="font-sans font-normal text-body-regular leading-[1.6] w-full">
                          Step four
                        </p>
                      </div>
                    </div>
                    <button className="flex gap-2 items-center" data-testid="button-step4-explore">
                      <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                        Prepare yourself with knowledge and clarity
                      </span>
                      <ChevronRight className="w-6 h-6 text-neutral-darkest" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClaritySection() {
  return (
    <section className="bg-bush-dark w-full flex flex-col items-center px-16 py-28" data-testid="section-clarity">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <span className="font-sans font-bold text-[16px] text-white text-center leading-[1.5]">
            Clarity
          </span>
          <div className="flex flex-col gap-6 items-center text-white text-center w-full">
            <h2 className="cv-h font-heading text-[60px] tracking-[0.6px] w-full">
              What changes when you understand the process
            </h2>
            <p className="cv-p font-sans text-[20px] w-full">
              Overwhelm fades when you see the path ahead. Knowledge replaces fear, and you move from feeling lost to feeling grounded in what comes next.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex gap-12 items-start w-full">
            <div className="flex flex-1 flex-col gap-6 items-center min-h-0">
              <div className="w-12 h-12 relative flex-shrink-0">
                <img src={imgVector2} alt="" className="w-full h-full" />
              </div>
              <div className="flex flex-col gap-6 items-center text-white text-center w-full">
                <h3 className="cv-h font-heading text-[40px] tracking-[0.4px] w-full">
                  The stress of not knowing what comes next
                </h3>
                <p className="cv-p font-sans text-body-regular w-full">
                  You move from confusion to clarity. From isolated to supported. From powerless to informed.
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-6 items-center min-h-0">
              <div className="w-12 h-12 relative flex-shrink-0">
                <img src={imgVector1} alt="" className="w-full h-full" />
              </div>
              <div className="flex flex-col gap-6 items-center text-white text-center w-full">
                <h3 className="cv-h font-heading text-[40px] tracking-[0.4px] w-full">
                  What your options actually are
                </h3>
                <p className="cv-p font-sans text-body-regular w-full">
                  When you understand the process, fear loses its grip. You see the path ahead.
                </p>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-6 items-center min-h-0">
              <div className="w-12 h-12 relative flex-shrink-0">
                <img src={imgVector} alt="" className="w-full h-full" />
              </div>
              <div className="flex flex-col gap-6 items-center text-white text-center w-full">
                <h3 className="cv-h font-heading text-[40px] tracking-[0.4px] w-full">
                  Your sense of agency in your own case
                </h3>
                <p className="cv-p font-sans text-body-regular w-full">
                  Education is power. We explain how family law works so you can make decisions that fit your situation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6 items-center">
          <button 
            className="bg-transparent border-2 border-white text-white font-bold text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl"
            data-testid="button-clarity-explore"
          >
            Explore
          </button>
          <button className="flex gap-2 items-center" data-testid="button-clarity-learn">
            <span className="font-sans font-bold text-body-regular text-white leading-[1.6]">
              Learn
            </span>
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  const tabs = [
    { id: "case-journey", label: "Case journey" },
    { id: "evidence-map", label: "Evidence map" },
    { id: "research-guide", label: "Research guide" },
    { id: "document-prep", label: "document prep" },
    { id: "timeline-view", label: "Timeline view" },
    { id: "safety-tools", label: "Safety tools" },
  ];

  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-16 py-28" data-testid="section-tools">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
            Tools
          </span>
          <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading text-[60px] tracking-[0.6px] w-full">
              What you get inside
            </h2>
            <p className="cv-p font-sans text-[20px] w-full">
              Each tool is built to help you understand your case and stay organized. Nothing is hidden or complicated.
            </p>
          </div>
        </div>

        <div className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl overflow-hidden w-full">
          <div className="flex items-start w-full">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className={`flex-1 flex flex-col items-center justify-center px-8 py-6 ${
                  index === 0 ? "" : "border-l-2 border-neutral-darkest"
                } ${index === 0 ? "" : "border-b-2 border-neutral-darkest"}`}
              >
                <span className="font-heading font-bold text-[26px] text-neutral-darkest text-center leading-[1.2] tracking-[0.26px] w-full">
                  {tab.label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-start w-full border-t-2 border-neutral-darkest">
            <div className="flex flex-1 gap-20 items-center p-12">
              <div className="cv-panel-body flex flex-1 flex-col gap-8 items-start justify-center">
                <div className="flex flex-col gap-4 items-start w-full">
                  <span className="font-sans font-bold text-[16px] text-neutral-darkest leading-[1.5]">
                    Learn
                  </span>
                  <div className="flex flex-col gap-6 items-start text-neutral-darkest w-full">
                    <h3 className="cv-h font-heading text-[48px] tracking-[0.48px] w-full">
                      See how your case typically moves through court
                    </h3>
                    <p className="cv-p font-sans text-body-regular w-full">
                      Family law cases follow a pattern. We show you each stage so you know what to expect and when.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 items-center w-full">
                  <button 
                    className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl"
                    data-testid="button-tools-explore"
                  >
                    Explore
                  </button>
                  <button className="flex gap-2 items-center" data-testid="button-tools-learn">
                    <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                      Learn more
                    </span>
                    <ChevronRight className="w-6 h-6 text-neutral-darkest" />
                  </button>
                </div>
              </div>
              <div className="flex-1 aspect-square rounded-2xl overflow-hidden">
                <img src={imgPlaceholderImage2} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-bush-dark w-full flex flex-col items-center px-16 py-28 h-[576px]" data-testid="section-cta">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="cv-panel bg-bush-dark border-2 border-white rounded-2xl flex flex-col h-[352px] items-center justify-center p-16 w-full">
          <div className="flex flex-col gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-6 items-center text-white text-center w-full">
              <h2 className="cv-h font-heading text-[60px] tracking-[0.6px] w-full">
                Ready to begin
              </h2>
              <p className="cv-p font-sans text-[20px] w-full">
                Explore Civilla for your case at your own pace
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <button 
                className="bg-neutral-lightest text-neutral-darkest font-bold text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl button-inset-shadow relative"
                data-testid="button-cta-start"
              >
                Start
              </button>
              <button 
                className="bg-transparent border-2 border-white text-white font-bold text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl"
                data-testid="button-cta-learn"
              >
                Learn
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    {
      id: 1,
      quote: "\"I finally understood what was happening in my case instead of just feeling lost and afraid.\"",
      name: "Sarah M.",
      role: "Parent, California"
    },
    {
      id: 2,
      quote: "\"Having everything organized in one place made me feel like I had some control back.\"",
      name: "James T.",
      role: "Parent, Texas"
    },
    {
      id: 3,
      quote: "\"The explanations were clear and didn't make me feel stupid for not knowing the law.\"",
      name: "Maria L.",
      role: "Parent, Florida"
    }
  ];

  return (
    <section className="bg-cream w-full flex flex-col items-center px-16 py-28" data-testid="section-testimonials">
      <div className="flex flex-col gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-6 items-center max-w-[768px] text-neutral-darkest text-center w-full">
          <h2 className="cv-h font-heading text-[60px] tracking-[0.6px] w-full">
            Real voices
          </h2>
          <p className="cv-p font-sans text-[20px] w-full">
            What parents are saying
          </p>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex gap-8 items-stretch w-full">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-1 flex flex-col justify-between p-8 bg-cream border-2 border-neutral-darkest rounded-2xl min-h-0"
                data-testid={`testimonial-${testimonial.id}`}
              >
                <div className="cv-panel-body flex flex-col gap-6 items-start">
                  <img src={imgStars} alt="5 stars" className="h-[19px] w-[116px]" />
                  <p className="cv-p font-sans text-[20px] text-neutral-darkest">
                    {testimonial.quote}
                  </p>
                </div>
                <div className="flex gap-4 items-center w-full mt-6">
                  <img 
                    src={imgAvatarImage} 
                    alt={testimonial.name} 
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex flex-col items-start text-neutral-darkest text-body-regular leading-[1.6] min-w-0">
                    <span className="font-sans font-bold break-words">{testimonial.name}</span>
                    <span className="font-sans font-normal break-words">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HowCivillaWorks() {
  return (
    <div className="flex flex-col items-start w-full min-h-screen" data-testid="page-how-civilla-works">
      <NavbarCream />
      <HeaderSection />
      <JourneySection />
      <ClaritySection />
      <ToolsSection />
      <CTASection />
      <TestimonialsSection />
      <Footer />
    </div>
  );
}
