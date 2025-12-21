const logoUrl = "https://www.figma.com/api/mcp/asset/a24a48c1-9ca1-4e0e-95d3-6685bff3db92";

const footerLinks = {
  product: [
    { label: "How it works", href: "/how-civilla-works" },
    { label: "About us", href: "/about-civilla" },
    { label: "Plans", href: "/plans" },
    { label: "Support", href: "#" },
    { label: "Resources", href: "#" }
  ],
  learn: [
    { label: "Legal", href: "/legal-compliance" },
    { label: "Safety", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Accessibility", href: "#" }
  ],
  help: [
    { label: "Privacy", href: "/privacy-policy" },
    { label: "Terms", href: "#" },
    { label: "Legal & Compliance", href: "/legal-compliance" },
    { label: "Status", href: "#" },
    { label: "Updates", href: "#" }
  ]
};

export default function Footer() {
  return (
    <footer 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-20"
      data-testid="footer"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-10 md:gap-32 items-start w-full">
          <div className="flex flex-1 flex-wrap gap-10 items-start">
            <div className="flex flex-col items-start min-w-[80px]">
              <a href="/" className="relative h-11 w-[84px]" data-testid="link-footer-logo">
                <img 
                  src={logoUrl} 
                  alt="civilla.ai" 
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </a>
            </div>
            
            <div className="flex flex-1 flex-col gap-4 items-start min-w-[120px]">
              <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                Product
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.product.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="py-2 font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 items-start min-w-[120px]">
              <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                Learn
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.learn.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="py-2 font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-4 items-start min-w-[120px]">
              <span className="font-sans font-bold text-body-regular text-neutral-darkest leading-[1.6]">
                Help
              </span>
              <div className="flex flex-col items-start w-full">
                {footerLinks.help.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    className="py-2 font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] w-full"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-0 items-center md:justify-between w-full pt-8 border-t-2 border-neutral-darkest">
          <p className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6]">
            2025 civilla.ai. All rights reserved.
          </p>
          <div className="flex gap-6 items-center">
            <a href="/privacy-policy" className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] underline" data-testid="link-privacy">
              Privacy Policy
            </a>
            <a href="#" className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] underline" data-testid="link-terms">
              Terms of Service
            </a>
            <a href="#" className="font-sans font-normal text-body-small text-neutral-darkest leading-[1.6] underline" data-testid="link-cookies">
              Cookies Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
