import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut, Sparkles, Info, ShieldCheck, LifeBuoy } from "lucide-react";
import logoDark from "@assets/noBgColor-2_1766294100143.png";

const menuLinks = {
  startHere: [
    { label: "Home", href: "/" },
    { label: "Plans & Pricing", href: "/plans" },
    { label: "How Civilla Works", href: "/how-civilla-works" },
  ],
  about: [
    { label: "About Us", href: "/about-civilla" },
  ],
  trustSafety: [
    { label: "Safety & Support", href: "/safety-support" },
    { label: "Legal & Compliance", href: "/legal-compliance" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  support: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  comingSoon: [
    { label: "FAQ", href: "#", disabled: true },
    { label: "Resources", href: "#", disabled: true },
  ]
};

export default function NavbarCream() {
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
    const safePages = [
      "https://en.wikipedia.org/wiki/Coffee#Preparation",
      "https://en.wikipedia.org/wiki/Tea#Preparation",
      "https://en.wikipedia.org/wiki/Houseplant#Care",
      "https://en.wikipedia.org/wiki/Walking#Health_benefits",
      "https://en.wikipedia.org/wiki/Recipe#Ingredients",
      "https://en.wikipedia.org/wiki/Sleep#Recommendations",
      "https://en.wikipedia.org/wiki/Weather#Forecasting",
      "https://en.wikipedia.org/wiki/Photography#Digital_photography",
      "https://en.wikipedia.org/wiki/Music#Elements",
      "https://en.wikipedia.org/wiki/Cooking#Techniques",
      "https://en.wikipedia.org/wiki/Book#Structure",
      "https://en.wikipedia.org/wiki/Exercise#Health_effects"
    ];

    const destination = safePages[Math.floor(Math.random() * safePages.length)];
    window.location.replace(destination);
  };

  return (
    <nav className="bg-cream w-full" data-testid="navbar-cream">
      <div className="h-9 flex items-center justify-center px-6 py-0">
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
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              data-testid="button-menu"
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
          <div className="flex flex-wrap gap-8 max-w-container mx-auto">
            <div className="flex flex-1 flex-col gap-3 items-start min-w-[130px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Start Here
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.startHere.map((link) => (
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
                <div className="mt-3 pt-3 border-t border-neutral-darkest/20 w-full">
                  {menuLinks.comingSoon.map((link) => (
                    <span
                      key={link.label}
                      className="py-1 font-sans font-normal text-[10px] text-neutral-darkest/40 leading-[1.6] w-full cursor-not-allowed flex items-center gap-1.5"
                      aria-disabled="true"
                      data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                      <span className="text-[9px] opacity-70">Soon</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[100px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6] flex items-center gap-1.5">
                <Info className="w-3 h-3" />
                About Civilla
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.about.map((link) => (
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

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[130px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6] flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                Trust & Safety
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.trustSafety.map((link) => (
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
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6] flex items-center gap-1.5">
                <LifeBuoy className="w-3 h-3" />
                Support
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.support.map((link) => (
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
