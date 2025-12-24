import { Phone, AlertTriangle, Check, LogOut } from "lucide-react";
import NavbarCream from "@/components/NavbarCream";
import Footer from "@/components/Footer";
import foggyLandscape from "@assets/foggy-landscape-reflected-in-lake_1766286894997.jpg";

const imgTabPane1 = "https://www.figma.com/api/mcp/asset/692b1d30-a133-4b7e-9584-de390e708ba4";
const safetyTools = [
  {
    title: "Neutral username option",
    description: "Use a non-identifying account name",
    details: "When you create your account, you can choose any name you'd like. You don't have to use your real name, and we won't ask you to verify your identity."
  },
  {
    title: "Customized notifications",
    description: "Control when and how civilla contacts you",
    details: "You decide if and when civilla sends you emails or notifications. You can turn them off entirely, or set specific times when you're comfortable receiving them."
  },
  {
    title: "Private browsing tips",
    description: "Guidance for safer browsing habits",
    details: "For extra privacy, consider using your browser's private/incognito mode and clearing your browsing history after each session."
  }
];

export default function SafetySupport() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <NavbarCream />
      
      {/* Hero Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-hero">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col items-center text-center max-w-[768px] mx-auto gap-6">
            <h1 className="font-figtree font-bold text-[clamp(48px,6vw,84px)] leading-[1.1] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
              Safety, Support & Resources
            </h1>
            <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
              Tools and guidance designed to help you stay safe, supported, and in control, online and offline.
            </p>
          </div>
        </div>
      </section>

      {/* Leave in a Click Section */}
      <section className="bg-cream py-28 px-4 md:px-16" data-testid="section-leave-in-click">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col items-center">
            {/* Quick Exit Card */}
            <div className="w-full max-w-3xl border-2 border-neutral-darkest rounded-2xl p-8 md:p-12">
              <div className="flex flex-col gap-8 items-center text-center">
                <div className="flex flex-col gap-6">
                  <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                    Leave In A Click
                  </h2>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    Use Quick Exit in the top bar to immediately leave <span className="italic font-medium">civilla</span> and open a neutral website. For extra privacy, consider using private browsing and clearing your history after use.
                  </p>
                </div>
                
                {/* Enlarged Quick Exit Button Display */}
                <div className="flex flex-col items-center gap-4 pt-4">
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ background: 'linear-gradient(to right, #3d7a6a, #2a5c4e)' }}
                    aria-hidden="true"
                  >
                    <LogOut className="w-10 h-10 text-white" />
                  </div>
                  <p className="font-arimo text-sm text-neutral-darkest/70">
                    Look for this button in the top-right corner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Designed for Discretion Section */}
      <section className="bg-[#0c2f24] py-28 px-4 md:px-16" data-testid="section-discretion">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-12 items-center max-w-3xl mx-auto">
            <div className="w-full">
              <img 
                src={foggyLandscape} 
                alt="Foggy landscape reflected in lake" 
                className="w-full aspect-[16/9] object-cover rounded-2xl"
              />
            </div>
            <div className="flex flex-col gap-6 text-center">
              <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                Designed For Discretion
              </h2>
              <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                <span className="italic font-medium">civilla</span> is built to feel calm and unobtrusive. No flashing alerts, no surprise pop-ups, and no attention-grabbing visuals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tools Section */}
      <section className="bg-[#e7ebea] py-28 px-4 md:px-16" data-testid="section-safety-tools">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-16 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Safety Tools Inside <span className="italic font-medium">civilla</span>
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Features designed to help you stay safe and in control.
                </p>
              </div>
            </div>

            {/* Safety Tools Checklist */}
            <div className="w-full max-w-3xl">
              <div className="flex flex-col gap-4">
                {safetyTools.map((tool) => (
                  <details key={tool.title} className="group border-2 border-neutral-darkest/30 rounded-2xl overflow-hidden bg-white/40">
                    <summary className="flex items-center gap-4 p-6 cursor-pointer list-none">
                      <div className="w-8 h-8 rounded-full bg-bush/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-bush" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-figtree font-bold text-xl leading-[1.2] text-neutral-darkest">
                          {tool.title}
                        </h3>
                        <p className="font-arimo text-base leading-[1.6] text-neutral-darkest/80 mt-1">
                          {tool.description}
                        </p>
                      </div>
                    </summary>
                    <div className="px-6 pb-6 pt-0 pl-[72px]">
                      <p className="font-arimo text-base leading-[1.6] text-neutral-darkest/70">
                        {tool.details}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Your Emotional Safety Matters Section */}
      <section className="bg-[#f2f2f2] py-28 px-4 md:px-16" data-testid="section-emotional-safety">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-20 items-center">
            <div className="flex flex-col gap-4 items-center text-center max-w-[768px]">
              <div className="flex flex-col gap-6 items-center w-full">
                <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-neutral-darkest" style={{ textWrap: "balance" }}>
                  Your Emotional Safety Matters
                </h2>
                <p className="font-arimo text-xl leading-[1.6] text-neutral-darkest" style={{ textWrap: "pretty" }}>
                  Family court can feel overwhelming or frightening. <span className="italic font-medium">civilla</span> is here to help you feel informed, steady, and organized. No pressure, no judgment.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-16 items-center w-full">
              <div className="w-full aspect-[1280/738] rounded-2xl overflow-hidden">
                <img 
                  src={imgTabPane1} 
                  alt="Calm and supportive environment" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="w-full flex flex-col md:flex-row">
                <div className="flex-1 border-t-2 border-bush px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You Are Heard
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    <span className="italic font-medium">civilla</span> is non-judgmental and designed to validate your experience.
                  </p>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You Are In Control
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    Every feature is built around your choices and your pace.
                  </p>
                </div>
                <div className="flex-1 px-6 py-4 flex flex-col gap-1 items-center text-center">
                  <h3 className="font-figtree font-bold text-[26px] leading-[1.2] tracking-[0.01em] text-neutral-darkest">
                    You Are Supported
                  </h3>
                  <p className="font-arimo text-lg leading-[1.6] text-neutral-darkest">
                    We provide education, resources, and a calm space to organize your case.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Service Section */}
      <section className="bg-[#0c2f24] py-28 px-4 md:px-16" data-testid="section-emergency">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col gap-8 items-center text-center max-w-3xl mx-auto">
            <div className="flex flex-col gap-6">
              <h2 className="font-figtree font-bold text-[clamp(36px,5vw,60px)] leading-[1.2] tracking-[0.01em] text-white" style={{ textWrap: "balance" }}>
                <span className="italic font-medium">civilla</span> Is Not An Emergency Service
              </h2>
              <p className="font-arimo text-xl leading-[1.6] text-white" style={{ textWrap: "pretty" }}>
                If you are in immediate danger, please contact emergency services.
              </p>
            </div>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex gap-4 items-center">
                <AlertTriangle className="w-6 h-6 text-white flex-shrink-0" />
                <span className="font-arimo text-lg leading-[1.6] text-white">
                  Call 911 for emergencies
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <Phone className="w-6 h-6 text-white flex-shrink-0" />
                <span className="font-arimo text-lg leading-[1.6] text-white">
                  Call or text 988 for crisis support (24/7)
                </span>
              </div>
              <div className="flex gap-4 items-center">
                <Phone className="w-6 h-6 text-white flex-shrink-0" />
                <span className="font-arimo text-lg leading-[1.6] text-white">
                  National DV Hotline: 1-800-799-7233 or text START to 88788
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
