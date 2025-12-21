import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, Moon, Sun, LogOut } from "lucide-react";
import Footer from "@/components/Footer";
import logoDark from "@assets/noBgColor_(1)_1766261333621.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/how-civilla-works", label: "How Civilla Works" },
  { href: "/about-civilla", label: "About Civilla" },
  { href: "/plans", label: "Plans" },
  { href: "/legal-compliance", label: "Legal & Compliance" },
  { href: "/privacy-policy", label: "Privacy Policy" },
];

function NavbarCream() {
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
    <nav className="bg-cream w-full" data-testid="navbar-cream">
      <div className="h-9 md:h-9 flex items-center justify-center px-3 md:px-6 py-0">
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
        <div className="absolute top-9 left-0 right-0 bg-cream border-t border-neutral-darkest/10 z-50">
          <div className="flex flex-col p-4 max-w-container mx-auto">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-3 font-sans text-[16px] leading-[1.6] ${
                  location === link.href 
                    ? "text-neutral-darkest font-bold" 
                    : "text-neutral-darkest"
                }`}
                onClick={() => setIsMenuOpen(false)}
                data-testid={`link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-16 py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <span className="font-sans font-bold text-[16px] text-neutral-darkest text-center leading-[1.5]">
              Confidentiality
            </span>
            <div className="flex flex-col gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-[84px] tracking-[0.84px] w-full">
                Your privacy matters
              </h1>
              <p className="cv-p font-sans text-[20px] w-full">
                We protect your information with the same care you deserve in this process.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl button-inset-shadow relative"
              data-testid="button-read"
            >
              Read
            </button>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-xl"
              data-testid="button-contact"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-16 py-28" data-testid="section-content">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 items-start max-w-[768px] w-full">
          <h2 className="cv-h font-heading font-bold text-[60px] tracking-[0.6px] leading-[1.2] text-neutral-darkest w-full" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
            How we handle your data
          </h2>
          
          <div className="flex flex-col gap-4 items-start w-full">
            <div className="font-sans font-normal text-[18px] leading-[1.6] text-neutral-darkest w-full">
              <p className="mb-4">
                Civilla collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.
              </p>
              <p className="mb-4">
                Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.
              </p>
              <p className="mb-4">
                Civilla uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.
              </p>
              <p>
                We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of Civilla after updates means you accept the new terms. If you have questions about how we handle your information, contact us through the support page.
              </p>
            </div>

            <div className="font-sans font-normal text-[18px] leading-[1.6] text-neutral-darkest w-full mt-4">
              <p className="mb-4">
                Civilla collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.
              </p>
              <p className="mb-4">
                Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.
              </p>
              <p className="mb-4">
                Civilla uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.
              </p>
              <p>
                We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of Civilla after updates means you accept the new terms. If you have questions about how we handle your information, contact us through the support page.
              </p>
            </div>

            <div className="font-sans font-normal text-[18px] leading-[1.6] text-neutral-darkest w-full mt-4">
              <p className="mb-4">
                Civilla collects information to help you organize your case and understand family law processes. This includes account details like your email and name, documents you upload, messages you write, and how you use the platform. We also collect technical information such as your IP address and browser type to keep the service running smoothly and secure.
              </p>
              <p className="mb-4">
                Your case materials—documents, timelines, evidence, and notes—belong to you. We store them securely on encrypted servers and never share them with third parties, sell them, or use them for marketing. You can download or delete your information at any time. We keep your data only as long as your account is active, unless legal requirements ask us to retain it longer.
              </p>
              <p className="mb-4">
                Civilla uses industry-standard encryption and security practices to protect your information from unauthorized access. We limit employee access to your data and conduct regular security reviews. However, no system is completely risk-free, and we encourage you to use a strong password and keep your login credentials private.
              </p>
              <p>
                We may update this policy as our service evolves. We will notify you of significant changes by email or through the platform. Your continued use of Civilla after updates means you accept the new terms. If you have questions about how we handle your information, contact us through the support page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <ContentSection />
      </main>
      <Footer />
    </div>
  );
}
