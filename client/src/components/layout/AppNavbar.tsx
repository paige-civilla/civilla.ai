import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, Briefcase, LayoutDashboard, Settings, User, BookOpen, FolderOpen, History, MessageSquare, BarChart3, FileSearch, FileEdit, FileStack, Calendar, CheckSquare, Contact, Users, Calculator, Scale } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoSymbol from "@assets/symbol_1767301386741.png";
import { getVisibleModules, modulePath, moduleLabel, type ModuleKey } from "@/lib/caseFlow";

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

const OPEN_DELAY = 80;   // small "hover intent" delay
const CLOSE_DELAY = 350; // grace period before closing

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useFixedNavShell(shellRef);

  const clearTimers = () => {
    if (openTimerRef.current) window.clearTimeout(openTimerRef.current);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    openTimerRef.current = null;
    closeTimerRef.current = null;
  };

  const scheduleOpen = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (isMenuOpen) return;
    if (openTimerRef.current) return;
    openTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(true);
      openTimerRef.current = null;
    }, OPEN_DELAY);
  };

  const scheduleClose = () => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (!isMenuOpen) return;
    if (closeTimerRef.current) return;
    closeTimerRef.current = window.setTimeout(() => {
      setIsMenuOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY);
  };

  // Cleanup timers on unmount
  useEffect(() => () => clearTimers(), []);

  const { data: authData } = useQuery<{ user: { id: string; email: string; casesAllowed: number } }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: profileData } = useQuery<{ profile: { fullName: string | null; email: string | null } }>({
    queryKey: ["/api/profile"],
    enabled: !!authData?.user,
  });

  const { data: casesData } = useQuery<{ cases: { id: string; title: string; hasChildren?: boolean; startingPoint?: string }[] }>({
    queryKey: ["/api/cases"],
    enabled: !!authData?.user,
  });

  const displayName = profileData?.profile?.fullName?.trim() || authData?.user?.email || "Account";

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

  const selectedCaseId = getSelectedCaseId();
  const selectedCase = casesData?.cases?.find(c => c.id === selectedCaseId);

  const menuLinks = (() => {
    const caseId = selectedCaseId;
    const MODULE_ICONS: Record<ModuleKey, typeof BookOpen> = {
      "document-library": BookOpen,
      "evidence": FolderOpen,
      "timeline": History,
      "communications": MessageSquare,
      "pattern-analysis": BarChart3,
      "disclosures": FileSearch,
      "documents": FileEdit,
      "exhibits": FileStack,
      "deadlines": Calendar,
      "case-to-do": CheckSquare,
      "contacts": Contact,
      "children": Users,
      "child-support": Calculator,
      "trial-prep": Scale,
    };

    const links: { label: string; href: string; icon: any }[] = [
      { label: "Dashboard", href: caseId ? `/app/dashboard/${caseId}` : "/app", icon: LayoutDashboard },
      ...getStaticMenuLinks(),
    ];

    if (caseId && selectedCase) {
      const visibleModules = getVisibleModules({
        hasChildren: selectedCase.hasChildren || false,
      });
      visibleModules.forEach((moduleKey) => {
        links.push({
          label: moduleLabel(moduleKey),
          href: modulePath(moduleKey, caseId),
          icon: MODULE_ICONS[moduleKey],
        });
      });
      links.push({ label: "Case Settings", href: `/app/case-settings/${caseId}`, icon: Settings });
    }
    return links;
  })();

  const [location] = useLocation();
  
  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
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
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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
      <nav className="bg-[#314143] border-b border-[#1E2020] w-full relative" data-testid="navbar-app">
        <div className="h-9 flex items-center justify-center px-3 sm:px-5 md:px-16 py-0">
          <div className="flex items-center justify-between gap-2 sm:gap-4 w-full max-w-container">
            <div className="flex items-center flex-shrink-0">
              <Link href="/app" className="relative h-6 w-6 sm:h-7 sm:w-7" aria-label="Civilla" data-testid="link-logo-app">
                <img 
                  src={logoSymbol} 
                  alt="Civilla" 
                  className="h-full w-full object-contain"
                />
              </Link>
            </div>
            <div 
              className="flex items-center justify-center gap-1 sm:gap-2 relative flex-shrink-0"
              onMouseEnter={scheduleOpen}
              onMouseLeave={scheduleClose}
            >
              <button 
                ref={menuButtonRef}
                className="inline-flex items-center justify-center rounded-md p-1 sm:p-1.5 border border-[#F2F2F2]/30 hover:border-[#F2F2F2]/50 hover:bg-[#F2F2F2]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2F2F2]/40"
                onClick={() => { clearTimers(); setIsMenuOpen((v) => !v); }}
                aria-label="Open menu"
                aria-expanded={isMenuOpen}
                data-testid="button-menu-app"
              >
                <span className="flex items-center gap-1 sm:gap-1.5">
                  {isMenuOpen ? (
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F2F2F2]" aria-hidden="true" />
                  ) : (
                    <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#F2F2F2]" aria-hidden="true" />
                  )}
                  <span className="text-xs font-medium text-[#F2F2F2] hidden sm:inline">Menu</span>
                </span>
              </button>
              <button 
                onClick={handleQuickExit}
                className="ml-1 sm:ml-2 p-1 sm:p-1.5 rounded-md bg-gradient-to-b from-bush to-bush-dark hover:from-bush-dark hover:to-bush text-cream transition-colors"
                aria-label="Quick exit"
                data-testid="button-quick-exit-app"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              
              {/* Grace area bridge between trigger and menu */}
              {isMenuOpen && (
                <div className="absolute left-0 right-0 top-full h-3" />
              )}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <>
            {/* Mobile overlay backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 z-[9998] md:hidden"
              onClick={() => setIsMenuOpen(false)}
              aria-hidden="true"
            />
            <div 
              ref={menuRef}
              className="fixed md:absolute left-0 right-0 top-[var(--civilla-nav-h,36px)] md:top-full md:mt-2 z-[9999] max-h-[calc(100vh-var(--civilla-nav-h,36px))] overflow-y-auto"
              data-testid="dropdown-menu-app"
              onMouseEnter={scheduleOpen}
              onMouseLeave={scheduleClose}
            >
              <div className="mx-auto max-w-6xl px-3 py-2 md:py-0">
                <div
                  className="bg-[#E4ECED] opacity-100 z-[60] border border-[#628286] rounded-xl shadow-lg p-4"
                  role="menu"
                  aria-label="App menu"
                >
                {authData?.user && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="font-sans text-sm text-neutral-darkest/70">
                      {displayName}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {menuLinks.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setLocation(item.href);
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 min-h-[44px] text-left font-sans text-sm text-[#243032] hover:bg-[#A2BEC2] hover:text-white focus:bg-[#A2BEC2] focus:text-white active:bg-[#A2BEC2] active:text-white transition-colors border border-transparent"
                      role="menuitem"
                      data-testid={`menu-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[hsl(var(--app-panel-border))] flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setLocation("/app/account");
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 min-h-[44px] font-sans text-sm text-[#243032] hover:bg-[#A2BEC2] hover:text-white focus:bg-[#A2BEC2] focus:text-white active:bg-[#A2BEC2] active:text-white transition-colors border border-transparent"
                      data-testid="menu-link-account-settings"
                    >
                      <Settings className="h-5 w-5 flex-shrink-0" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsMenuOpen(false);
                        await apiRequest("POST", "/api/auth/logout", {});
                        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                        setLocation("/");
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-3 min-h-[44px] font-sans text-sm text-[#243032] hover:bg-[#A2BEC2] hover:text-white focus:bg-[#A2BEC2] focus:text-white active:bg-[#A2BEC2] active:text-white transition-colors border border-transparent"
                      data-testid="button-logout-menu"
                    >
                      <LogOut className="h-5 w-5 flex-shrink-0" />
                      <span>Log out</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-3 py-3 min-h-[44px] font-sans text-sm text-[#243032]/70 hover:bg-[#A2BEC2] hover:text-white focus:bg-[#A2BEC2] focus:text-white active:bg-[#A2BEC2] active:text-white transition-colors"
                    data-testid="button-close-menu"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          </>
        )}
      </nav>
    </div>
  );
}
