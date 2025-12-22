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

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
              How{" "}<BrandMark text="civilla" />{" "}Works
            </h1>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              A calm, step-by-step overview of what{" "}<BrandMark text="civilla" />{" "}can help you understand and organize — without legal advice.
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
              Your Case, Step By Step
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              See the stages many family-law cases often move through — and what people typically prepare along the way.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start w-full">
            <div className="cv-isolate bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 min-w-0">
              <div className="cv-split">
                <div className="cv-split-text p-6 md:p-8 flex flex-col gap-2 justify-center">
                  <span className="font-sans font-bold text-sm md:text-[16px] text-neutral-darkest leading-[1.5]">
                    Step one
                  </span>
                  <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] leading-[1.2] tracking-[0.32px] md:tracking-[0.4px]">
                    Understand Your Case Type And Timeline
                  </h3>
                  <p className="mt-2 font-sans font-normal text-sm md:text-body-regular leading-[1.6] text-neutral-darkest">
                    Choose your state and case type to view plain-language education and common stages people often see.
                  </p>
                </div>
                <div className="cv-split-media">
                  <div className="h-56 w-full md:h-full">
                    <img src={imgPlaceholderImage} alt="" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8 items-start w-full md:w-[864px] min-w-0">
              <div className="cv-isolate bg-cream border-2 border-neutral-darkest rounded-2xl overflow-hidden flex-1 w-full min-w-0">
                <div className="cv-split">
                  <div className="cv-split-text p-6 md:p-8 flex flex-col gap-3 justify-center">
                    <h3 className="font-heading font-bold text-heading-3-mobile md:text-[40px] leading-[1.2] tracking-[0.32px] md:tracking-[0.4px]">
                      Gather And Organize Your Information
                    </h3>
                    <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] text-neutral-darkest">
                      Add documents, messages, and key events. <BrandMark text="civilla" /> organizes what you provide into a clear, reviewable timeline.
                    </p>
                  </div>
                  <div className="cv-split-media">
                    <div className="h-56 w-full md:h-full">
                      <img src={imgPlaceholderImage1} alt="" />
                    </div>
                  </div>
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
                          Learn What's Typical (Not What To Do)
                        </h3>
                        <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                          Review statutes, court rules, and educational resources.{" "}<BrandMark text="civilla" />{" "}does not tell you what to file, when to file, or what will happen.
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
                          Prepare With Clarity
                        </h3>
                        <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                          Use summaries, checklists, and organized notes to stay grounded, ask better questions, and bring your materials to your attorney or court.
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
              What Changes When You Understand The Process
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              When the steps feel clearer, the overwhelm can ease.{" "}<BrandMark text="civilla" />{" "}is built to help you learn what's typical, track what matters, and stay organized.
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
                The Stress Of Not Knowing What Comes Next
              </h3>
              <p className="cv-p font-sans text-sm md:text-body-regular w-full">
                You move from guessing to informed preparation — one step at a time.
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 md:gap-6 items-center min-h-0 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <img src={imgVector1} alt="" className="w-full h-full" />
            </div>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-white text-center w-full min-w-0">
              <h3 className="cv-h font-heading text-heading-3-mobile md:text-[40px] tracking-[0.32px] md:tracking-[0.4px] w-full">
                What Your Options Actually Are
              </h3>
              <p className="cv-p font-sans text-sm md:text-body-regular w-full">
                Education helps you evaluate choices with more context — without advice or promises.
              </p>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-4 md:gap-6 items-center min-h-0 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 relative flex-shrink-0">
              <img src={imgVector} alt="" className="w-full h-full" />
            </div>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-white text-center w-full min-w-0">
              <h3 className="cv-h font-heading text-heading-3-mobile md:text-[40px] tracking-[0.32px] md:tracking-[0.4px] w-full">
                Your Sense Of Agency In Your Own Case
              </h3>
              <p className="cv-p font-sans text-sm md:text-body-regular w-full">
                You can feel more steady when your information is organized and your questions are clearer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolsSection() {
  const toolTabs = [
    "Your Case Journey",
    "Evidence Map",
    "Research Guide",
    "Document Prep",
    "Timeline View",
    "Safety Tools",
  ];

  return (
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-tools">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-4 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
            <h2 className="cv-h font-heading text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] w-full">
              What You Get Inside
            </h2>
            <p className="cv-p font-sans text-sm md:text-[20px] w-full">
              Each tool is built to help you understand your case and stay organized. Nothing is hidden or complicated.
            </p>
          </div>
        </div>

        <div className="cv-isolate overflow-hidden rounded-[28px] border-2 border-black bg-[#f7f5ef] w-full">
          <div className="border-b-2 border-black bg-[#e7ebea]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
              {toolTabs.map((label, idx) => (
                <div
                  key={label}
                  className={`min-w-0 px-3 py-5 text-center text-xs sm:text-sm font-semibold leading-snug ${
                    idx !== 0 ? "md:border-l-2 md:border-black" : ""
                  }`}
                >
                  <span className="block break-normal hyphens-none">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="relative min-h-[320px] overflow-hidden rounded-2xl border-2 border-black bg-white">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-8 top-10 h-10 w-52 rounded-lg bg-black/10 blur-sm" />
                <div className="absolute left-8 top-28 h-7 w-64 rounded-lg bg-black/10 blur-sm" />
                <div className="absolute left-8 top-44 h-7 w-56 rounded-lg bg-black/10 blur-sm" />
                <div className="absolute right-10 top-24 h-40 w-56 rounded-xl bg-black/10 blur-sm" />
                <div className="absolute bottom-10 left-8 h-9 w-40 rounded-lg bg-black/10 blur-sm" />
              </div>

              <div className="relative flex h-full min-h-[320px] items-center justify-center p-8">
                <div className="max-w-xl text-center">
                  <p className="text-base font-semibold">
                    Tool previews are coming soon.
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">
                    This page explains what each tool is for. Inside the app, you'll use them with
                    <span className="font-semibold"> your </span>
                    own information to stay organized and understand what's typical — without legal advice.
                  </p>
                  <p className="mt-3 text-xs text-neutral-600">
                    Educational &amp; organizational support — not legal advice or representation.
                  </p>
                </div>
              </div>
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
                Start Your Journey Today
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Whether you're just beginning or deep in the process,{" "}<BrandMark text="civilla" />{" "}meets you where you are.
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
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
