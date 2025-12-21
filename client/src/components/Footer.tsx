import { Link } from "wouter";

const footerLinks = {
  explore: [
    { label: "Home", href: "/" },
    { label: "Plans & Pricing", href: "/plans" },
    { label: "How Civilla Works", href: "/how-civilla-works" },
    { label: "About Us", href: "/about" },
  ],
  trustSafety: [
    { label: "Safety & Support", href: "/safety-support" },
    { label: "Legal & Compliance", href: "/legal-compliance" },
    { label: "Accessibility", href: "/accessibility" }
  ],
  help: [
    { label: "Contact", href: "/contact" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Login", href: "/login" }
  ]
};

export default function Footer() {
  return (
    <footer 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20"
      data-testid="footer"
    >
      <div className="flex flex-col gap-12 md:gap-16 items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-10 md:gap-32 items-center justify-center w-full pt-8 pb-8 border-t-2 border-b-2 border-neutral-darkest">
          <div className="flex flex-wrap gap-10 md:gap-32 items-start justify-center">
            <div className="flex flex-1 flex-col gap-3 items-start min-w-[140px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Explore
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.explore.map((link) => (
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

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[140px]">
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

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[140px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Help
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.help.map((link) => (
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
            © 2025 civilla.ai. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
