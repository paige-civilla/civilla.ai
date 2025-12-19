import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const faqs = [
  {
    id: 1,
    question: "Is civilla.ai a law firm?",
    answer: "No. civilla.ai is an educational platform, not a law firm. We don't provide legal advice, represent you in court, or replace an attorney. We help you understand family law and organize your case."
  },
  {
    id: 2,
    question: "Can I use civilla.ai with an attorney?",
    answer: "Yes. Many users work with attorneys and use civilla.ai to organize their evidence and understand their case better. It's a tool to support your preparation, not replace legal counsel."
  },
  {
    id: 3,
    question: "What states does civilla.ai cover?",
    answer: "civilla.ai is designed for U.S. family law and allows you to select your state. Each state has different rules, and civilla.ai customizes information based on your selection."
  },
  {
    id: 4,
    question: "Will civilla.ai tell me what to file?",
    answer: "No. civilla.ai explains what documents exist and how they're typically used, but it doesn't tell you what to file or when. Those decisions are yours, ideally with an attorney's guidance."
  },
  {
    id: 5,
    question: "How is my information kept safe?",
    answer: "Your privacy and security matter. civilla.ai uses encryption and follows strict data protection standards. Read our Privacy Policy for full details about how we handle your information."
  }
];

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([1]);

  const toggleItem = (id: number) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <section 
      className="bg-neutral-lightest w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-faq"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-5 md:gap-6 items-center max-w-content-large text-neutral-darkest text-center w-full">
          <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
            Questions
          </h2>
          <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
            Find answers about how civilla.ai works and what it can do for you.
          </p>
        </div>

        <div className="flex flex-col items-start max-w-content-large w-full border-b-2 border-neutral-darkest">
          {faqs.map((faq) => (
            <div key={faq.id} className="flex flex-col items-start w-full">
              <button
                onClick={() => toggleItem(faq.id)}
                className="flex gap-6 items-center w-full py-5 border-t-2 border-neutral-darkest text-left"
                data-testid={`button-faq-${faq.id}`}
              >
                <span className="flex-1 font-sans font-bold text-body-medium leading-[1.6] text-neutral-darkest">
                  {faq.question}
                </span>
                {openItems.includes(faq.id) ? (
                  <ChevronUp className="w-8 h-8 text-neutral-darkest shrink-0" />
                ) : (
                  <ChevronDown className="w-8 h-8 text-neutral-darkest shrink-0" />
                )}
              </button>
              {openItems.includes(faq.id) && (
                <div className="flex items-start pb-6 w-full">
                  <p className="flex-1 font-sans font-normal text-body-regular leading-[1.6] text-neutral-darkest">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 items-center max-w-content-medium w-full">
          <div className="flex flex-col gap-4 items-center text-neutral-darkest text-center w-full">
            <h3 className="font-heading font-bold text-heading-4 tracking-[0.4px] w-full">
              Common questions answered
            </h3>
            <p className="font-sans font-normal text-body-medium leading-[1.6] w-full">
              Everything you need to know about civilla.ai
            </p>
          </div>
          <div className="flex items-center">
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-contact"
            >
              Contact us
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
