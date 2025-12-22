import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import { BrandMark } from "@/components/BrandMark";

const imgPlaceholderImage = "https://www.figma.com/api/mcp/asset/c0dba5d6-8871-4138-b2ce-bb7c8038878a";
const imgPlaceholderImage1 = "https://www.figma.com/api/mcp/asset/9a0ac209-9561-45fe-b293-55d1583c7ca2";
const imgVector = "https://www.figma.com/api/mcp/asset/733776f2-b811-4d3c-84db-e74919032fd1";
const imgVector1 = "https://www.figma.com/api/mcp/asset/e735d03f-ac75-40ca-bfe1-7e7077182662";
const imgVector2 = "https://www.figma.com/api/mcp/asset/91268db6-076c-4db4-9141-c3f3fa218d73";
const imgRuleIcon = "https://www.figma.com/api/mcp/asset/eb534531-c64a-41f5-8ac8-db343f842da1";
const imgExploreIcon = "https://www.figma.com/api/mcp/asset/b7406a41-4908-40e6-bf88-31270c1ca4cb";
const imgStars = "https://www.figma.com/api/mcp/asset/9a8784d4-e265-4a60-8093-549fabd13b41";
const imgAvatarImage = "https://www.figma.com/api/mcp/asset/56ff492f-7eaa-408f-a9f2-2256c46176ba";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
              How{" "}<BrandMark variant="civilla" />{" "}works
            </h1>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              A calm, step-by-step guide to understanding your case and taking control
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-journey">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] w-full">
              Your case, step by step
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              See how family law cases typically move through the courts
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 flex flex-col min-w-0">
              <div className="flex flex-col gap-4 md:gap-6 items-start justify-center p-6 md:p-8 min-w-0">
                <div className="flex flex-col gap-2 items-start w-full min-w-0">
                  <span className="font-sans font-bold text-sm md:text-[16px] text-neutral-darkest leading-[1.5]">
                    Step one
                  </span>
                  <div className="flex flex-col gap-3 md:gap-4 items-start text-neutral-darkest w-full">
                    <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] leading-[1.2] tracking-[0.32px] md:tracking-[0.4px] w-full">
                      Understand your case type and timeline
                    </h3>
                    <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                      Learn what happens when
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-[280px] md:h-[416px] w-full">
                <img src={imgPlaceholderImage} alt="" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex flex-col gap-8 items-start w-full md:w-[864px] min-w-0">
              <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 w-full flex flex-col md:flex-row min-w-0">
                <div className="flex flex-1 flex-col gap-4 md:gap-6 items-start justify-center p-6 md:p-8 min-w-0">
                  <div className="flex flex-col gap-2 items-start w-full">
                    <span className="font-sans font-bold text-sm md:text-[16px] text-neutral-darkest leading-[1.5]">
                      Step two
                    </span>
                    <div className="flex flex-col gap-3 md:gap-4 items-start text-neutral-darkest w-full">
                      <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] leading-[1.2] tracking-[0.32px] md:tracking-[0.4px] w-full">
                        Gather and organize your documents
                      </h3>
                      <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                        Upload evidence, messages, photos, and timelines in one place
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-[200px] md:h-full w-full md:w-[432px]">
                  <img src={imgPlaceholderImage1} alt="" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start w-full min-w-0">
                <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 flex flex-col min-w-0">
                  <div className="flex flex-col gap-4 md:gap-6 items-start justify-center p-6 md:p-8 min-w-0">
                    <div className="flex flex-col gap-4 md:gap-6 items-start w-full min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
                        <img src={imgRuleIcon} alt="" className="w-full h-full" />
                      </div>
                      <div className="flex flex-col gap-3 md:gap-4 items-start text-neutral-darkest w-full min-w-0">
                        <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] leading-[1.2] tracking-[0.32px] md:tracking-[0.4px] w-full">
                          Step three
                        </h3>
                        <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                          Research the laws and rules that apply to you
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 flex flex-col min-w-0">
                  <div className="flex flex-col gap-4 md:gap-6 items-start justify-center p-6 md:p-8 min-w-0">
                    <div className="flex flex-col gap-4 md:gap-6 items-start w-full min-w-0">
                      <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
                        <img src={imgExploreIcon} alt="" className="w-full h-full" />
                      </div>
                      <div className="flex flex-col gap-3 md:gap-4 items-start text-neutral-darkest w-full min-w-0">
                        <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] leading-[1.2] tracking-[0.32px] md:tracking-[0.4px] w-full">
                          Step four
                        </h3>
                        <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                          Prepare yourself with knowledge and clarity
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClaritySection() {
  return (
    <section className="bg-bush-dark w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-clarity">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-white text-center w-full">
            <h2 className="cv-h font-heading text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] w-full">
              What changes when you understand the process
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              Overwhelm fades when you see the path ahead. Knowledge replaces fear, and you move from feeling lost to feeling grounded in what comes next.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start w-full">
          <div className="flex flex-1 flex-col gap-4 md:gap-6 items-center min-h-0 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <img src={imgVector2} alt="" className="w-full h-full" />
            </div>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-white text-center w-full min-w-0">
              <h3 className="cv-h font-heading text-heading-3-mobile md:text-[40px] tracking-[0.32px] md:tracking-[0.4px] w-full">
                The stress of not knowing what comes next
              </h3>
              <p className="cv-p font-sans text-sm md:text-body-regular w-full">
                You move from confusion to clarity. From isolated to supported. From powerless to informed.
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 md:gap-6 items-center min-h-0 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <img src={imgVector1} alt="" className="w-full h-full" />
            </div>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-white text-center w-full min-w-0">
              <h3 className="cv-h font-heading text-heading-3-mobile md:text-[40px] tracking-[0.32px] md:tracking-[0.4px] w-full">
                What your options actually are
              </h3>
              <p className="cv-p font-sans text-sm md:text-body-regular w-full">
                When you understand the process, fear loses its grip. You see the path ahead.
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 md:gap-6 items-center min-h-0 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <img src={imgVector} alt="" className="w-full h-full" />
            </div>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-white text-center w-full min-w-0">
              <h3 className="cv-h font-heading text-heading-3-mobile md:text-[40px] tracking-[0.32px] md:tracking-[0.4px] w-full">
                Your sense of agency in your own case
              </h3>
              <p className="cv-p font-sans text-sm md:text-body-regular w-full">
                Education is power. We explain how family law works so you can make decisions that fit your situation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  const tabs = [
    { id: "case-journey", label: "Case journey" },
    { id: "evidence-map", label: "Evidence map" },
    { id: "research-guide", label: "Research guide" },
    { id: "document-prep", label: "document prep" },
    { id: "timeline-view", label: "Timeline view" },
    { id: "safety-tools", label: "Safety tools" },
  ];

  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-tools">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] w-full">
              What you get inside
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              Each tool is built to help you understand your case and stay organized. Nothing is hidden or complicated.
            </p>
          </div>
        </div>

        <div className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl overflow-hidden w-full">
          <div className="flex flex-col md:flex-row items-start w-full">
            {tabs.map((tab, index) => (
              <div
                key={tab.id}
                className={`w-full md:flex-1 flex flex-col items-center justify-center px-6 md:px-8 py-4 md:py-6 ${
                  index === 0 ? "" : "border-t-2 md:border-t-0 md:border-l-2 border-neutral-darkest"
                }`}
              >
                <span className="font-sans font-bold text-sm md:text-[16px] text-neutral-darkest text-center leading-[1.5]">
                  {tab.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-[280px] md:h-[400px] w-full bg-cream border-t-2 border-neutral-darkest flex items-center justify-center">
            <p className="font-sans text-sm md:text-[18px] text-neutral-darkest/50">Tool preview area</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-testimonial">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="w-12 h-12 md:w-16 md:h-16 relative">
            <img src={imgStars} alt="" className="w-full h-full" />
          </div>
          <p className="cv-p font-sans text-lg md:text-[24px] text-neutral-darkest text-center leading-[1.6] w-full">
            "<BrandMark variant="civilla" /> helped me understand what was happening in my case for the first time. I finally felt like I could breathe."
          </p>
          <div className="flex flex-col gap-2 items-center">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden">
              <img src={imgAvatarImage} alt="Parent testimonial" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-center text-neutral-darkest text-center">
              <span className="font-sans font-bold text-sm md:text-[16px] leading-[1.5]">Parent in California</span>
              <span className="font-sans font-normal text-xs md:text-[14px] leading-[1.5]">Custody case, 2024</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-cta">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center w-full">
          <div className="flex-1 flex flex-col gap-6 md:gap-8 items-start min-w-0">
            <div className="flex flex-col gap-4 md:gap-6 items-start text-white w-full">
              <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                Start your journey today
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Whether you're just beginning or deep in the process,{" "}<BrandMark variant="civilla" />{" "}meets you where you are.
              </p>
            </div>
          </div>
          <div className="flex-1 w-full min-w-0">
            <div className="aspect-[600/400] rounded-2xl bg-white/10 flex items-center justify-center min-w-0">
              <p className="font-sans text-sm md:text-[18px] text-white/50">Product preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HowCivillaWorks() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <JourneySection />
        <ClaritySection />
        <ToolsSection />
        <TestimonialSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
