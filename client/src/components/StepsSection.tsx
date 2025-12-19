import { ChevronRight } from "lucide-react";

const steps = [
  {
    id: "step-one",
    title: "Step one",
    description: "Select your state and tell us about your case so civilla.ai can show you the rules and processes that apply to your situation.",
    action: "Begin"
  },
  {
    id: "step-two",
    title: "Step two",
    description: "Upload your documents, messages, and evidence. civilla.ai organizes everything into a timeline so you can see the full picture of your case.",
    action: "Organize"
  },
  {
    id: "step-three",
    title: "Step three",
    description: "Get plain-language explanations of what's happening, what's coming next, and what you can do. civilla.ai is with you from start to finish.",
    action: "Understand"
  }
];

export default function StepsSection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-steps"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-12 md:gap-12 items-start w-full">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-1 flex-col gap-6 md:gap-8 items-start">
              <div className="flex flex-col gap-3 md:gap-4 items-start text-neutral-darkest w-full">
                <h3 className="font-heading font-bold text-heading-5-mobile md:text-heading-5 tracking-[0.2px] md:tracking-[0.32px] w-full">
                  {step.title}
                </h3>
                <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                  {step.description}
                </p>
              </div>
              <div className="flex flex-col items-start w-full">
                <button 
                  className="flex gap-2 items-center justify-center rounded-md"
                  data-testid={`button-${step.id}`}
                >
                  <span className="font-sans font-bold text-sm md:text-body-regular text-neutral-darkest leading-[1.6]">
                    {step.action}
                  </span>
                  <ChevronRight className="w-6 h-6 text-neutral-darkest" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
