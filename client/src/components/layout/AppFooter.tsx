import { Link } from "wouter";

export default function AppFooter() {
  return (
    <footer className="bg-[#314143] border-t border-[#1E2020] py-4" data-testid="footer-app">
      <div className="px-5 md:px-16 flex flex-col md:flex-row items-center justify-between gap-3 max-w-container mx-auto">
        <p className="font-sans text-xs text-[#F2F2F2]/70">
          © {new Date().getFullYear()} <span className="italic">civilla</span>.ai — All rights reserved
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="font-sans text-xs text-[#F2F2F2]/70 hover:text-[#F2F2F2] transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="font-sans text-xs text-[#F2F2F2]/70 hover:text-[#F2F2F2] transition-colors">
            Privacy
          </Link>
          <a href="mailto:Admin@civilla.ai" className="font-sans text-xs text-[#F2F2F2]/70 hover:text-[#F2F2F2] transition-colors">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
