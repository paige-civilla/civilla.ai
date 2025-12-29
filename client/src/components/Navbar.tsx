import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut, Sparkles, Info, ShieldCheck, Heart, Home, CreditCard, Compass, FileText, Lock, Mail, LogIn, Target, Users, Accessibility, ScrollText, MessageCircle, CircleHelp, Trophy, UserPlus, ChevronDown } from "lucide-react";
import logoWhite from "@assets/noBgWhite-2_1766258904832.png";
import BrandMark from "@/components/BrandMark";

function useFixedNavShell(shellRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    document.body.setAttribute("data-civilla-fixed-nav", "true");

    const applyHeightAndBg = () => {
      const h = shell.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--civilla-nav-h", `${Math.ceil(h)}px`);

      const innerNav = shell.querySelector("nav") as HTMLElement | null;
      if (innerNav) {
        const bg = window.getComputedStyle(innerNav).backgroundColor;
        if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
          shell.style.backgroundColor = bg;
        } else {
          shell.style.backgroundColor = "";
        }
      }
    };

    applyHeightAndBg();
    const ro = new ResizeObserver(() => applyHeightAndBg());
    ro.observe(shell);
    window.addEventListener("resize", applyHeightAndBg);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", applyHeightAndBg);
      document.body.removeAttribute("data-civilla-fixed-nav");
    };
  }, [shellRef]);
}

