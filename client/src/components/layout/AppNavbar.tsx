import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Moon, Sun, LogOut, Briefcase, LayoutDashboard, Settings, User, FileText, Calendar, FolderOpen, Image, CheckSquare, Clock, MessageSquare } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoColor from "@assets/noBgColor-2_1766294100143.png";
import logoWhite from "@assets/noBgWhite-2_1766258904832.png";

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

const getStaticMenuLinks = () => [
  { label: "Cases", href: "/app/cases", icon: Briefcase },
];

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);

  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);

  useFixedNavShell(shellRef);

  const { data: authData } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: casesData } = useQuery<{ cases: { id: string; title: string }[] }>({
    queryKey: ["/api/cases"],
    enabled: !!authData?.user,
  });

  const getSelectedCaseId = () => {
    const selectedCaseId = localStorage.getItem("selectedCaseId");
    const cases = casesData?.cases || [];
    if (selectedCaseId && cases.some((c) => c.id === selectedCaseId)) {
      return selectedCaseId;
    }
    if (cases.length > 0) {
      return cases[0].id;
    }
    return null;
  };

  const menuLinks = (() => {
    const caseId = getSelectedCaseId();
    const links = [
      { label: "Dashboard", href: caseId ? `/app/dashboard/${caseId}` : "/app", icon: LayoutDashboard },
      ...getStaticMenuLinks(),
    ];
    if (caseId) {
      links.push(
        { label: "Documents", href: `/app/documents/${caseId}`, icon: FileText },
        { label: "Timeline", href: `/app/timeline/${caseId}`, icon: Calendar },
        { label: "Evidence", href: `/app/evidence/${caseId}`, icon: FolderOpen },
        { label: "Exhibits", href: `/app/exhibits/${caseId}`, icon: Image },
        { label: "Tasks", href: `/app/tasks/${caseId}`, icon: CheckSquare },
        { label: "Deadlines", href: `/app/deadlines/${caseId}`, icon: Clock },
        { label: "Messages", href: `/app/messages/${caseId}`, icon: MessageSquare },
        { label: "Case Settings", href: `/app/case/${caseId}`, icon: Settings },
      );
    }
    return links;
  })();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
    },
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("civilla-theme");
    const isDark = savedTheme === "dark";
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
    }
  }, [isMenuOpen]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    document.documentElement.classList.toggle("dark", newMode);
    localStorage.setItem("civilla-theme", newMode ? "dark" : "light");
  };

  const handleQuickExit = () => {
    const safePages = [
      "https://en.wikipedia.org/wiki/Coffee#Preparation",
      "https://en.wikipedia.org/wiki/Tea#Preparation",
      "https://en.wikipedia.org/wiki/Houseplant#Care",
    ];
    const destination = safePages[Math.floor(Math.random() * safePages.length)];
    window.location.replace(destination);
  };

  return (
    <div ref={shellRef} className="civilla-nav-shell">
      <nav className="bg-cream dark:bg-background w-full relative" data-testid="navbar-app">
        <div className="h-9 flex items-center justify-center px-5 md:px-16 py-0">
          <div className="flex items-center justify-between gap-4 w-full max-w-container">
            <div className="flex items-center">
              <Link href="/app" className="relative h-7 w-auto" data-testid="link-logo-app">
                <img 
                  src={isDarkMode ? logoWhite : logoColor} 
                  alt="civilla.ai" 
                  className="h-full w-auto object-contain"
                />
              </Link>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button 
                onClick={toggleDarkMode}
                className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 dark:border-white/20 hover:border-neutral-darkest/35 dark:hover:border-white/35 hover:bg-neutral-darkest/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40 dark:focus-visible:ring-white/40"
                aria-label="Toggle dark mode"
                data-testid="button-theme-toggle-app"
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-foreground" />
                )}
              </button>
              <button 
                ref={menuButtonRef}
                className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 dark:border-white/20 hover:border-neutral-darkest/35 dark:hover:border-white/35 hover:bg-neutral-darkest/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40 dark:focus-visible:ring-white/40"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                data-testid="button-menu-app"
              >
                <span className="flex items-center gap-1.5">
                  {isMenuOpen ? (
                    <X className="h-4 w-4 text-foreground" aria-hidden="true" />
                  ) : (
                    <Menu className="h-4 w-4 text-foreground" aria-hidden="true" />
                  )}
                  <span className="text-xs font-medium text-foreground">Menu</span>
                </span>
              </button>
              <button 
                onClick={handleQuickExit}
                className="ml-2 p-1.5 rounded-md bg-bush"
                aria-label="Quick exit"
                data-testid="button-quick-exit-app"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && menuPos && (
        <div 
          ref={menuRef} 
          style={{ top: menuPos.top, right: menuPos.right }}
          className="fixed w-[280px] bg-popover dark:bg-popover border border-popover-border dark:border-popover-border rounded-lg shadow-xl p-4 max-h-[75vh] overflow-auto z-[9999]" 
          data-testid="dropdown-menu-app"
        >
          {authData?.user && (
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-bush flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-popover-foreground truncate">{authData.user.email}</p>
              </div>
            </div>
          )}
          <div className="flex flex-col">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 py-2 px-2 -mx-2 rounded-md text-sm text-popover-foreground hover:bg-accent/50 ${
                  location === link.href ? "font-medium bg-accent/30" : ""
                }`}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`menu-link-${link.label.toLowerCase()}`}
              >
                <link.icon className="h-4 w-4 opacity-70" />
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                logoutMutation.mutate();
              }}
              className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-md text-sm text-popover-foreground/70 hover:text-popover-foreground hover:bg-accent/50 w-full"
              data-testid="button-logout-menu"
            >
              <LogOut className="h-4 w-4 opacity-70" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
