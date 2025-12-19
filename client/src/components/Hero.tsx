import { ChevronRight } from "lucide-react";

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
      <div className="relative flex flex-col flex-1 h-full items-start max-w-container">
        <div className="flex flex-1 items-start w-full">
          <div className="flex flex-1 flex-col gap-6 md:gap-8 h-full items-start justify-center">
            <h1 className="font-heading font-bold text-white text-heading-1-mobile md:text-heading-1 leading-[1.1] tracking-[0.48px] md:tracking-[0.84px] whitespace-pre-wrap">
              <span className="block">Family law,</span>
              <span className="block">translated.</span>
            </h1>
            <div className="flex gap-4 items-start">
              <button 
                className="bg-neutral-lightest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
                data-testid="button-hero-learn"
              >
                Learn
              </button>
              <button 
                className="bg-transparent border-2 border-white text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
                data-testid="button-hero-explore"
              >
                Explore
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
