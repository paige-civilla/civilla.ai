import * as React from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type FaqItem = { q: string; a: React.ReactNode };

type FaqSectionProps = {
  title?: string;
  subtitle?: string;
  items?: FaqItem[];
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  id?: string;
};

/**
 * Shared FAQ section (use on Home + Plans).
 * Layout: left header/CTA + right accordion (stacks on mobile).
 */
export function FaqSection({
  id = "faqs",
  title = "Common questions",
  subtitle = "Everything you need to know",
  items,
  ctaTitle = "Still have questions?",
  ctaSubtitle = "Our team is here to help",
  ctaHref = "/contact",
  ctaLabel = "Contact Us",
}: FaqSectionProps) {
  const defaultItems: FaqItem[] = [
    {
      q: "Can I cancel anytime?",
      a: (
        <p>
          Yes. You can cancel your subscription at any time through your account settings. Your access continues
          until the end of your current billing period.
        </p>
      ),
    },
    {
      q: "What payment methods do you accept?",
      a: (
        <p>
          We accept major credit and debit cards. Payments are processed securely through Stripe.
        </p>
      ),
    },
    {
      q: "Is there a free trial?",
      a: (
        <p>
          Yes — we offer a 3-day trial so you can explore Civilla before subscribing. The trial ends automatically
          after 3 days. You'll be prompted to upgrade if you want to keep using paid features.
        </p>
      ),
    },
    {
      q: "What happens when I upgrade?",
      a: (
        <p>
          Upgrades start immediately. You're charged a prorated difference today, and your new billing date becomes the day you upgrade.
        </p>
      ),
    },
    {
      q: "Do you offer refunds?",
      a: (
        <p>
          Subscriptions are non-refundable. Limited exceptions apply for duplicate charges, billing errors, or extended access issues.
        </p>
      ),
    },
  ];

  const faqItems = items?.length ? items : defaultItems;

  return (
    <section id={id} className="w-full">
      <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          {/* Left column: matches the Home FAQ "hero" feel */}
          <div className="space-y-5">
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
              {title}
            </h2>
            <p className="text-base text-neutral-700 md:text-lg">
              {subtitle}
            </p>

            <div className="pt-6">
              <div className="space-y-3">
                <h3 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  {ctaTitle}
                </h3>
                <p className="text-base text-neutral-700 md:text-lg">
                  {ctaSubtitle}
                </p>

                <div className="pt-2">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 rounded-xl border-neutral-900 px-6"
                  >
                    <a href={ctaHref}>
                      {ctaLabel}
                      <span aria-hidden className="ml-2 inline-block">→</span>
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: accordion */}
          <div className="rounded-3xl border border-neutral-300 bg-white/40 p-6 md:p-8">
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((it, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className={idx === 0 ? "border-t border-neutral-300" : "border-t border-neutral-300"}
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold md:text-lg">
                    {it.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 text-sm leading-relaxed text-neutral-700 md:text-base">
                    {it.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
