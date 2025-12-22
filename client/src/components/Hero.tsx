import { ArrowDown } from "lucide-react";

const heroImageUrl = "https://www.figma.com/api/mcp/asset/85ca7531-1d25-422f-a53e-dda981af7a47";

export default function Hero() {
  return (
    <section 
      className="relative w-full h-[812px] md:h-[900px] flex items-start justify-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-hero"
    >
      <img 
        src={heroImageUrl} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      <div className="relative flex flex-col flex-1 h-full items-start max-w-container min-w-0">
        <div className="flex flex-1 items-start w-full min-w-0">
          <div className="flex flex-1 flex-col gap-6 md:gap-8 h-full items-start justify-center min-w-0">
            <h1 className="font-heading font-bold text-white text-heading-1-mobile md:text-heading-1 leading-[1.1] tracking-[0.48px] md:tracking-[0.84px] whitespace-pre-wrap">
              <span className="block">Family Law,</span>
              <span className="block">Translated.</span>
            </h1>
            <p className="mt-3 max-w-md text-base text-white/80 md:text-lg">
              Bring your case into one clear place — so you can understand what you're seeing, stay organized, and prepare with less stress.
            </p>
            <div className="mt-6 flex items-center gap-6">
              <a
                href="/plans"
                className="inline-flex items-center justify-center rounded-full border-2 border-white bg-transparent px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                data-testid="button-sign-up-hero"
              >
                Sign Up
              </a>
              <span 
                className="inline-flex cursor-pointer items-center gap-2 text-sm text-white underline underline-offset-4 opacity-80 hover:opacity-100 whitespace-nowrap"
                onClick={() => {
                  document.getElementById("home-learn-more")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                data-testid="link-scroll-learn-more"
              >
                Scroll To Learn More
                <ArrowDown className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
