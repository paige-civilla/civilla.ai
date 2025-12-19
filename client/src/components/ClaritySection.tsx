import { ChevronRight } from "lucide-react";

export default function ClaritySection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-clarity"
    >
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-content-large w-full">
          <div className="flex flex-col gap-3 md:gap-4 items-center w-full">
            <span className="font-sans font-bold text-tagline text-neutral-darkest text-center">
              Clarity
            </span>
            <div className="flex flex-col gap-5 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
                civilla.ai is not a law firm
              </h2>
              <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
                civilla.ai does not provide legal advice, represent you in court, or replace an attorney. We are an educational platform designed to help you understand family law and organize your case.
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <button 
              className="flex gap-2 items-center justify-center rounded-md"
              data-testid="button-read-details"
            >
              <span className="font-sans font-bold text-sm md:text-body-regular text-neutral-darkest leading-[1.6]">
                Read details
              </span>
              <ChevronRight className="w-6 h-6 text-neutral-darkest" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
