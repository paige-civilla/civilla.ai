import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import founderImage1 from "@assets/IMG_6122_1766551785069.JPG";
import founderImage2 from "@assets/bubba11_1766551770096.jpg";

function HeaderSection() {
  return (
    <section className="bg-[#e7ebea] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-founders-header">
      <div className="flex flex-col items-center max-w-container w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
          <div className="flex flex-col gap-4 items-center w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h1 className="cv-h font-heading text-heading-1-mobile md:text-[84px] tracking-[0.48px] md:tracking-[0.84px] w-full">
                Meet The Founders
              </h1>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Hey y'all! We're truly glad you're here, and we hope <span className="italic font-medium">civilla</span>.ai supports you in the ways you need.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PolaroidImage({ src, alt, tiltDirection = "left" }: { src: string; alt: string; tiltDirection?: "left" | "right" }) {
  const initialRotate = tiltDirection === "left" ? "-rotate-2" : "rotate-2";
  const hoverRotate = tiltDirection === "left" ? "hover:rotate-1" : "hover:-rotate-1";
  
  return (
    <div 
      className={`
        bg-white p-3 md:p-4 pb-12 md:pb-16 
        shadow-lg 
        ${initialRotate} ${hoverRotate}
        transition-transform duration-300 ease-out
        hover:shadow-xl
        hover:scale-[1.02]
      `}
    >
      <div className="w-full aspect-square overflow-hidden">
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}

function FounderSection() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-founder">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col md:flex-row gap-12 md:gap-20 items-center w-full">
          <div className="flex-1 w-full flex justify-center">
            <div className="w-full max-w-[400px]">
              <PolaroidImage src={founderImage1} alt="Paige - Founder" tiltDirection="left" />
            </div>
          </div>
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] text-white">
              A Note from Our Founder
            </h2>
            <div className="flex flex-col gap-4">
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Family court wasn't built for people like us. People who can't afford a lawyer at the rate of a used Honda every week (no offense, attorneys). People juggling work, kids, healing, and maybe three hours of sleep. People trying to raise their kids in peace while the system keeps getting pulled back into conflict.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                I know this world too well.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                I've lived the divorce, the aftermath, and the endless paperwork that feels like a thousand tiny cuts. I've done the late-night, cry-in-the-car sessions after holding it together all day. I've been in that foggy place where you're trying to parent, survive, grow, and defend yourself in the same week, while wishing someone, anyone, could explain what is actually happening.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                The truth is, I didn't create <span className="italic font-medium">civilla</span>.ai because I'm a tech founder who spotted a "market opportunity." I created it because I was a parent who felt overwhelmed, under-resourced, and expected to somehow understand a system that speaks in riddles. I needed clarity, calm, and a place to land when everything felt like too much. And I knew I wasn't the only one.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                All of us deserve steadiness, understanding, and a sense of direction, especially when life is pulling you in every possible direction at once.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Go kick some bureaucratic ass, kindly, strategically, and with receipts.<br />
                — P.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[16px] text-white/80 leading-[1.6] italic">
                (Single mom. Survivor. Self-represented. Builder of things that should've existed long ago.)
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                P.S. When I say "I built it," I really mean <span className="font-bold">we</span> built this. I had the idea, and B. believed in me, and the idea.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CoFounderSection() {
  return (
    <section className="bg-bush w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-cofounder">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="flex flex-col-reverse md:flex-row gap-12 md:gap-20 items-center w-full">
          <div className="flex-1 flex flex-col gap-4 md:gap-6">
            <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] text-white">
              A Note from Our Co-Founder
            </h2>
            <div className="flex flex-col gap-4">
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                A few years ago, I went through one of the hardest things a person can face: divorce. It tested my strength, my patience, and my sense of fairness. I learned that real strength isn't loud or aggressive. It's steady, grounded, and focused on what matters most: my child, and the relationship I want to build and protect with them.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                Like a lot of fathers, I discovered how confusing, costly, and one-sided the process can feel. But as I moved through it, I also began to understand experiences that weren't like my own. Divorce hits everyone differently. There are two sides to every ending, and most people, no matter which side they're on, are just trying to hold themselves together while navigating something they never imagined they'd be in.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                That's why we turned this idea into reality. So fathers, mothers, and families could finally have a tool that brings clarity, organization, and calm to a process that often feels impossible. Something that helps you stay steady and advocate for yourself and your kids when everything feels uncertain.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                I came out of that chapter stronger, calmer, and more grounded, not just for myself, but for my son.<br />
                — B.
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[16px] text-white/80 leading-[1.6] italic">
                (Dad. Rebuilder. Divorce survivor who once believed Google Docs could solve custody, adorable, I know. 10/10 do not recommend.)
              </p>
              <p className="cv-panel-body font-sans text-sm md:text-[18px] text-white leading-[1.6]">
                P.S. Yeah, yeah, I know, P.
              </p>
            </div>
          </div>
          <div className="flex-1 w-full flex justify-center">
            <div className="w-full max-w-[400px]">
              <PolaroidImage src={founderImage2} alt="Bryan - Co-Founder" tiltDirection="right" />
            </div>
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
        <FounderSection />
        <CoFounderSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
