import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import { useMemo } from "react";
import { ChevronDown } from "lucide-react";

type FAQItem = { q: string; a: string; section: string };

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const sections = useMemo(() => {
    const map = new Map<string, FAQItem[]>();
    for (const item of items) {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="space-y-10">
      {sections.map(([sectionTitle, sectionItems]) => (
        <div key={sectionTitle} className="space-y-3">
          <h2 className="font-figtree text-xl sm:text-2xl font-bold tracking-tight text-neutral-darkest">
            {sectionTitle}
          </h2>

          <div className="divide-y divide-neutral-darkest/10 rounded-2xl border border-neutral-darkest/15 bg-white/40">
            {sectionItems.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="font-arimo text-base sm:text-lg font-semibold text-neutral-darkest">
                    {item.q}
                  </span>
                  <ChevronDown className="h-5 w-5 opacity-70 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-3 font-arimo text-sm sm:text-base leading-relaxed text-neutral-darkest/80">
                  {item.a}
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
  const items: FAQItem[] = [
    { section: "General", q: "Is civilla a law firm?", a: "No. civilla is an educational, research, and organizational platform. We don't provide legal advice, represent you in court, or replace an attorney." },
    { section: "General", q: "Can I use civilla with an attorney?", a: "Yes. Many people use civilla to stay organized and share timelines, notes, and documents with their attorney. civilla supports your preparation — your attorney remains your legal advisor." },
    { section: "General", q: "What states does civilla cover?", a: "civilla is built for U.S. family law. You can choose your state to view educational information and typical court processes. Because rules and forms can vary by county, always confirm details with official court sources or an attorney." },
    { section: "General", q: "Will civilla tell me what to file?", a: "No. civilla can explain what documents exist and how they're typically used, but it doesn't tell you what to file or when. Those decisions are yours — ideally with an attorney's guidance." },
    { section: "Privacy & Safety", q: "How is my information kept safe?", a: "Your privacy matters to us. We explain how we handle data in our Privacy Policy. If you ever need to leave quickly, use Quick Exit in the top-right corner." },
    { section: "Plans & Billing", q: "Can I cancel anytime?", a: "Yes. You can cancel in your account settings at any time. Your access stays active until the end of your current billing period." },
    { section: "Plans & Billing", q: "What payment methods do you accept?", a: "We accept major credit and debit cards. Payments are processed securely through Stripe." },
    { section: "Plans & Billing", q: "Is there a free trial?", a: "Yes — we offer a 3-day trial so you can explore civilla before committing. Your trial ends automatically after 3 days with no auto-billing. You'll have the option to upgrade at any time." },
    { section: "Plans & Billing", q: "What happens when I upgrade?", a: "Upgrades start immediately. If you're upgrading mid-cycle, you're charged a prorated difference today and your new billing date becomes your upgrade date." },
    { section: "Plans & Billing", q: "Do you offer refunds?", a: "Subscriptions are non-refundable. Limited exceptions may be considered for duplicate charges, billing errors, or extended technical failures that prevent access. All exceptions require review." },
    { section: "Legal & Compliance", q: "Can civilla give me legal advice?", a: "No. civilla is for education and organization. We do not provide legal advice or representation, and we do not tell you what decisions to make in your case." },
    { section: "Legal & Compliance", q: "Is my information private?", a: "We limit access to your information to operate civilla. We do not sell your personal information. See our Privacy Policy for details." },
    { section: "Legal & Compliance", q: "What if I need a real lawyer?", a: "civilla does not replace a lawyer. If you need legal advice or representation, consult a licensed attorney in your jurisdiction. civilla can help you organize materials you may share with a lawyer." },
    { section: "Legal & Compliance", q: "Can I use civilla's documents in court?", a: "civilla's documents are educational drafts. You are responsible for ensuring anything you file meets your court's rules and requirements." },
    { section: "Legal & Compliance", q: "Who decides what I do with my case?", a: "You do. civilla provides information and organization tools; you remain in control of your decisions." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />

      <main className="flex-1 bg-cream">
        <section className="bg-[#e7ebea] w-full px-5 md:px-16 py-16 md:py-28">
          <div className="mx-auto max-w-container">
            <div className="flex flex-col gap-6 items-center text-center max-w-[768px] mx-auto">
              <h1 className="font-figtree font-bold text-[clamp(48px,6vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                FAQs
              </h1>
              <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                Quick answers about what <span className="italic font-medium">civilla</span> does—and what it doesn't.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 md:px-8 py-16 md:py-20">
          <FAQAccordion items={items} />
        </section>
      </main>

      <Footer />
    </div>
  );
}
