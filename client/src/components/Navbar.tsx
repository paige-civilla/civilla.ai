import { Menu } from "lucide-react";

const logoUrl = "https://www.figma.com/api/mcp/asset/a24a48c1-9ca1-4e0e-95d3-6685bff3db92";

export default function Navbar() {
  return (
    <nav className="bg-cream w-full" data-testid="navbar">
      <div className="h-[72px] md:h-[72px] flex items-center justify-center px-5 md:px-16 py-0">
        <div className="flex items-center justify-between gap-8 w-full max-w-container">
          <div className="flex items-start flex-1">
            <a href="/" className="relative h-[27px] w-[63px] md:h-[27px] md:w-[63px]" data-testid="link-logo">
              <img 
                src={logoUrl} 
                alt="civilla.ai" 
                className="absolute inset-0 w-full h-full object-contain"
              />
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 md:gap-6">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-5 py-1 md:py-2 rounded-md button-inset-shadow relative"
              data-testid="button-cta-nav"
            >
              Button
            </button>
            <button 
              className="p-3"
              data-testid="button-menu"
            >
              <Menu className="w-6 h-6 text-neutral-darkest" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
