import { Link } from "wouter";
import { BrandText, Brand } from "./Brand";

const footerLinks = {
  startHere: [
    { label: "Home", href: "/" },
    { label: "How civilla Works", href: "/how-civilla-works" },
    { label: "Plans & Pricing", href: "/plans" },
    { label: "Login", href: "/login" },
  ],
  aboutCivilla: [
    { label: "Our Mission", href: "/our-mission" },
    { label: "Meet The Founders", href: "/meet-the-founders" },
  ],
  trustSafety: [
    { label: "Safety & Support", href: "/safety-support" },
    { label: "Legal & Compliance", href: "/legal-compliance" },
    { label: "Accessibility", href: "/accessibility" },
  ],
  support: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Admin Login", href: "/admin-login" },
    { label: "Careers", href: "/careers" },
  ]
};

export default function Footer() {
  return (
    <footer 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20"
      data-testid="footer"
    >
      <div className="flex flex-col gap-12 md:gap-16 items-start max-w-container w-full">
        <div className="w-full pt-8 pb-8 border-t-2 border-b-2 border-neutral-darkest">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-12 max-w-content-large mx-auto">
            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Start Here
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.startHere.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <BrandText>{link.label}</BrandText>
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                About <span className="italic font-medium">civilla</span>
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.aboutCivilla.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Trust & Safety
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.trustSafety.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 items-start">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Support
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.support.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
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
          <p className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6]">
            © 2025 <Brand>civilla.ai</Brand>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
