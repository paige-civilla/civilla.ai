import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, User, Moon, Sun, LogOut, Phone, AlertTriangle, UserX, Bell, Shield } from "lucide-react";
import Footer from "@/components/Footer";
import logoDark from "@assets/noBgColor_(1)_1766261333621.png";
import foggyLandscape from "@assets/foggy-landscape-reflected-in-lake_1766286894997.jpg";

const menuLinks = {
  product: [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/how-civilla-works" },
    { label: "About us", href: "/about-civilla" },
    { label: "Plans & Pricing", href: "/plans" },
  ],
  learn: [
    { label: "Legal & Compliance", href: "/legal-compliance" },
    { label: "Safety & Support", href: "/safety-support" },
    { label: "FAQ", href: "#" },
    { label: "Resources", href: "#" },
  ],
  help: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Accessibility", href: "#" },
  ]
};

const imgQuickExit = "https://www.figma.com/api/mcp/asset/c4115cfe-8611-4c8d-bb5f-5b41cb30f9fd";
const imgPlaceholderImage1 = "https://www.figma.com/api/mcp/asset/70cd2b88-b5c3-4123-83da-b783c1fed0c1";
const imgPrivateBrowser = "https://www.figma.com/api/mcp/asset/a44db474-56ed-4b20-a4be-61f3fa8be1ed";
const imgTabPane1 = "https://www.figma.com/api/mcp/asset/692b1d30-a133-4b7e-9584-de390e708ba4";
const imgPlaceholderImage3 = "https://www.figma.com/api/mcp/asset/86d7b009-7a1d-4335-8b7c-21b12690b64e";

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
        <div ref={menuRef} className="bg-cream border-t border-neutral-darkest/20 px-3 md:px-6 py-6" data-testid="mobile-menu">
          <div className="flex flex-wrap gap-10 max-w-container mx-auto">
            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Product
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.product.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full ${
                      location === link.href ? "opacity-50" : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Learn
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.learn.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full ${
                      location === link.href ? "opacity-50" : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Help
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.help.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full ${
                      location === link.href ? "opacity-50" : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button 
                  className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full text-left"
                  data-testid="menu-button-login"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function SafetySupport() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <NavbarCream />
      
      {/* Hero Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col items-center text-center max-w-[768px] mx-auto gap-8">
            <div className="flex flex-col gap-4 items-center w-full">
              <p className="font-arimo font-bold text-base text-neutral-darkest">
                Grounded
              </p>
              <div className="flex flex-col gap-6 items-center w-full">
                <h1 className="font-figtree font-bold text-[clamp(48px,6vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Safety and support
                </h1>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Resources and features designed to help you stay safe, supported, and in control
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <button className="bg-bush text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl shadow-sm" data-testid="button-learn">
                Learn
              </button>
              <button className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-resources">
                Resources
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Leave in a Click Section */}
      <section className="bg-cream py-28 px-4 md:px-16" data-testid="section-leave-in-click">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <p className="font-arimo font-bold text-base text-neutral-darkest">
                Safety
              </p>
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Leave in a click
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  If you need to exit Civilla quickly, use the quick exit button at the top of every page.
                </p>
              </div>
            </div>

            {/* Quick Exit Card */}
            <div className="w-full border-2 border-neutral-darkest rounded-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[640px]">
              <div className="flex-1 flex flex-col justify-center p-12 gap-8">
                <div className="flex flex-col gap-2">
                  <p className="font-arimo font-bold text-base text-neutral-darkest">
                    Quick exit
                  </p>
                  <div className="flex flex-col gap-6">
                    <h3 className="font-figtree font-bold text-[clamp(32px,4vw,48px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                      How quick exit works
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                      When you click the quick exit button, Civilla closes immediately and redirects you to a neutral website. Your browsing history in Civilla is cleared from your device, and no record of your visit remains visible on your screen.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 items-center">
                  <button className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-learn-more-quick-exit">
                    Learn more
                  </button>
                  <button className="flex items-center gap-2 text-neutral-darkest font-arimo font-bold text-lg" data-testid="button-help-quick-exit">
                    Help
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 h-64 md:h-full">
                <img 
                  src={imgQuickExit} 
                  alt="Safe and comfortable space" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for Discretion Section */}
      <section className="bg-[#0c2f24] py-28 px-4 md:px-16" data-testid="section-discretion">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1">
              <img 
                src={foggyLandscape} 
                alt="Foggy landscape reflected in lake" 
                className="w-full aspect-[600/640] object-cover rounded-2xl"
              />
            </div>
            <div className="flex-1 flex flex-col gap-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <p className="font-arimo font-bold text-base text-white">
                    Design
                  </p>
                  <div className="flex flex-col gap-6">
                    <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                      Designed for discretion
                    </h2>
                    <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                      Civilla is built to be calm, quiet, and unintrusive. No flashing alerts, no unexpected pop-ups, no notifications that might draw unwanted attention.
                    </p>
                  </div>
                </div>
                <div className="flex gap-6 py-6">
                  <div className="h-12 w-[120px] flex items-center justify-center">
                    <span className="text-white font-bold">Desktop</span>
                  </div>
                  <div className="h-12 w-[120px] flex items-center justify-center">
                    <span className="text-white font-bold">Mobile</span>
                  </div>
                  <div className="h-12 w-[120px] flex items-center justify-center">
                    <span className="text-white font-bold">Tablet</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <button className="bg-transparent border-2 border-white text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-learn-discretion">
                  Learn
                </button>
                <button className="flex items-center gap-2 text-white font-arimo font-bold text-lg" data-testid="button-help-discretion">
                  Help
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Safety Tools Section */}
      <section className="bg-[#0c2f24] py-28 px-4 md:px-16" data-testid="section-safety-tools">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <p className="font-arimo font-bold text-base text-white">
                Support
              </p>
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                  Additional safety tools
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                  Civilla includes features designed to help you stay safe.
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-8">
              {/* Neutral Username Card */}
              <div className="md:w-[calc(25%-16px)] border-2 border-white rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <UserX className="w-12 h-12 text-white" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[32px] leading-[1.2] tracking-[0.01em] text-white">
                      Neutral username option
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-white">
                      Use a non-identifying name for your account
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-white font-arimo font-bold text-lg" data-testid="button-help-username">
                  Help
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Customized Notifications Card */}
              <div className="md:w-[calc(25%-16px)] border-2 border-white rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <Bell className="w-12 h-12 text-white" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[32px] leading-[1.2] tracking-[0.01em] text-white">
                      Customized notifications
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-white">
                      Control when and how Civilla contacts you
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-white font-arimo font-bold text-lg" data-testid="button-help-notifications">
                  Help
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Private Browser Mode Card */}
              <div className="md:w-[calc(50%)] border-2 border-white rounded-2xl overflow-hidden flex flex-col self-stretch">
                <div className="h-40">
                  <img 
                    src={imgPrivateBrowser} 
                    alt="Laptop with colorful screen" 
                    className="w-full h-full object-cover object-bottom"
                  />
                </div>
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div className="flex flex-col gap-4">
                    <p className="font-arimo font-bold text-base text-white">
                      Privacy
                    </p>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-figtree font-bold text-[32px] leading-[1.2] tracking-[0.01em] text-white">
                        Private browser mode
                      </h3>
                      <p className="font-arimo text-lg leading-[1.6] text-white">
                        Use incognito or private browsing for extra protection
                      </p>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 text-white font-arimo font-bold text-lg" data-testid="button-help-private">
                    Help
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Emotional Safety Matters Section */}
      <section className="bg-[#f2f2f2] py-28 px-4 md:px-16" data-testid="section-emotional-safety">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <p className="font-arimo font-bold text-base text-neutral-darkest">
                Support
              </p>
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Your emotional safety matters
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Family court can feel overwhelming or frightening. Civilla is here to help you feel informed, supported, and in control of your case.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-16 items-center w-full">
              <div className="w-full aspect-[1280/738] rounded-2xl overflow-hidden">
                <img 
                  src={imgTabPane1} 
                  alt="Emotional safety" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full flex flex-col md:flex-row">
                <div className="flex-1 border-t-2 border-bush px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You are heard
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    Civilla is non-judgmental and designed to validate your experience.
                  </p>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You are in control
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    Every feature is built around your choices and your pace.
                  </p>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You are supported
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

      {/* Civilla is Not an Emergency Service Section */}
      <section className="bg-[#0c2f24] py-28 px-4 md:px-16" data-testid="section-emergency">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 flex flex-col gap-8">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <p className="font-arimo font-bold text-base text-white">
                    Important
                  </p>
                  <div className="flex flex-col gap-6">
                    <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                      Civilla is not an emergency service
                    </h2>
                    <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                      Civilla is an educational platform designed to help you understand family law and organize your case. We cannot respond to crises or provide emergency support.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex gap-4 items-center">
                    <AlertTriangle className="w-4 h-4 text-white" />
                    <p className="font-arimo text-lg leading-[1.6] text-white">
                      If you are in danger
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <Phone className="w-4 h-4 text-white" />
                    <p className="font-arimo text-lg leading-[1.6] text-white">
                      Call 911 immediately
                    </p>
                  </div>
                  <div className="flex gap-4 items-center">
                    <User className="w-4 h-4 text-white" />
                    <p className="font-arimo text-lg leading-[1.6] text-white">
                      Reach out to trusted professionals
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-6 items-center">
                <button className="bg-transparent border-2 border-white text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-learn-emergency">
                  Learn
                </button>
                <button className="flex items-center gap-2 text-white font-arimo font-bold text-lg" data-testid="button-help-emergency">
                  Help
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <img 
                src={imgPlaceholderImage3} 
                alt="Rotary phone" 
                className="w-full aspect-[600/640] object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Crisis Support Section */}
      <section className="bg-cream py-28 px-4 md:px-16" data-testid="section-crisis-support">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <p className="font-arimo font-bold text-base text-neutral-darkest">
                Resources
              </p>
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Crisis support
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  If you need immediate help, these resources are available.
                </p>
              </div>
            </div>

            <div className="w-full flex flex-col md:flex-row gap-8">
              {/* Emergency Card */}
              <div className="flex-1 border-2 border-neutral-darkest rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <AlertTriangle className="w-12 h-12 text-neutral-darkest" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[32px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                      Emergency
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                      Call 911 if you or someone you know is in immediate danger
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button className="bg-bush text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-call-911">
                    Call
                  </button>
                  <button className="flex items-center gap-2 text-neutral-darkest font-arimo font-bold text-lg" data-testid="button-help-call">
                    Help
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* National Domestic Violence Hotline Card */}
              <div className="flex-1 border-2 border-neutral-darkest rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <Phone className="w-12 h-12 text-neutral-darkest" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[32px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                      National Domestic Violence Hotline
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                      1-800-799-7233 or text START to 88788
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-neutral-darkest font-arimo font-bold text-lg" data-testid="button-help-hotline">
                  Help
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              {/* Legal Aid Card */}
              <div className="flex-1 border-2 border-neutral-darkest rounded-2xl p-6 flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <Shield className="w-12 h-12 text-neutral-darkest" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[32px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                      Legal aid and family law support
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                      Find local legal aid organizations in your state
                    </p>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-neutral-darkest font-arimo font-bold text-lg" data-testid="button-help-legal">
                  Help
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
