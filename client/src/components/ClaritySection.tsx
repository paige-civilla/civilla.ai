export default function ClaritySection() {
  return (
    <section 
      id="home-learn-more"
      className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-clarity"
    >
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-content-large w-full">
          <div className="flex flex-col gap-5 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
              Civilla is an educational, research, and organizational platform. We help you understand court processes, research questions with Lexi (our AI), and organize your case materials — but we don't provide legal advice, represent you in court, or guarantee outcomes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
