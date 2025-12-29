import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import { ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { FAQ_SECTIONS, type FaqItem } from "@/content/faqs";

function StyledCivilla({ text }: { text: string }) {
  const parts = text.split(/(civilla(?:'s)?)/gi);
  return (
    <>
      {parts.map((part, i) => 
        /^civilla('s)?$/i.test(part) ? (
          <span key={i} className="italic font-medium">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function FAQAccordion({ sections }: { sections: { title: string; items: FaqItem[] }[] }) {
  return (
    <div className="space-y-10">
      {sections.map(({ title, items }) => (
        <div key={title} className="space-y-3">
          <h2 className="font-figtree text-xl sm:text-2xl font-bold tracking-tight text-neutral-darkest">
            {title}
          </h2>

          <div className="divide-y divide-neutral-darkest/10 rounded-2xl border border-neutral-darkest/15 bg-white/40">
            {items.map((item) => (
              <details key={item.id} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="font-arimo text-base sm:text-lg font-semibold text-neutral-darkest">
                    <StyledCivilla text={item.q} />
                  </span>
                  <ChevronDown className="h-5 w-5 opacity-70 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-3 font-arimo text-sm sm:text-base leading-relaxed text-neutral-darkest/80">
                  <StyledCivilla text={item.a} />
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream" data-testid="page-faq">
      <NavbarCream />

      <main className="flex-1 bg-cream dark:bg-neutral-darkest">
        <section className="bg-[#e7ebea] dark:bg-neutral-darkest/80 w-full px-5 md:px-16 py-16 md:py-28" data-testid="section-hero">
          <div className="mx-auto max-w-container">
            <div className="flex flex-col gap-6 items-center text-center max-w-[768px] mx-auto">
              <h1 className="font-figtree font-bold text-[clamp(48px,6vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                Frequently Asked Questions
              </h1>
              <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                Clear answers about what <span className="italic font-medium">civilla</span> does, what it cannot do, and how we protect you.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 md:px-8 py-16 md:py-20" data-testid="section-faq-content">
          <FAQAccordion sections={FAQ_SECTIONS} />
          
          <div className="mt-12 pt-8 border-t border-neutral-darkest/10 text-center">
            <p className="font-arimo text-base md:text-lg text-neutral-darkest">
              Still have a question?{" "}
              <Link 
                href="/contact" 
                className="font-semibold underline underline-offset-4 decoration-neutral-darkest/40 hover:decoration-neutral-darkest transition-colors"
                data-testid="link-contact"
              >
                Contact Us
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
