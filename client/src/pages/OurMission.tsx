import { Heart } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

function MissionHeroSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16" data-testid="section-mission-hero">
      <div className="w-full max-w-container">
        <div className="rounded-2xl border border-neutral-darkest/15 bg-[#e7ebea] p-6 md:p-10">
          <div className="grid gap-6 md:grid-cols-2 items-start">
            <div className="min-w-0">
              <h1 className="cv-h font-heading text-heading-1-mobile md:text-[60px] tracking-[0.48px] md:tracking-[0.6px] text-neutral-darkest">
                Our Mission
              </h1>
            </div>

            <div className="min-w-0">
              <p className="cv-p font-sans text-sm md:text-lg leading-relaxed text-neutral-darkest/80">
                This started as a passion project for a single parent, showing up to family court scared, exhausted, confused, and determined to keep going, with no clear place to start or even who to ask. Now it's for everyone in family court who deserves tools that feel clear, calm, and human.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-darkest/15 bg-[#e7ebea] p-6 md:p-10">
          <h2 className="cv-h font-heading text-heading-2-mobile md:text-[32px] tracking-[0.32px] text-neutral-darkest inline-flex items-center gap-2">
            The Heart Of It
            <Heart className="h-5 w-5 opacity-70" aria-hidden="true" />
          </h2>

          <div className="mt-4 space-y-5 font-sans text-sm md:text-lg leading-relaxed text-neutral-darkest/80 max-w-4xl">
            <p>
              At the heart of <span className="italic font-medium">civilla</span> is a simple goal: to make family court easier to understand and easier to move through for people doing it without a lawyer. We believe every parent, survivor, and self-represented person deserves tools that are clear, calm, accurate, and human.
            </p>

            <p>
              Family court wasn't built for people without legal teams, and the process can feel confusing, time-consuming, and isolating. <span className="italic font-medium">civilla</span> exists to bring clarity back to the people who often have the least margin for error.
            </p>

            <p>
              We're here to reduce overwhelm, replace guesswork with plain language, and help you stay organized, one step, one document, one decision at a time. <span className="italic font-medium">civilla</span> wasn't built in a boardroom. It was built with lived experience, and shaped by the people it's meant for.
            </p>

            <p>
              This mission is shared, lived, and built alongside the people who know this system firsthand and who believe we all deserve better.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function OurMission() {
  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream">
      <NavbarCream />
      <main className="flex-1">
        <MissionHeroSection />
      </main>
      <Footer />
    </div>
  );
}
