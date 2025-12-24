import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import BrandMark from "@/components/BrandMark";
import { Heart } from "lucide-react";
import { Link } from "wouter";

export default function WallOfWins() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="rounded-[28px] border border-neutral-900/15 bg-white/40 p-6 sm:p-10">
            <div className="flex items-center gap-2">
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900">
                Wall Of Wins
              </h1>
              <Heart className="h-5 w-5 opacity-70" aria-hidden="true" />
            </div>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-900/80 max-w-3xl">
              Coming soon. This page will be a community space where we share wins, lessons, and
              moments of progress from people navigating family court.
            </p>

            <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-900/80 max-w-3xl">
              For privacy and safety, we'll only post stories with clear permission, and we'll keep
              details general. You'll be able to email a win, and (later) submit one directly inside{" "}
              <BrandMark />.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="mailto:support@civilla.ai?subject=My%20Win%20for%20the%20Wall%20of%20Wins"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-neutral-900/20 bg-neutral-900 text-white hover:bg-neutral-900/90 transition-colors"
              >
                Email Us A Win
              </a>

              <Link
                href="/our-mission"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold border border-neutral-900/20 bg-white/60 hover:bg-white/80 transition-colors"
              >
                Back To Our Mission
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
