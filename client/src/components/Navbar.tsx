import { Menu } from "lucide-react";

const logoLightUrl = "https://www.figma.com/api/mcp/asset/a24a48c1-9ca1-4e0e-95d3-6685bff3db92";

export default function Navbar() {
  return (
    <nav className="bg-bush w-full" data-testid="navbar">
      <div className="h-9 md:h-9 flex items-center justify-center px-5 md:px-16 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <a href="/" className="relative h-5 w-[47px]" data-testid="link-logo">
              <img 
                src={logoLightUrl} 
                alt="civilla.ai" 
                className="absolute inset-0 w-full h-full object-contain brightness-0 invert"
              />
            </a>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button 
              className="hidden md:block bg-transparent border border-white text-white font-bold text-xs leading-[1.6] px-3 py-0.5 rounded"
              data-testid="button-login"
            >
              Log in
            </button>
            <button 
              className="bg-transparent border border-white text-white font-bold text-xs leading-[1.6] px-3 py-0.5 rounded"
              data-testid="button-signup"
            >
              Sign up
            </button>
            <button 
              className="p-1"
              data-testid="button-menu"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
