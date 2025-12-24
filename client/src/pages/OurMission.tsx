import { ChevronRight } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Why we exist
              </h1>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Family law is complex. You shouldn't have to face it alone or confused.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
              data-testid="button-learn"
            >
              Learn
            </button>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-[22px] py-2 rounded-md"
              data-testid="button-contact"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function MissionContentSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-mission-content">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <span className="font-sans font-bold text-sm md:text-[16px] text-neutral-darkest text-center leading-[1.5]">
              Our Mission
            </span>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                Making family law accessible
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                We believe every parent deserves to understand what's happening in their case. <span className="italic font-medium">civilla</span> exists to bring clarity, organization, and support to families navigating the legal system.
              </p>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-[22px] py-2 rounded-md"
              data-testid="button-read"
            >
              Read
            </button>
            <button 
              className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6]"
              data-testid="button-more"
            >
              More
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-8 max-w-[768px] w-full">
          <div className="flex flex-col gap-4">
            <h3 className="cv-h font-heading font-bold text-heading-3-mobile md:text-[32px] tracking-[0.32px] text-neutral-darkest">
              Clarity over confusion
            </h3>
            <p className="cv-panel-body font-sans text-sm md:text-[18px] text-neutral-darkest leading-[1.6]">
              Legal documents are overwhelming. Court procedures feel impossible to follow. We break down the complexity so you can focus on what matters: your family.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="cv-h font-heading font-bold text-heading-3-mobile md:text-[32px] tracking-[0.32px] text-neutral-darkest">
              Support without judgment
            </h3>
            <p className="cv-panel-body font-sans text-sm md:text-[18px] text-neutral-darkest leading-[1.6]">
              We don't ask why you're here. We ask how we can help. Every tool and resource is built with respect for your situation and your privacy.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className="cv-h font-heading font-bold text-heading-3-mobile md:text-[32px] tracking-[0.32px] text-neutral-darkest">
              Tools that actually help
            </h3>
            <p className="cv-panel-body font-sans text-sm md:text-[18px] text-neutral-darkest leading-[1.6]">
              From evidence organization to timeline tracking, every feature exists because real parents asked for it. We build what helps, not what looks impressive.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-cta">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl p-6 md:p-16 flex flex-col items-center justify-center w-full">
          <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                Ready to get started?
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Take the first step toward understanding your case better.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <button 
                className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
                data-testid="button-start"
              >
                Start
              </button>
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
                data-testid="button-cta-contact"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function OurMission() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <MissionContentSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
