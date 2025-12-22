import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut, Sparkles, Info, ShieldCheck, Heart, Home, CreditCard, Compass, FileText, Lock, Mail, LogIn, Target, Users, BookOpen, Accessibility, ScrollText, MessageCircle, CircleHelp, FolderOpen } from "lucide-react";
import logoColor from "@assets/noBgColor-2_1766294100143.png";
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
    header: "Start Here",
    icon: Sparkles,
    links: [
      { label: "Home", href: "/", icon: Home },
      { label: "How civilla Works", href: "/how-civilla-works", icon: Compass },
      { label: "Plans & Pricing", href: "/plans", icon: CreditCard },
      { label: "Login", href: "/login", icon: LogIn },
    ]
  },
  {
    header: "About civilla",
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
      { label: "Safety & Support", href: "/safety-support", icon: Heart },
      { label: "Legal & Compliance", href: "/legal-compliance", icon: FileText },
      { label: "Accessibility", href: "/accessibility", icon: Accessibility },
    ],
    comingSoon: [
      { label: "Resources", icon: FolderOpen },
    ]
  },
  {
    header: "Support",
    icon: MessageCircle,
    links: [
      { label: "Contact", href: "/contact", icon: Mail },
      { label: "Privacy Policy", href: "/privacy-policy", icon: Lock },
      { label: "Terms of Service", href: "/terms", icon: ScrollText },
    ],
    comingSoon: [
      { label: "FAQ", icon: CircleHelp },
    ]
  }
];

export default function NavbarCream() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  useFixedNavShell(shellRef);

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
    <div ref={shellRef} className="civilla-nav-shell">
    <nav className="bg-cream w-full relative" data-testid="navbar-cream">
      <div className="h-9 flex items-center justify-center px-6 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <Link href="/" className="relative h-[30px] w-auto" data-testid="link-logo">
              <img 
                src={logoColor} 
                alt="civilla.ai" 
                className="h-full w-auto object-contain"
              />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 hover:border-neutral-darkest/35 hover:bg-neutral-darkest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40"
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
              className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 hover:border-neutral-darkest/35 hover:bg-neutral-darkest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40"
              aria-label="User login"
              data-testid="button-user-login"
            >
              <User className="w-4 h-4 text-neutral-darkest" />
            </button>
            <button 
              ref={menuButtonRef}
              className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 hover:border-neutral-darkest/35 hover:bg-neutral-darkest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              data-testid="button-menu"
            >
              <span className="flex items-center gap-2">
                {isMenuOpen ? (
                  <X className="h-5 w-5 text-neutral-darkest" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5 text-neutral-darkest" aria-hidden="true" />
                )}
                <span className="text-sm font-medium text-neutral-darkest">Menu</span>
              </span>
            </button>
            <button 
              onClick={handleQuickExit}
              className="ml-2 p-1.5 rounded-md"
              style={{ background: 'linear-gradient(to right, #3d7a6a, #2a5c4e)' }}
              aria-label="Quick exit"
              data-testid="button-quick-exit"
            >
              <LogOut className="w-4 h-4 text-white" />
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
                      ? <span className="normal-case tracking-normal text-sm">About <BrandMark text="civilla" /></span>
                      : section.header}
                  </div>
                  <div className="mt-2 h-px w-full bg-black/20" />
                  <div className="mt-4 flex flex-col">
                    {section.links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-md text-[15px] text-neutral-900/90 hover:text-neutral-900 ${
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
                    {section.comingSoon && (
                      <div className="mt-3 pt-3 border-t border-black/10">
                        {section.comingSoon.map((item) => (
                          <span
                            key={item.label}
                            className="flex items-center justify-between py-2 text-[15px] text-neutral-900/50 cursor-not-allowed"
                            aria-disabled="true"
                          >
                            <span className="flex items-center gap-3">
                              <item.icon className="h-4 w-4 opacity-70" />
                              {item.label}
                            </span>
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
    </div>
  );
}
