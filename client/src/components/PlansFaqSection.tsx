import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PlansFaqSection() {
  return (
    <section className="bg-neutral-lightest w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-6xl w-full">
      <div className="text-center">
        <h2 className="text-5xl sm:text-6xl font-semibold tracking-tight">
          FAQs
        </h2>
        <p className="mt-4 text-base sm:text-lg text-neutral-700">
          Quick answers about plans, billing, trials, and upgrades.
        </p>
      </div>

      <div className="mt-10 border-t border-neutral-900/30" />

      <div className="mt-6">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cancel">
            <AccordionTrigger className="text-left text-base sm:text-lg font-medium">
              Can I cancel anytime?
            </AccordionTrigger>
            <AccordionContent className="text-neutral-700 leading-relaxed">
              Yes. You can cancel in your account settings at any time. Your access
              stays active until the end of your current billing period.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="payments">
            <AccordionTrigger className="text-left text-base sm:text-lg font-medium">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent className="text-neutral-700 leading-relaxed">
              We accept major credit and debit cards. Payments are processed securely
              through Stripe.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="trial">
            <AccordionTrigger className="text-left text-base sm:text-lg font-medium">
              Is there a free trial?
            </AccordionTrigger>
            <AccordionContent className="text-neutral-700 leading-relaxed">
              Yes — we offer a 3-day trial so you can explore Civilla before committing.
              Your trial ends automatically after 3 days with no auto-billing. You'll
              have the option to upgrade at any time.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="upgrade">
            <AccordionTrigger className="text-left text-base sm:text-lg font-medium">
              What happens when I upgrade?
            </AccordionTrigger>
            <AccordionContent className="text-neutral-700 leading-relaxed">
              Upgrades start immediately. If you're upgrading mid-cycle, you're charged
              a prorated difference today and your new billing date becomes your upgrade
              date.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="refunds">
            <AccordionTrigger className="text-left text-base sm:text-lg font-medium">
              Do you offer refunds?
            </AccordionTrigger>
            <AccordionContent className="text-neutral-700 leading-relaxed">
              Subscriptions are non-refundable. Limited exceptions may be considered for
              duplicate charges, billing errors, or extended technical failures that prevent access.
              All exceptions require review.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <div className="mt-12 text-center">
        <h3 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Still have questions?
        </h3>
        <p className="mt-3 text-base sm:text-lg text-neutral-700">
          Our team is here to help.
        </p>

        <div className="mt-6 flex justify-center">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-900/60 bg-white/40 px-6 py-3 text-sm font-medium text-neutral-900 shadow-sm transition hover:bg-white"
          >
            Contact us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}
