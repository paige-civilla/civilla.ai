import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { BrandText } from "./Brand";

const faqs = [
  {
    id: 1,
    question: "Is civilla.ai a law firm?",
    questionStyled: true,
    answer: "No. civilla is an educational, research, and organizational platform. We don't provide legal advice, represent you in court, or replace an attorney."
  },
  {
    id: 2,
    question: "Can I use civilla.ai with an attorney?",
    questionStyled: true,
    answer: "Yes. Many people use civilla to stay organized and share timelines, notes, and documents with their attorney. civilla supports your preparation — your attorney remains your legal advisor."
  },
  {
    id: 3,
    question: "What states does civilla.ai cover?",
    questionStyled: true,
    answer: "civilla is built for U.S. family law. You can choose your state to view educational information and typical court processes. Because rules and forms can vary by county, always confirm details with official court sources or an attorney."
  },
  {
    id: 4,
    question: "Will civilla.ai tell me what to file?",
    questionStyled: true,
    answer: "No. civilla can explain what documents exist and how they're typically used, but it doesn't tell you what to file or when. Those decisions are yours — ideally with an attorney's guidance."
  },
  {
    id: 5,
    question: "How is my information kept safe?",
    answer: "Your privacy matters to us. We explain how we handle data in our Privacy Policy. If you ever need to leave quickly, use Quick Exit in the top-right corner."
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
            FAQs
          </h2>
          <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
            <BrandText>Quick answers about what civilla does — and what it doesn't.</BrandText>
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
                  <BrandText>{faq.question}</BrandText>
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
                    <BrandText>{faq.answer}</BrandText>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