const menuSections = [
  {
    header: "Get Started",
    icon: Sparkles,
    links: [
      { label: "Home", href: "/", icon: Home },
      { label: "Plans & Pricing", href: "/plans", icon: CreditCard },
      { label: "Login", href: "/login", icon: LogIn },
      { label: "Create account", href: "/register", icon: UserPlus },
    ]
  },
  {
    header: "About civilla",
    icon: Info,
    links: [
      { label: "How civilla Works", href: "/how-civilla-works", icon: Compass },
      { label: "Our Mission", href: "/our-mission", icon: Target },
      { label: "Meet The Founders", href: "/meet-the-founders", icon: Users },
      { label: "Wall Of Wins", href: "/wall-of-wins", icon: Trophy },
    ]
  },
  {
    header: "Trust & Safety",
    icon: ShieldCheck,
    links: [
      { label: "Safety & Support", href: "/safety-support", icon: Heart },
      { label: "Legal & Compliance", href: "/legal-compliance", icon: FileText },
      { label: "Accessibility", href: "/accessibility", icon: Accessibility },
    ]
  },
  {
    header: "Support",
    icon: MessageCircle,
    links: [
      { label: "Contact", href: "/contact", icon: Mail },
      { label: "Privacy Policy", href: "/privacy-policy", icon: Lock },
      { label: "Terms of Service", href: "/terms", icon: ScrollText },
      { label: "FAQs", href: "/faq", icon: CircleHelp },
    ]
  }
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const menuHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const accountHoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useFixedNavShell(shellRef);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const closeAllMenus = useCallback(() => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        isMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(target) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
      if (
        isAccountOpen &&
        accountRef.current &&
        !accountRef.current.contains(target) &&
        accountButtonRef.current &&
        !accountButtonRef.current.contains(target)
      ) {
        setIsAccountOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAllMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen, isAccountOpen, closeAllMenus]);

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

  const handleMenuMouseEnter = () => {
    if (menuHoverTimeoutRef.current) {
      clearTimeout(menuHoverTimeoutRef.current);
      menuHoverTimeoutRef.current = null;
    }
    setIsMenuOpen(true);
    setIsAccountOpen(false);
  };

  const handleMenuMouseLeave = () => {
    menuHoverTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 150);
  };

  const handleAccountMouseEnter = () => {
    if (accountHoverTimeoutRef.current) {
      clearTimeout(accountHoverTimeoutRef.current);
      accountHoverTimeoutRef.current = null;
    }
    setIsAccountOpen(true);
    setIsMenuOpen(false);
  };

  const handleAccountMouseLeave = () => {
    accountHoverTimeoutRef.current = setTimeout(() => {
      setIsAccountOpen(false);
    }, 150);
  };

  return (
    <div ref={shellRef} className="civilla-nav-shell">
    <nav className="bg-bush w-full relative" data-testid="navbar">
      <div className="h-9 flex items-center justify-center px-6 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <Link href="/" className="relative h-7 w-auto" data-testid="link-logo">
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
              className="inline-flex items-center justify-center rounded-md p-1.5 border border-white/20 hover:border-white/35 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Toggle dark mode"
              data-testid="button-theme-toggle"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 text-white" />
              )}
            </button>
            
            <div 
              className="relative"
              onMouseEnter={handleAccountMouseEnter}
              onMouseLeave={handleAccountMouseLeave}
            >
              <button
                ref={accountButtonRef}
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="inline-flex items-center justify-center rounded-md p-1.5 border border-white/20 hover:border-white/35 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                aria-label="Account options"
                aria-haspopup="menu"
                aria-expanded={isAccountOpen}
                data-testid="button-account-dropdown"
              >
                <User className="w-4 h-4 text-white" />
                <ChevronDown className={`w-3 h-3 text-white ml-0.5 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isAccountOpen && (
                <div
                  ref={accountRef}
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-44 bg-[#e7ebea] border border-black/10 rounded-xl shadow-xl py-2 z-50"
                  data-testid="dropdown-account"
                >
                  <Link
                    href="/login"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-900/90 hover:bg-black/5"
                    onClick={() => setIsAccountOpen(false)}
                    data-testid="link-login"
                  >
                    <LogIn className="w-4 h-4 opacity-70" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    role="menuitem"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-900/90 hover:bg-black/5"
                    onClick={() => setIsAccountOpen(false)}
                    data-testid="link-create-account"
                  >
                    <UserPlus className="w-4 h-4 opacity-70" />
                    Create account
                  </Link>
                </div>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMenuMouseLeave}
            >
              <button 
                ref={menuButtonRef}
                className="inline-flex items-center justify-center rounded-md p-1.5 border border-white/20 hover:border-white/35 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                data-testid="button-menu"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Open menu"
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
              >
                <span className="flex items-center gap-1.5">
                  {isMenuOpen ? (
                    <X className="h-4 w-4 text-white" aria-hidden="true" />
                  ) : (
                    <Menu className="h-4 w-4 text-white" aria-hidden="true" />
                  )}
                  <span className="text-xs font-medium text-white">Menu</span>
                </span>
              </button>

              {isMenuOpen && (
                <div 
                  ref={menuRef} 
                  role="menu"
                  className="fixed inset-x-3 top-[44px] md:absolute md:right-0 md:left-auto md:top-full md:mt-2 md:w-[min(900px,calc(100vw-2rem))] bg-[#e7ebea] border border-black/10 rounded-2xl shadow-xl p-6 md:p-8 max-h-[75vh] overflow-auto z-50" 
                  data-testid="dropdown-menu"
                >
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {menuSections.map((section) => (
                      <div key={section.header} className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-neutral-800">
                          <section.icon className="h-4 w-4" />
                          {section.header.includes("civilla") 
                            ? <span className="normal-case tracking-normal text-sm">About <BrandMark text="civilla" /></span>
                            : section.header}
                        </div>
                        <div className="mt-2 h-px w-full bg-black/20" />
                        <div className="mt-4 flex flex-col">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              role="menuitem"
                              className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-md text-[15px] text-neutral-900/90 hover:text-neutral-900 hover:bg-black/5 ${
                                location === link.href ? "font-medium bg-black/[0.06]" : ""
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                              data-testid={`menu-link-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                            >
                              <link.icon className="h-4 w-4 opacity-70" />
                              {link.label.includes("civilla") 
                                ? <span className="inline">How <BrandMark text="civilla" /> Works</span>
                                : link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
    </nav>
    </div>
  );
}
