import { Menu } from "lucide-react";
import logoWhite from "@assets/noBgWhite-2_1766258904832.png";

export default function Navbar() {
  return (
    <nav className="bg-bush w-full" data-testid="navbar">
      <div className="h-9 md:h-9 flex items-center justify-center px-3 md:px-6 py-0">
        <div className="flex items-center justify-between gap-4 w-full max-w-container">
          <div className="flex items-center">
            <a href="/" className="relative h-[30px] w-auto" data-testid="link-logo">
              <img 
                src={logoWhite} 
                alt="civilla.ai" 
                className="h-full w-auto object-contain"
              />
            </a>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button 
              className="hidden md:block bg-transparent border border-white text-white font-bold text-xs leading-[1.6] px-3 py-0.5 rounded"
              data-testid="button-login"
            >
              Login
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
