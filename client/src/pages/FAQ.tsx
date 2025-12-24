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
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-900">
            {sectionTitle}
          </h2>

          <div className="divide-y divide-neutral-900/10 rounded-2xl border border-neutral-900/15 bg-white/40">
            {sectionItems.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <span className="text-base sm:text-lg font-semibold text-neutral-900">
                    {item.q}
                  </span>
                  <ChevronDown className="h-5 w-5 opacity-70 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="mt-3 text-sm sm:text-base leading-relaxed text-neutral-900/80">
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
    { section: "General", q: "Is civilla.ai a law firm?", a: "No. civilla is an educational, research, and organizational platform. We don't provide legal advice, represent you in court, or replace an attorney." },
    { section: "General", q: "Can I use civilla.ai with an attorney?", a: "Yes. Many people use civilla to stay organized and share timelines, notes, and documents with their attorney. civilla supports your preparation — your attorney remains your legal advisor." },
    { section: "General", q: "What states does civilla.ai cover?", a: "civilla is built for U.S. family law. You can choose your state to view educational information and typical court processes. Because rules and forms can vary by county, always confirm details with official court sources or an attorney." },
    { section: "General", q: "Will civilla.ai tell me what to file?", a: "No. civilla can explain what documents exist and how they're typically used, but it doesn't tell you what to file or when. Those decisions are yours — ideally with an attorney's guidance." },
    { section: "Privacy & Safety", q: "How is my information kept safe?", a: "Your privacy matters to us. We explain how we handle data in our Privacy Policy. If you ever need to leave quickly, use Quick Exit in the top-right corner." },
    { section: "Plans & Billing", q: "Can I cancel anytime?", a: "Yes. You can cancel in your account settings at any time. Your access stays active until the end of your current billing period." },
    { section: "Plans & Billing", q: "What payment methods do you accept?", a: "We accept major credit and debit cards. Payments are processed securely through Stripe." },
    { section: "Plans & Billing", q: "Is there a free trial?", a: "Yes — we offer a 3-day trial so you can explore Civilla before committing. Your trial ends automatically after 3 days with no auto-billing. You'll have the option to upgrade at any time." },
    { section: "Plans & Billing", q: "What happens when I upgrade?", a: "Upgrades start immediately. If you're upgrading mid-cycle, you're charged a prorated difference today and your new billing date becomes your upgrade date." },
    { section: "Plans & Billing", q: "Do you offer refunds?", a: "Subscriptions are non-refundable. Limited exceptions may be considered for duplicate charges, billing errors, or extended technical failures that prevent access. All exceptions require review." },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />

      <main className="flex-1 bg-cream">
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-12 pb-16">
          <div className="rounded-[28px] border border-neutral-900/15 bg-white/40 p-6 sm:p-10">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-neutral-900">
              FAQs
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-neutral-900/80 max-w-3xl">
              Quick answers about what <span className="italic font-medium">civilla</span>.ai does, and what it doesn't.
            </p>
          </div>

          <div className="mt-8">
            <FAQAccordion items={items} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
