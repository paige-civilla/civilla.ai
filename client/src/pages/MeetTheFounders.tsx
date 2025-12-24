import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

const imgPlaceholderImage = "https://www.figma.com/api/mcp/asset/26166652-168b-426b-9744-1082df316ceb";
const imgPlaceholderImage1 = "https://www.figma.com/api/mcp/asset/702bb028-ef73-4469-8a54-d4dd3bdeff03";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-founders-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Meet the founders
              </h1>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                The people behind <span className="italic font-medium">civilla</span> and why they chose to build it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSection1() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-team-1">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-start w-full">
          <div className="flex-1 w-full aspect-square rounded-2xl overflow-hidden">
            <img 
              src={imgPlaceholderImage} 
              alt="Team" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] text-white">
              Our team
            </h2>
            <div className="flex flex-col gap-4">
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Sarah founded <span className="italic font-medium">civilla</span> after years of watching parents navigate family court alone, overwhelmed and unsupported. She believed then, as she does now, that complexity shouldn't mean isolation. Sarah brings a background in education and a deep commitment to making legal processes accessible to everyone.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Marcus joined early because he saw his own family in the stories parents were telling. His work in community support and crisis intervention shaped how <span className="italic font-medium">civilla</span> thinks about trauma, safety, and meeting people where they are. He ensures every feature we build asks first: will this help someone feel less alone?
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Jen comes from a background in user research and design. She listens to how parents actually use <span className="italic font-medium">civilla</span>, what confuses them, what helps them breathe easier. Her work keeps us honest about whether we're truly making things simpler or just moving the confusion around.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamSection2() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-team-2">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col-reverse md:flex-row gap-12 md:gap-20 items-start w-full">
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] text-white">
              Our team
            </h2>
            <div className="flex flex-col gap-4">
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Our team is small and intentional. We're not lawyers. We're people who believe that understanding your own case shouldn't require a law degree, and that parents deserve tools built with their dignity in mind. We stay grounded in what parents tell us they need, and we build from there.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Every person on this team chose to be here because they believe in the same thing: that family law can be less lonely, less confusing, and more within reach.
              </p>
            </div>
          </div>
          <div className="flex-1 w-full aspect-square rounded-2xl overflow-hidden">
            <img 
              src={imgPlaceholderImage1} 
              alt="Team" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-cta">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl p-6 md:p-16 flex flex-col items-center justify-center w-full">
          <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                We want to hear your story
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Your experience matters. Tell us what you need, what's working, and what isn't.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <button 
                className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
                data-testid="button-share"
              >
                Share
              </button>
              <button 
                className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
                data-testid="button-cta-contact"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MeetTheFounders() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <TeamSection1 />
        <TeamSection2 />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
