import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BrandText } from "./Brand";

export default function StepsSection() {
  const steps = [
    {
      num: "1",
      label: "Step One",
      text: "Choose your state and case type. Civilla surfaces educational information and typical court steps for that jurisdiction and case category.",
    },
    {
      num: "2",
      label: "Step Two",
      text: "Add your documents, messages, and key events. Civilla organizes what you provide into a clear timeline so you can review everything in context.",
    },
    {
      num: "3",
      label: "Step Three",
      text: "Get plain-language explanations of common stages and what information people typically prepare.",
    },
  ];

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="space-y-10 md:space-y-12">
          {steps.map((s) => (
            <div
              key={s.num}
              className="grid grid-cols-[44px_1fr] items-start gap-4 md:grid-cols-12 md:gap-8"
            >
              {/* Left column */}
              <div className="md:col-span-4">
                {/* Mobile: number to the LEFT of the paragraph */}
                <div className="md:hidden text-left text-4xl font-semibold leading-none pt-1">
                  {s.num}
                </div>

                {/* Desktop: underlined Step One/Two/Three */}
                <div className="hidden md:block">
                  <div className="inline-block border-b border-neutral-darkest/80 dark:border-cream/80 pb-2 text-2xl font-semibold">
                    {s.label}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="md:col-span-8">
                <p className="text-left text-base leading-relaxed text-neutral-darkest/80 dark:text-cream/80 md:text-lg">
                  {s.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center mt-12 md:mt-16">
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
    </section>
  );
}
