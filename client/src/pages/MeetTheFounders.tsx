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

function PolaroidImage({ src, alt, tiltDirection = "left", objectPosition = "center" }: { src: string; alt: string; tiltDirection?: "left" | "right"; objectPosition?: string }) {
  const initialRotate = tiltDirection === "left" ? "-rotate-2" : "rotate-2";
  const hoverRotate = tiltDirection === "left" ? "hover:rotate-1" : "hover:-rotate-1";
  
  return (
    <div 
      className={`
        bg-white p-2 md:p-3 pb-8 md:pb-10 
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
          style={{ objectPosition }}
        />
      </div>
    </div>
  );
}

function FoundersSection() {
  return (
    <section className="bg-cream w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16" data-testid="section-founders">
      <div className="w-full max-w-container">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-2xl border border-white/20 bg-bush p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="w-full max-w-[280px] mx-auto">
                <PolaroidImage src={founderImage1} alt="Paige - Founder" tiltDirection="left" />
              </div>
              
              <h2 className="cv-h font-heading font-bold text-heading-3-mobile md:text-[28px] tracking-[0.28px] leading-[1.2] text-white">
                A Note From Our Founder
              </h2>
              
              <div className="flex flex-col gap-4 font-sans text-sm md:text-[16px] text-white/90 leading-[1.6]">
                <p>
                  Family court wasn't built for people like us. People who can't afford a lawyer at the rate of a used Honda every week (no offense, attorneys). People juggling work, kids, healing, and maybe three hours of sleep. People trying to raise their kids in peace while the system keeps getting pulled back into conflict.
                </p>
                <p>
                  I know this world too well.
                </p>
                <p>
                  I've lived the divorce, the aftermath, and the endless paperwork that feels like a thousand tiny cuts. I've done the late-night, cry-in-the-car sessions after holding it together all day. I've been in that foggy place where you're trying to parent, survive, grow, and defend yourself in the same week, while wishing someone, anyone, could explain what is actually happening.
                </p>
                <p>
                  The truth is, I didn't create <span className="italic font-medium">civilla</span>.ai because I'm a tech founder who spotted a "market opportunity." I created it because I was a parent who felt overwhelmed, under-resourced, and expected to somehow understand a system that speaks in riddles. I needed clarity, calm, and a place to land when everything felt like too much. And I knew I wasn't the only one.
                </p>
                <p>
                  All of us deserve steadiness, understanding, and a sense of direction, especially when life is pulling you in every possible direction at once.
                </p>
                <p>
                  Go kick ass. Bring receipts.<br />
                  — P.
                </p>
                <p className="text-white/70 italic text-sm">
                  (Single mom. Survivor. Self-represented. Builder of things that should've existed long ago.)
                </p>
                <p>
                  P.S. When I say "I built it," I really mean <span className="font-bold">we</span> built this. I had the idea, and B. saw the vision and believed in me.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-bush p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="w-full max-w-[280px] mx-auto">
                <PolaroidImage src={founderImage2} alt="Bryan - Co-Founder" tiltDirection="right" objectPosition="center 30%" />
              </div>
              
              <h2 className="cv-h font-heading font-bold text-heading-3-mobile md:text-[28px] tracking-[0.28px] leading-[1.2] text-white">
                A Note From Our Co-Founder
              </h2>
              
              <div className="flex flex-col gap-4 font-sans text-sm md:text-[16px] text-white/90 leading-[1.6]">
                <p>
                  A few years ago, I went through one of the hardest things a person can face: divorce. It tested my strength, my patience, and my sense of fairness. I learned that real strength isn't loud or aggressive. It's steady, grounded, and focused on what matters most: my child, and the relationship I want to protect and build with them.
                </p>
                <p>
                  Like a lot of fathers, I discovered how confusing, costly, and one-sided the process can feel. But as I moved through it, I also began to understand experiences that weren't like my own. Divorce hits everyone differently. There are two sides to every ending, and most people, no matter which side they're on, are just trying to hold themselves together while navigating something they never imagined they'd be in.
                </p>
                <p>
                  That's why we turned this idea into reality. So fathers, mothers, and families could finally have a tool that brings clarity, organization, and calm to a process that often feels impossible. Something that helps you stay steady and advocate for yourself and your kids when everything feels uncertain.
                </p>
                <p>
                  I came out of that chapter stronger, calmer, and more grounded, not just for myself, but for my son.<br />
                  — B.
                </p>
                <p className="text-white/70 italic text-sm">
                  (Dad. Rebuilder. Divorce survivor who once believed Google Docs could solve custody, adorable, I know. 10/10 do not recommend.)
                </p>
                <p>
                  P.S. Yeah, yeah, I know, P.
                </p>
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
    <section className="bg-[#f2f2f2] w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28" data-testid="section-cta">
      <div className="flex flex-col items-start max-w-container w-full">
        <div className="bg-[#f2f2f2] border-2 border-neutral-darkest rounded-2xl p-6 md:p-16 flex flex-col items-center justify-center w-full">
          <div className="flex flex-col gap-6 md:gap-8 items-center max-w-[768px] w-full">
            <div className="flex flex-col gap-4 md:gap-6 items-center text-neutral-darkest text-center w-full">
              <h2 className="cv-h font-heading font-bold text-heading-2-mobile md:text-[60px] tracking-[0.44px] md:tracking-[0.6px] leading-[1.2] w-full">
                Add To The Wall Of Wins
              </h2>
              <p className="cv-p font-sans text-sm md:text-[20px] w-full">
                Big wins, tiny wins, survival wins—we'll take them all. If something went right, we'd love to hear about it.
              </p>
            </div>
            <div className="flex gap-4 items-start">
              <a 
                href="mailto:support@civilla.ai?subject=My%20Win%20for%20the%20Wall%20of%20Wins"
                className="bg-bush text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md button-inset-shadow relative"
                data-testid="button-email-us"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function MeetTheFounders() {
  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-neutral-darkest text-neutral-darkest dark:text-cream">
      <NavbarCream />
      <main className="flex-1">
        <HeaderSection />
        <FoundersSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
