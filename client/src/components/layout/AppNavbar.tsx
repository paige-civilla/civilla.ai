import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LogOut, Briefcase, LayoutDashboard, Settings, User, FileText, Calendar, FolderOpen, Image, CheckSquare, Clock, MessageSquare } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
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

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
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
      <nav className="bg-cream w-full relative" data-testid="navbar-app">
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
            <div className="flex items-center justify-center gap-2">
              <button 
                ref={menuButtonRef}
                className="inline-flex items-center justify-center rounded-md p-1.5 border border-neutral-darkest/20 hover:border-neutral-darkest/35 hover:bg-neutral-darkest/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-darkest/40"
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
          className="absolute right-0 mt-2 w-[280px] bg-popover border border-popover-border rounded-lg shadow-xl z-[9999] max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain" 
          data-testid="dropdown-menu-app"
        >
          <div className="p-4 flex flex-col">
            {authData?.user && (
              <div className="flex items-center gap-3 pb-3 mb-3 border-b border-neutral-darkest/10">
                <div className="w-8 h-8 rounded-full bg-bush flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-popover-foreground truncate">{authData.user.email}</p>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {menuLinks.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setLocation(link.href);
                  }}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left font-sans text-neutral-darkest hover:bg-neutral-100 ${
                    location === link.href ? "font-medium bg-accent/30" : ""
                  }`}
                  data-testid={`menu-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <link.icon className="h-5 w-5" />
                  <span>{link.label}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-popover-border my-3" />
            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false);
                await apiRequest("POST", "/api/auth/logout", {});
                queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
                setLocation("/");
              }}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2 text-left font-sans text-neutral-darkest hover:bg-neutral-100"
              data-testid="button-logout-menu"
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
