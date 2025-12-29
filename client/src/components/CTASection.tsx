import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BrandText } from "./Brand";

export default function CTASection() {
  return (
    <section
      className="bg-neutral-lightest dark:bg-neutral-darkest/60 w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-cta"
    >
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-8 items-center max-w-content-large w-full">
          <div className="flex flex-col gap-5 md:gap-6 items-center text-center w-full">
            <h2 className="font-heading font-bold text-heading-1-mobile md:text-heading-1 leading-[1.1] tracking-[0.5px] md:tracking-[0.84px] text-neutral-darkest dark:text-cream">
              Clarity Starts Here
            </h2>
            <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] text-neutral-darkest dark:text-cream">
              Education, research, and organization tools built around your inputs.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Link href="/plans">
              <Button
                className="bg-bush text-white rounded-xl px-6 py-2.5 font-sans font-bold text-sm md:text-body-regular button-inset-shadow"
                data-testid="button-cta-start"
              >
                Plans & Pricing
              </Button>
            </Link>
            <Link href="/how-civilla-works">
              <Button
                variant="outline"
                className="border-2 border-neutral-darkest dark:border-cream text-neutral-darkest dark:text-cream rounded-xl px-6 py-2.5 font-sans font-bold text-sm md:text-body-regular bg-transparent"
                data-testid="button-cta-learn"
              >
                <BrandText>How civilla Works</BrandText>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
