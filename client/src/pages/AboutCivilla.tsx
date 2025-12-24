import { ChevronRight } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";

function HeaderSection() {
  return (
    <section id="mission" className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Why we exist
              </h1>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Family law is complex. You shouldn't have to face it alone or confused.
              </p>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <button 
              className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
              data-testid="button-learn"
            >
              Learn
            </button>
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-[22px] py-2 rounded-md"
              data-testid="button-contact"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  const timelineItems = [
    {
      id: 1,
      title: "Sarah listens to parents in crisis",
      subtitle: "Parents speak first",
      description: "Sarah spent years listening to families navigate family court alone. The same words kept coming back: lost, scared, unsure what comes next.",
      side: "right"
    },
    {
      id: 2,
      title: "First parents test the platform",
      subtitle: "Something had to change",
      description: "The realization was simple but urgent. Parents needed a tool that treated them with respect, explained things clearly, and didn't pretend to be a lawyer.",
      side: "left"
    },
    {
      id: 3,
      title: "Evidence and timeline tools launch",
      subtitle: "Real testing, real feedback",
      description: "We built a rough version and handed it to parents who were actually living this. They told us what worked and what didn't, without holding back.",
      side: "right"
    },
    {
      id: 4,
      title: "Lexi, the research assistant, joins",
      subtitle: "Tools that matter",
      description: "Evidence organizers, timelines, research guides—each one built because a parent said, I need help making sense of this.",
      side: "left"
    }
  ];

  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-timeline">
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <span className="font-sans font-bold text-sm md:text-[16px] text-neutral-darkest text-center leading-[1.5]">
              Journey
            </span>
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                How <span className="italic font-medium">civilla</span> came to be
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                We built a rough version and put it in the hands of real parents. Their feedback was honest and shaped everything that came next. They told us what actually helped.
              </p>
            </div>
          </div>
          <div className="flex gap-6 items-center">
            <button 
              className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-[22px] py-2 rounded-md"
              data-testid="button-read"
            >
              Read
            </button>
            <button 
              className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6]"
              data-testid="button-more"
            >
              More
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-start w-full">
          {timelineItems.map((item) => (
            <div 
              key={item.id}
              className={`flex flex-col md:flex-row gap-6 md:gap-12 items-start w-full ${item.side === 'right' ? 'md:justify-end' : ''}`}
              data-testid={`timeline-item-${item.id}`}
            >
              <div className="hidden md:block">
                {item.side === 'right' && <div className="flex-1" />}
              </div>
              
              {item.side === 'left' && (
                <div className="flex-1 w-full md:w-auto">
                  <TimelineCard item={item} />
                </div>
              )}
              
              <div className="hidden md:flex flex-col items-center w-8 self-stretch">
                <div className="flex flex-col flex-1 gap-2 items-center">
                  <div className="bg-neutral-darkest h-10 w-[3px]" />
                  <div className="w-[15px] h-[15px] bg-neutral-darkest rounded-full" />
                  <div className="bg-neutral-darkest flex-1 w-[3px]" />
                </div>
              </div>
              
              {item.side === 'right' && (
                <div className="flex-1 w-full md:w-auto">
                  <TimelineCard item={item} />
                </div>
              )}
              
              <div className="hidden md:block">
                {item.side === 'left' && <div className="flex-1" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineCard({ item }: { item: { title: string; subtitle: string; description: string } }) {
  return (
    <div className="bg-cream border-2 border-neutral-darkest rounded-2xl p-6 md:p-8 flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col gap-4 md:gap-6 font-heading font-bold text-neutral-darkest leading-[1.2]">
        <h3 className="cv-h text-heading-3-mobile md:text-[48px] tracking-[0.32px] md:tracking-[0.48px]">{item.title}</h3>
        <h4 className="cv-h text-[28px] md:text-[40px] tracking-[0.28px] md:tracking-[0.4px]">{item.subtitle}</h4>
      </div>
      <p className="cv-panel-body font-sans text-sm md:text-[20px] text-neutral-darkest leading-[1.6]">
        {item.description}
      </p>
      <div className="flex gap-6 items-center">
        <button 
          className="bg-transparent border-2 border-neutral-darkest text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
          data-testid="button-card-read"
        >
          Read
        </button>
        <button 
          className="flex gap-2 items-center text-neutral-darkest font-bold text-sm md:text-body-regular leading-[1.6]"
          data-testid="button-card-more"
        >
          More
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
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

export default function AboutCivilla() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <TimelineSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
