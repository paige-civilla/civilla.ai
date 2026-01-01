import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, Briefcase, LayoutDashboard, Settings, User, FileText, Calendar, FolderOpen, Image, CheckSquare, Clock, TrendingUp, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoColor from "@assets/noBgColor-2_1766294100143.png";

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

  const { data: casesData } = useQuery<{ cases: { id: string; title: string }[] }>({
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
        { label: "Case To-Do", href: `/app/tasks/${caseId}`, icon: CheckSquare },
        { label: "Deadlines", href: `/app/deadlines/${caseId}`, icon: Clock },
        { label: "Pattern Analysis", href: `/app/patterns/${caseId}`, icon: TrendingUp },
        { label: "Communications", href: `/app/communications/${caseId}`, icon: MessageSquare },
        { label: "Case Settings", href: `/app/case-settings/${caseId}`, icon: Settings },
      );
    }
    return links;
  })();

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
      <nav className="bg-[hsl(var(--app-surface))] border-b border-[hsl(var(--app-panel-border))] w-full relative" data-testid="navbar-app">
        <div className="h-9 flex items-center justify-center px-5 md:px-16 py-0">
          <div className="flex items-center justify-between gap-4 w-full max-w-container">
            <div className="flex items-center">
              <Link href="/app" className="relative h-7 w-auto" data-testid="link-logo-app">
                <img 
                  src={logoColor} 
                  alt="civilla.ai" 
                  className="h-full w-auto object-contain"
                />
              </Link>
            </div>
            <div 
              className="flex items-center justify-center gap-2 relative"
              onMouseEnter={scheduleOpen}
              onMouseLeave={scheduleClose}
            >
              <button 
                ref={menuButtonRef}
                className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 hover:border-neutral-darkest/35 hover:bg-neutral-darkest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40"
                onClick={() => { clearTimers(); setIsMenuOpen((v) => !v); }}
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
                className="ml-2 p-1.5 rounded-md bg-primary"
                aria-label="Quick exit"
                data-testid="button-quick-exit-app"
              >
                <LogOut className="w-4 h-4 text-white" />
              </button>
              
              {/* Grace area bridge between trigger and menu */}
              {isMenuOpen && (
                <div className="absolute left-0 right-0 top-full h-3" />
              )}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div 
            ref={menuRef}
            className="absolute left-0 right-0 top-full mt-2 z-[9999]"
            data-testid="dropdown-menu-app"
            onMouseEnter={scheduleOpen}
            onMouseLeave={scheduleClose}
          >
            <div className="mx-auto max-w-6xl px-3">
              <div
                className="bg-[hsl(var(--app-panel))] border border-[hsl(var(--app-panel-border))] rounded-xl shadow-xl p-4"
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

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {menuLinks.map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setLocation(item.href);
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left font-sans text-sm text-neutral-darkest hover:bg-[hsl(var(--app-surface-2))] border border-transparent hover:border-[hsl(var(--app-panel-border))]"
                      role="menuitem"
                      data-testid={`menu-link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-[hsl(var(--app-panel-border))] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setLocation("/app/account");
                      }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-neutral-darkest hover:bg-[hsl(var(--app-surface-2))] border border-transparent hover:border-[hsl(var(--app-panel-border))]"
                      data-testid="menu-link-account-settings"
                    >
                      <Settings className="h-5 w-5" />
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
                      className="flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-neutral-darkest hover:bg-[hsl(var(--app-surface-2))] border border-transparent hover:border-[hsl(var(--app-panel-border))]"
                      data-testid="button-logout-menu"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Log out</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="rounded-lg px-3 py-2 font-sans text-sm text-neutral-darkest/70 hover:bg-[hsl(var(--app-surface-2))]"
                    data-testid="button-close-menu"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
