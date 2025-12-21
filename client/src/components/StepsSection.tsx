const steps = [
  {
    id: "step-one",
    number: "1",
    title: "Step One",
    description: "Choose your state and case type. Civilla surfaces educational information and typical court steps for that jurisdiction and case category."
  },
  {
    id: "step-two",
    number: "2",
    title: "Step Two",
    description: "Add your documents, messages, and key events. Civilla organizes what you provide into a clear timeline so you can review everything in context."
  },
  {
    id: "step-three",
    number: "3",
    title: "Step Three",
    description: "Get plain-language explanations of common stages and what information people typically prepare — without legal advice or outcome promises."
  }
];

export default function StepsSection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-steps"
    >
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="md:hidden w-full">
          <div className="space-y-0">
            {steps.map((step, idx) => (
              <div key={step.id} className="py-6">
                <div className="grid grid-cols-[70px,1fr] gap-4 items-center">
                  <span className="font-sans font-semibold text-sm text-neutral-darkest flex items-center gap-1">
                    Step <span className="font-heading font-bold text-2xl leading-none">{step.number}</span>
                  </span>
                  <p className="font-sans font-normal text-sm leading-[1.6] text-neutral-darkest">
                    {step.description}
                  </p>
                </div>
                {idx !== steps.length - 1 && (
                  <div className="mt-6 w-full border-b border-black/10" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:block w-full">
          <div className="grid grid-cols-3 gap-x-12 w-full">
            {steps.map((step) => (
              <h3 
                key={step.id} 
                className="font-heading font-bold text-heading-5 tracking-[0.32px] text-neutral-darkest pb-4 text-center"
              >
                {step.title}
              </h3>
            ))}

            <div className="col-span-3 w-full border-b border-black/20 mb-6" />

            {steps.map((step) => (
              <p 
                key={`${step.id}-desc`}
                className="font-sans font-normal text-body-regular leading-[1.6] text-neutral-darkest text-center"
              >
                {step.description}
              </p>
            ))}
          </div>
        </div>

        <p className="font-sans font-bold italic text-sm text-neutral-darkest/70 text-center w-full mt-8">
          *Educational, Research, And Organizational Support — Not Legal Advice Or Representation.*
        </p>
      </div>
    </section>
  );
}
