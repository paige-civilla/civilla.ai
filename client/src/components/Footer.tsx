import { Link } from "wouter";
import { BrandText, Brand } from "./Brand";

const footerLinks = {
  startHere: [
    { label: "Home", href: "/" },
    { label: "Plans & Pricing", href: "/plans" },
    { label: "Login", href: "/login" },
  ],
  aboutCivilla: [
    { label: "How civilla Works", href: "/how-civilla-works" },
    { label: "Our Mission", href: "/our-mission" },
    { label: "Meet The Founders", href: "/meet-the-founders" },
    { label: "Wall Of Wins", href: "/wall-of-wins" },
  ],
  trustSafety: [
    { label: "Safety & Support", href: "/safety-support" },
    { label: "Legal & Compliance", href: "/legal-compliance" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  support: [
    { label: "Contact", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Careers", href: "/careers" },
  ]
};

export default function Footer() {
  return (
    <footer 
      className="bg-cream dark:bg-neutral-darkest w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20"
      data-testid="footer"
    >
      <div className="flex flex-col gap-12 md:gap-16 items-start max-w-container w-full">
        <div className="w-full pt-8 pb-8 border-t-2 border-b-2 border-neutral-darkest dark:border-cream">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-12 max-w-content-large mx-auto">
            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest dark:text-cream leading-[1.6]">
                Start Here
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.startHere.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest dark:text-cream leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <BrandText>{link.label}</BrandText>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest dark:text-cream leading-[1.6]">
                About <span className="italic font-medium">civilla</span>
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.aboutCivilla.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest dark:text-cream leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <BrandText>{link.label}</BrandText>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest dark:text-cream leading-[1.6]">
                Trust & Safety
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.trustSafety.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest dark:text-cream leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest dark:text-cream leading-[1.6]">
                Support
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.support.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest dark:text-cream leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center w-full">
          <p className="font-sans font-normal text-body-small text-neutral-darkest dark:text-cream leading-[1.6]">
            © 2025 <Brand>civilla.ai</Brand>. All rights reserved.
          </p>
        </div>
      </div>
    
        <p style={{ marginTop: 16, fontSize: 12, lineHeight: 1.5, opacity: 0.8 }}>Civilla helps you understand how cases typically move through family court through education, research, and organization—guided by your direction. Civilla doesn't provide legal advice or represent you in court.</p>
</footer>
  );
}
