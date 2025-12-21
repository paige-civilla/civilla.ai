import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut } from "lucide-react";
import logoDark from "@assets/noBgColor-2_1766294100143.png";

const menuLinks = {
  product: [
    { label: "Home", href: "/" },
    { label: "How it works", href: "/how-civilla-works" },
    { label: "About us", href: "/about-civilla" },
    { label: "Plans & Pricing", href: "/plans" },
  ],
  learn: [
    { label: "Legal & Compliance", href: "/legal-compliance", disabled: false },
    { label: "Safety & Support", href: "/safety-support", disabled: false },
    { label: "FAQ", href: "#", disabled: true },
    { label: "Resources", href: "#", disabled: true },
  ],
  help: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Contact", href: "/contact" },
    { label: "Accessibility", href: "/accessibility" },
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
                  link.disabled ? (
                    <span
                      key={link.label}
                      className="py-1.5 font-sans font-normal text-xs text-neutral-darkest/50 leading-[1.6] w-full cursor-not-allowed flex items-center gap-2"
                      aria-disabled="true"
                      data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {link.label}
                      <span className="text-[10px] opacity-70">Coming soon</span>
                    </span>
                  ) : (
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
                  )
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
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
