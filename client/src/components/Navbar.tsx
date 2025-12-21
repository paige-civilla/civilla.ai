import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut } from "lucide-react";
import logoWhite from "@assets/noBgWhite-2_1766258904832.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-civilla-works", label: "How Civilla Works" },
  { href: "/about-civilla", label: "About Civilla" },
  { href: "/plans", label: "Plans" },
  { href: "/legal-compliance", label: "Legal & Compliance" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

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
        <div className="bg-bush border-t border-white/20 px-3 md:px-6 py-4" data-testid="mobile-menu">
          <div className="flex flex-col gap-3 max-w-container mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-white font-bold text-sm leading-[1.6] py-2 px-3 rounded ${
                  location === link.href ? "bg-white/10" : "hover-elevate active-elevate-2"
                }`}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`mobile-link-${link.href.replace("/", "") || "home"}`}
              >
                {link.label}
              </Link>
            ))}
            <button 
              className="text-left text-white font-bold text-sm leading-[1.6] py-2 px-3 rounded hover-elevate active-elevate-2"
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
