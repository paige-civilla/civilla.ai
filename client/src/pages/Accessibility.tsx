import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, ChevronRight, User, Moon, Sun, LogOut, Mail, Phone, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import logoDark from "@assets/noBgColor_(1)_1766261333621.png";

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
    { label: "Accessibility", href: "/accessibility" },
  ]
};

const imgPlaceholderImage = "https://www.figma.com/api/mcp/asset/2ecefc42-8aa5-4b1a-9489-41b686f5fefa";
const imgPlaceholderImage1 = "https://www.figma.com/api/mcp/asset/de90fa76-f3a1-417c-a666-f4bd5043ba0e";
const imgPlaceholderImage2 = "https://www.figma.com/api/mcp/asset/6a97743d-dffe-4c44-82ab-639df66be99f";
const imgPlaceholderImage3 = "https://www.figma.com/api/mcp/asset/5b577512-6cd9-471d-b36c-361b481e15f2";

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

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  };

  const handleQuickExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <nav className="bg-cream w-full h-[72px] flex items-center justify-center px-4 md:px-16 relative z-50" data-testid="navbar-cream">
      <div className="flex items-center justify-between w-full max-w-container gap-8">
        <div className="flex items-center">
          <Link href="/" data-testid="link-logo">
            <img src={logoDark} alt="Civilla" className="h-[30px] w-auto" />
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="p-3"
            data-testid="button-theme-toggle"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6 text-neutral-darkest" />
            ) : (
              <Moon className="w-6 h-6 text-neutral-darkest" />
            )}
          </button>

          <button className="p-3" data-testid="button-user">
            <User className="w-6 h-6 text-neutral-darkest" />
          </button>

          <button
            onClick={handleQuickExit}
            className="flex items-center gap-2 bg-gradient-to-b from-bush to-[#0a2a1f] text-white font-arimo font-bold text-lg px-5 py-2 rounded-xl shadow-sm"
            data-testid="button-quick-exit"
          >
            <LogOut className="w-5 h-5" />
          </button>

          <button
            ref={menuButtonRef}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-3"
            data-testid="button-menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-neutral-darkest" />
            ) : (
              <Menu className="w-6 h-6 text-neutral-darkest" />
            )}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="absolute top-full left-0 right-0 bg-cream border-t border-neutral-darkest/10 shadow-lg z-50"
          data-testid="menu-dropdown"
        >
          <div className="max-w-container mx-auto px-4 md:px-16 py-8">
            <div className="flex gap-16">
              <div className="flex flex-col gap-3">
                <span className="font-arimo font-bold text-xs text-neutral-darkest leading-[1.6]">
                  Product
                </span>
                <div className="flex flex-col">
                  {menuLinks.product.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="py-1.5 font-arimo font-normal text-xs text-neutral-darkest leading-[1.6]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-arimo font-bold text-xs text-neutral-darkest leading-[1.6]">
                  Learn
                </span>
                <div className="flex flex-col">
                  {menuLinks.learn.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="py-1.5 font-arimo font-normal text-xs text-neutral-darkest leading-[1.6]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-arimo font-bold text-xs text-neutral-darkest leading-[1.6]">
                  Help
                </span>
                <div className="flex flex-col">
                  {menuLinks.help.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="py-1.5 font-arimo font-normal text-xs text-neutral-darkest leading-[1.6]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default function Accessibility() {
  return (
    <div className="min-h-screen flex flex-col" data-testid="page-accessibility">
      <NavbarCream />

      {/* Hero Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-8 items-center text-center max-w-[768px] mx-auto">
            <div className="flex flex-col gap-4 items-center w-full">
              <p className="font-arimo font-bold text-base text-neutral-darkest">
                Access
              </p>
              <div className="flex flex-col gap-6 items-center w-full">
                <h1 className="font-figtree font-bold text-[clamp(48px,7vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Everyone deserves access
                </h1>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Civilla is built for all users, regardless of ability or circumstance.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <button className="bg-bush text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-learn-more-hero">
                Learn more
              </button>
              <button className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-report-issue">
                Report an issue
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility is not optional Section */}
      <section className="bg-cream py-28 px-4 md:px-16" data-testid="section-commitment">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 flex flex-col gap-8">
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <p className="font-arimo font-bold text-base text-neutral-darkest">
                    Commitment
                  </p>
                  <div className="flex flex-col gap-6">
                    <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                      Accessibility is not optional for us
                    </h2>
                    <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                      We believe everyone deserves to navigate family law with dignity. That means Civilla works for people with disabilities, chronic illness, language barriers, and different learning styles. We follow WCAG 2.1 AA standards and test regularly with real users.
                    </p>
                  </div>
                </div>
                <ul className="flex flex-col gap-4 list-disc list-inside font-arimo text-lg leading-[1.6] text-neutral-darkest ml-4">
                  <li>Screen reader compatible</li>
                  <li>Keyboard navigation available</li>
                  <li>Adjustable text and colors</li>
                </ul>
              </div>
              <div className="flex gap-6 items-center">
                <button className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-learn-more-commitment">
                  Learn more
                </button>
                <button className="flex items-center gap-2 text-neutral-darkest font-arimo font-bold text-lg" data-testid="button-report">
                  Report
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <img 
                src={imgPlaceholderImage} 
                alt="Accessibility commitment" 
                className="w-full aspect-[600/640] object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Request Accommodations Section */}
      <section className="bg-[#0c2f24] py-28 px-4 md:px-16" data-testid="section-accommodations">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-8 items-center text-center max-w-[768px]">
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                  Request accommodations
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                  Tell us what you need to use Civilla fully and comfortably.
                </p>
              </div>
              <div className="flex gap-4 items-center">
                <button className="bg-[#f2f2f2] text-neutral-darkest font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-request">
                  Request
                </button>
                <button className="bg-transparent border-2 border-white text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl" data-testid="button-contact">
                  Contact
                </button>
              </div>
            </div>
            <div className="w-full aspect-[1280/738] rounded-2xl overflow-hidden">
              <img 
                src={imgPlaceholderImage1} 
                alt="Request accommodations" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Found a Problem Section */}
      <section className="bg-cream py-28 px-4 md:px-16" data-testid="section-problem">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col md:flex-row gap-20 items-start">
            <div className="flex-1 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <p className="font-arimo font-bold text-base text-neutral-darkest">
                  Report
                </p>
                <div className="flex flex-col gap-6">
                  <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                    Found a problem
                  </h2>
                  <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                    Tell us what isn't working so we can fix it quickly.
                  </p>
                </div>
              </div>
              <form className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-arimo text-lg leading-[1.6] text-neutral-darkest">Name</label>
                  <input 
                    type="text" 
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-lg"
                    data-testid="input-name"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-arimo text-lg leading-[1.6] text-neutral-darkest">Email</label>
                  <input 
                    type="email" 
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-2 font-arimo text-lg"
                    data-testid="input-email"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-arimo text-lg leading-[1.6] text-neutral-darkest">Message</label>
                  <textarea 
                    placeholder="Describe the issue"
                    className="bg-transparent border-2 border-neutral-darkest rounded-xl px-3 py-3 font-arimo text-lg h-[180px] resize-none"
                    data-testid="input-message"
                  />
                </div>
                <div className="flex items-center gap-2 py-4">
                  <input 
                    type="checkbox" 
                    className="w-[18px] h-[18px] border-2 border-neutral-darkest rounded"
                    data-testid="checkbox-terms"
                  />
                  <span className="font-arimo text-base leading-[1.6] text-neutral-darkest">I agree to the terms</span>
                </div>
                <button 
                  type="submit"
                  className="bg-bush text-white font-arimo font-bold text-lg px-6 py-2.5 rounded-xl w-fit"
                  data-testid="button-send"
                >
                  Send
                </button>
              </form>
            </div>
            <div className="flex-1">
              <img 
                src={imgPlaceholderImage2} 
                alt="Found a problem" 
                className="w-full h-[734px] object-cover rounded-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* We're Here Section */}
      <section className="bg-[#f2f2f2] py-28 px-4 md:px-16" data-testid="section-contact">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20">
            <div className="flex flex-col gap-4 max-w-[768px]">
              <p className="font-arimo font-bold text-base text-neutral-darkest">
                Support
              </p>
              <div className="flex flex-col gap-6">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  We're here
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Reach out anytime with questions or concerns.
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-20 items-center">
              <div className="flex-1 flex flex-col gap-10 max-w-[400px]">
                <div className="flex flex-col gap-4">
                  <Mail className="w-8 h-8 text-neutral-darkest" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                      Email
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                      Send us a message
                    </p>
                    <a href="mailto:hello@civilla.ai" className="font-arimo text-lg leading-[1.6] text-neutral-darkest underline">
                      hello@civilla.ai
                    </a>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <Phone className="w-8 h-8 text-neutral-darkest" />
                  <div className="flex flex-col gap-2">
                    <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                      Phone
                    </h3>
                    <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                      Call during business hours
                    </p>
                    <a href="tel:+18442484552" className="font-arimo text-lg leading-[1.6] text-neutral-darkest underline">
                      +1 (844) 248-4552
                    </a>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <MapPin className="w-8 h-8 text-neutral-darkest" />
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                        Office
                      </h3>
                      <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                        Oakland, California, United States
                      </p>
                    </div>
                    <button className="flex items-center gap-2 text-neutral-darkest font-arimo font-bold text-lg" data-testid="button-directions">
                      Get directions
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <img 
                  src={imgPlaceholderImage3} 
                  alt="Contact us" 
                  className="w-full h-auto object-contain rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
