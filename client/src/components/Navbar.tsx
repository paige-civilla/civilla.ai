import { Menu } from "lucide-react";

const logoLightUrl = "https://www.figma.com/api/mcp/asset/a24a48c1-9ca1-4e0e-95d3-6685bff3db92";

export default function Navbar() {
  return (
    <nav className="bg-bush w-full" data-testid="navbar">
      <div className="h-[72px] md:h-[72px] flex items-center justify-center px-5 md:px-16 py-0">
        <div className="flex items-center justify-between gap-8 w-full max-w-container">
          <div className="flex items-start flex-1">
            <a href="/" className="relative h-[27px] w-[63px] md:h-[27px] md:w-[63px]" data-testid="link-logo">
              <img 
                src={logoLightUrl} 
                alt="civilla.ai" 
                className="absolute inset-0 w-full h-full object-contain brightness-0 invert"
              />
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 md:gap-4">
            <button 
              className="hidden md:block bg-transparent border-2 border-white text-white font-bold text-body-regular leading-[1.6] px-5 py-2 rounded-md"
              data-testid="button-login"
            >
              Log in
            </button>
            <button 
              className="bg-transparent border-2 border-white text-white font-bold text-sm md:text-body-regular leading-[1.6] px-5 py-1 md:py-2 rounded-md"
              data-testid="button-signup"
            >
              Sign up
            </button>
            <button 
              className="p-3"
              data-testid="button-menu"
            >
              <Menu className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
