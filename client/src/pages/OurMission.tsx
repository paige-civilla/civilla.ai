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
              <div className="cv-p font-sans text-sm md:text-[20px] w-full flex flex-col gap-4 md:gap-5">
                <p>Our mission is to make family court survivable — and easier to follow — for people who are doing it without a lawyer.</p>
                <p>We believe every parent, survivor, and self-represented person deserves tools that are clear, calm, accurate, and human.</p>
                <p>Family court wasn't built for unrepresented people, and it often feels like the rules are written in a language you were never taught.</p>
                <p><span className="italic font-medium">civilla</span> exists to help you regain clarity, organization, and steadier footing when the process feels stacked against you.</p>
                <p>We're here to make the system less overwhelming and less confusing — one person at a time.</p>
                <p>And when I say I built <span className="italic font-medium">civilla</span>, I really mean we did.</p>
                <p>This mission is shared, lived, and built with people who have lived the reality of family court — and decided we all deserve better.</p>
              </div>
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
      </main>
      <Footer />
    </div>
  );
}
