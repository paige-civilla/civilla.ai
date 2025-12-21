import { Link } from "wouter";

const footerLinks = {
  product: [
    { label: "How it works", href: "/how-civilla-works" },
    { label: "About us", href: "/about-civilla" },
    { label: "Plans", href: "/plans" },
  ],
  learn: [
    { label: "Legal", href: "/legal-compliance" },
    { label: "Safety", href: "/safety-support" },
    { label: "Contact", href: "/contact" },
    { label: "Accessibility", href: "/accessibility" }
  ],
  help: [
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Terms", href: "/terms" },
    { label: "Legal & Compliance", href: "/legal-compliance" },
  ]
};

export default function Footer() {
  return (
    <footer 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20"
      data-testid="footer"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-10 md:gap-32 items-center justify-center w-full pt-8 pb-8 border-t-2 border-b-2 border-neutral-darkest">
          <div className="flex flex-wrap gap-10 md:gap-32 items-start justify-center">
            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Product
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.product.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Learn
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.learn.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 items-start min-w-[120px]">
              <span className="font-sans font-bold text-xs text-neutral-darkest leading-[1.6]">
                Help
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.help.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="py-1.5 font-sans font-normal text-xs text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-0 items-center md:justify-between w-full">
          <p className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6]">
            2025 civilla.ai. All rights reserved.
          </p>
          <div className="flex gap-6 items-center flex-wrap">
            <Link href="/privacy-policy" className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] underline" data-testid="link-privacy">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] underline" data-testid="link-terms">
              Terms of Service
            </Link>
            <Link href="/legal-compliance" className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] underline" data-testid="link-legal">
              Legal & Compliance
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
