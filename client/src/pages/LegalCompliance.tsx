import { useState } from "react";
import { ChevronRight, ChevronUp, ChevronDown, Check, Ban, BarChart3 } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

function EducationSection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-16 py-28"
      data-testid="section-education"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-center w-full">
          <div className="flex-1 aspect-[600/640] rounded-2xl overflow-hidden">
            <img 
              src="https://www.figma.com/api/mcp/asset/45617208-0482-4b11-9665-f57d418aec3c"
              alt="Open book representing education"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col gap-8 items-start">
            <div className="flex flex-col gap-6 items-start w-full">
              <div className="flex flex-col gap-6 items-start text-neutral-darkest w-full">
                <h2 className="cv-h font-heading font-bold tracking-[0.6px] leading-[1.2] w-full" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
                  Education only, never legal advice
                </h2>
                <p className="cv-p font-sans font-normal text-[20px] leading-[1.6] w-full">
                  Everything on Civilla is designed to inform and explain. We do not provide legal advice, and nothing here replaces an attorney.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-[18px] leading-[1.6] px-[22px] py-2 rounded-xl"
                data-testid="button-learn-more"
              >
                Learn
              </button>
              <button 
                className="flex gap-2 items-center text-neutral-darkest font-bold text-[18px] leading-[1.6]"
                data-testid="button-read"
              >
                Read
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BoundariesSection() {
  const items = [
    {
      icon: Check,
      text: "We can explain what service of process means",
      type: "can"
    },
    {
      icon: Ban,
      text: "We cannot tell you when to file for custody",
      type: "cannot"
    },
    {
      icon: BarChart3,
      text: "We can show you your state's custody factors",
      type: "can"
    }
  ];

  return (
    <section 
      className="bg-bush w-full flex flex-col items-center px-16 py-28"
      data-testid="section-boundaries"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex gap-20 items-center w-full">
          <div className="flex-1 flex flex-col gap-8 items-start">
            <div className="flex flex-col gap-8 items-start w-full">
              <div className="flex flex-col gap-4 items-start w-full">
                <span className="font-sans font-bold text-[16px] leading-[1.5] text-white">
                  Boundaries
                </span>
                <div className="flex flex-col gap-6 items-start text-white w-full">
                  <h2 className="cv-h font-heading font-bold tracking-[0.6px] leading-[1.2] w-full" style={{ fontSize: 'clamp(36px, 4.5vw, 60px)' }}>
                    What we can and cannot do for you. Understanding these limits keeps you safe and informed.
                  </h2>
                  <p className="cv-p font-sans font-normal text-[20px] leading-[1.6] w-full">
                    Civilla answers educational questions. We explain legal terms, show how courts work, and help you organize evidence. We do not answer case-specific questions or tell you what decisions to make.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 items-start py-2 w-full">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-center w-full">
                    <item.icon className="w-4 h-4 text-white flex-shrink-0" />
                    <span className="font-sans font-normal text-[18px] leading-[1.6] text-white">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-6 items-center">
              <button 
                className="bg-transparent border-2 border-white text-white font-bold text-[18px] leading-[1.6] px-[22px] py-2 rounded-xl"
                data-testid="button-learn-boundaries"
              >
                Learn
              </button>
              <button 
                className="flex gap-2 items-center text-white font-bold text-[18px] leading-[1.6]"
                data-testid="button-read-boundaries"
              >
                Read
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 aspect-[600/640] rounded-2xl overflow-hidden">
            <img 
              src="https://www.figma.com/api/mcp/asset/a8e88eac-3797-4930-8f68-b462609e9e2a"
              alt="Door representing boundaries"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const faqs = [
    {
      id: 0,
      question: "Can Civilla give me legal advice?",
      answer: "No. Civilla is built for education only. We explain how family law works, help you organize your case, and show you what options exist. We never tell you what to file, when to file it, or how to argue your case. That requires a lawyer."
    },
    {
      id: 1,
      question: "Is my information private?",
      answer: "Yes. Your documents, messages, and case details stay on Civilla's secure servers. We do not share your information with courts, opposing parties, or third parties. See our Privacy Policy for full details."
    },
    {
      id: 2,
      question: "What if I need a real lawyer?",
      answer: "Civilla helps you prepare and understand your case, but it does not replace legal representation. If you can afford an attorney, we recommend consulting one. We can help you organize your materials to share with a lawyer."
    },
    {
      id: 3,
      question: "Can I use Civilla's documents in court?",
      answer: "Civilla's documents come with clear disclaimers that they are educational drafts, not legal documents. You are responsible for ensuring any document you file meets your court's rules and requirements. Always verify with your local court."
    },
    {
      id: 4,
      question: "Who decides what I do with my case?",
      answer: "You do. Civilla gives you information and options. You make all decisions about your case. We support your choices by helping you understand the law and organize your evidence."
    }
  ];

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
            Find answers about how Civilla works and what it cannot do.
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
              Everything you need to know about Civilla
            </p>
          </div>
          <div className="flex items-center">
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
              data-testid="button-contact-faq"
            >
              Contact us
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LegalCompliance() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <EducationSection />
        <BoundariesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
