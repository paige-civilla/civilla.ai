import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut } from "lucide-react";
import logoWhite from "@assets/noBgWhite-2_1766258904832.png";

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

export default function Navbar() {
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
    <nav className="bg-bush w-full" data-testid="navbar">
      <div className="h-9 md:h-9 flex items-center justify-center px-3 md:px-6 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <Link href="/" className="relative h-[30px] w-auto" data-testid="link-logo">
              <img 
                src={logoWhite} 
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
                <Sun className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 text-white" />
              )}
            </button>
            <button 
              className="p-1.5"
              aria-label="User login"
              data-testid="button-user-login"
            >
              <User className="w-4 h-4 text-white" />
            </button>
            <button 
              ref={menuButtonRef}
              className="p-1"
              data-testid="button-menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-4 h-4 text-white" />
              ) : (
                <Menu className="w-4 h-4 text-white" />
              )}
            </button>
            <button 
              onClick={handleQuickExit}
              className="ml-2 p-1.5 bg-white rounded-md"
              aria-label="Quick exit"
              data-testid="button-quick-exit"
            >
              <LogOut className="w-4 h-4 text-neutral-darkest" />
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div ref={menuRef} className="bg-bush border-t border-white/20 px-3 md:px-6 py-6" data-testid="mobile-menu">
          <div className="flex flex-wrap gap-10 max-w-container mx-auto">
            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-white leading-[1.6]">
                Product
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.product.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-1.5 font-sans font-normal text-xs text-white leading-[1.6] w-full ${
                      location === link.href ? "opacity-70" : ""
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
              <span className="font-sans font-bold text-xs text-white leading-[1.6]">
                Learn
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.learn.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-1.5 font-sans font-normal text-xs text-white leading-[1.6] w-full ${
                      location === link.href ? "opacity-70" : ""
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
              <span className="font-sans font-bold text-xs text-white leading-[1.6]">
                Help
              </span>
              <div className="flex flex-col items-start w-full">
                {menuLinks.help.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`py-1.5 font-sans font-normal text-xs text-white leading-[1.6] w-full ${
                      location === link.href ? "opacity-70" : ""
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
                <button 
                  className="py-1.5 font-sans font-normal text-xs text-white leading-[1.6] w-full text-left"
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
