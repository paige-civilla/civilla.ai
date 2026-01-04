import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BrandText } from "./Brand";

const FEATURES = [
  {
    title: "Your Case Journey",
    desc:
      "Family court cases often follow predictable stages. civilla gives you a plain-language overview of what typically happens at each step, so you can understand what to expect.",
  },
  {
    title: "Your Evidence Timeline",
    desc:
      "Build a dated timeline from the information you enter — notes, events, and uploads — so your case materials stay organized and easy to review.",
  },
  {
    title: "Your Pattern Analysis",
    desc:
      "civilla highlights patterns in the information you log (themes, frequency, dates, categories) to help you stay organized and notice what you may want to document.",
  },
  {
    title: "Your Child Support Estimator",
    desc:
      "Estimate only — not court-official. Actual amounts are set by the court and may differ. For legal advice, talk to a licensed attorney or legal aid.",
  },
  {
    title: "Your Research Assistant",
    desc:
      "Ask Lexi questions and explore educational, plain-language explanations. Lexi supports research and understanding — it does not provide legal advice.",
  },
  {
    title: "Your Document Builder",
    desc:
      "Create educational drafts from your inputs and templates. You stay in control: review, edit, and decide what (if anything) you use.",
  },
];

export default function ToolsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section 
      id="home-learn-more"
      className="bg-bush-dark w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-tools"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-5 md:gap-6 items-center text-white text-center max-w-content-large w-full">
          <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
            What You Can Do With <em className="italic">civilla</em>
          </h2>
          <div className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full space-y-4">
            <p>
              <em className="italic">civilla</em> is a platform designed to help you learn, research, and stay organized while navigating your court case.
            </p>
            <p>
              With <em className="italic">civilla</em>, you can:
            </p>
            <ul className="list-disc text-left max-w-md mx-auto space-y-1 pl-5">
              <li>Learn how court processes work and what steps are commonly involved</li>
              <li>Research questions using Lexi, our AI assistant, including state-specific rules, terminology, and publicly available court information</li>
              <li>Organize your case materials such as documents, evidence, timelines, deadlines, disclosures, and communications</li>
            </ul>
            <p>
              <em className="italic">civilla</em> does not act as a lawyer. We don't represent you in court, make decisions for you, or predict outcomes. Instead, we give you tools and information so you can better understand your situation and manage your case with confidence.
            </p>
          </div>
        </div>

        <div className="flex justify-center w-full">
          <div className="rounded-2xl border border-white/30 bg-white/5 p-4 text-center max-w-2xl w-full">
            <div className="flex flex-col">
              {FEATURES.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={item.title} className="border-b border-white/20 last:border-b-0">
                    <button
                      type="button"
                      className="w-full py-5 text-center text-xl md:text-2xl font-semibold tracking-tight text-white flex items-center justify-center gap-2"
                      aria-expanded={isOpen}
                      aria-controls={`feature-panel-${idx}`}
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      data-testid={`button-accordion-${item.title.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      <span>{item.title}</span>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-white/70" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/70" />
                      )}
                    </button>

                    <div
                      id={`feature-panel-${idx}`}
                      className={`${isOpen ? "pb-5" : "h-0 overflow-hidden"} transition-all`}
                    >
                      {isOpen && (
                        <p className="text-white/85 leading-relaxed text-sm md:text-base text-center">
                          <BrandText>{item.desc}</BrandText>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
