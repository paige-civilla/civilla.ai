import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut, Sparkles, Info, ShieldCheck, Heart, Home, CreditCard, HelpCircle, FileText, Lock, Mail, LogIn, Target, Users, BookOpen } from "lucide-react";
import logoWhite from "@assets/noBgWhite-2_1766258904832.png";

const menuSections = [
  {
    header: "Start Here",
    icon: Sparkles,
    links: [
      { label: "Home", href: "/", icon: Home },
      { label: "Plans & Pricing", href: "/plans", icon: CreditCard },
      { label: "How it Works", href: "/how-civilla-works", icon: HelpCircle },
      { label: "Login", href: "/login", icon: LogIn },
    ]
  },
  {
    header: "About Us",
    icon: Info,
    links: [
      { label: "Our Mission", href: "/about#mission", icon: Target },
      { label: "Meet The Founders", href: "/about#founders", icon: Users },
      { label: "How We Started", href: "/how-we-started", icon: BookOpen },
    ]
  },
  {
    header: "Trust & Safety",
    icon: ShieldCheck,
    links: [
      { label: "Safety & Support", href: "/safety-support", icon: ShieldCheck },
      { label: "Legal & Compliance", href: "/legal-compliance", icon: FileText },
      { label: "Accessibility", href: "/accessibility", icon: Lock },
    ]
  },
  {
    header: "Support",
    icon: Heart,
    links: [
      { label: "Contact", href: "/contact", icon: Mail },
      { label: "Privacy Policy", href: "/privacy-policy", icon: Lock },
      { label: "Terms of Service", href: "/terms", icon: FileText },
    ],
    comingSoon: [
      { label: "FAQ" },
      { label: "Resources" },
    ]
  }
];

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
    <nav className="bg-bush w-full relative" data-testid="navbar">
      <div className="h-9 flex items-center justify-center px-6 py-0">
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
        <>
          <div 
            ref={menuRef} 
            className="fixed inset-x-3 top-[44px] md:absolute md:right-4 md:left-auto md:top-full md:mt-3 md:w-[min(900px,calc(100vw-2rem))] bg-[#e7ebea] border border-black/10 rounded-2xl shadow-xl p-6 md:p-8 max-h-[75vh] overflow-auto z-50" 
            data-testid="dropdown-menu"
          >
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {menuSections.map((section) => (
                <div key={section.header} className="flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-800">
                    <section.icon className="h-4 w-4" />
                    {section.header.includes("civilla") 
                      ? <>ABOUT<span className="italic font-medium normal-case tracking-normal text-sm ml-[0.08em]">civilla</span></>
                      : section.header}
                  </div>
                  <div className="mt-2 h-px w-full bg-black/20" />
                  <div className="mt-4 flex flex-col">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 py-2 text-[15px] text-neutral-900/90 hover:text-neutral-900 ${
                          location === link.href ? "font-medium" : ""
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                        data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                      >
                        <link.icon className="h-4 w-4 opacity-70" />
                        {link.label.includes("civilla") 
                          ? <>How <span className="italic font-medium">civilla</span> Works</>
                          : link.label}
                      </Link>
                    ))}
                    {section.comingSoon && (
                      <div className="mt-3 pt-3 border-t border-black/10">
                        {section.comingSoon.map((item) => (
                          <span
                            key={item.label}
                            className="flex items-center justify-between py-2 text-[15px] text-neutral-900/50 cursor-not-allowed"
                            aria-disabled="true"
                          >
                            <span>{item.label}</span>
                            <span className="text-[11px] opacity-60">Coming Soon</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
