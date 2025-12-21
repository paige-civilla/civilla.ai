export default function ClaritySection() {
  return (
    <section 
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-clarity"
    >
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-content-large w-full">
          <div className="flex flex-col gap-5 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
              civilla.ai is not a law firm
            </h2>
            <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
              civilla is an educational and organizational platform. We can help you understand court processes and organize your case materials — but we don't provide legal advice, represent you in court, or guarantee outcomes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
