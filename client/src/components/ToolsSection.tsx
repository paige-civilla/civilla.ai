import { useState } from "react";
import { ChevronRight } from "lucide-react";

const iconUrl = "https://www.figma.com/api/mcp/asset/778b2423-f093-4b22-9574-dd43479ff3f0";

const tabs = [
  {
    id: "case-journey",
    label: "Case journey",
    title: "Track what matters to your case",
    body: "Family law cases follow predictable stages. civilla.ai shows you what happens at each one, from filing through trial, so you know what to expect."
  },
  {
    id: "evidence-timeline",
    label: "Evidence timeline",
    title: "Organize your evidence clearly",
    body: "Upload documents, messages, and evidence. civilla.ai organizes everything into a timeline so you can see the full picture of your case."
  },
  {
    id: "pattern-analysis",
    label: "Pattern analysis",
    title: "See patterns others might miss",
    body: "civilla.ai analyzes your evidence to identify patterns of behavior that may be relevant to your case."
  },
  {
    id: "research-assistant",
    label: "Research assistant",
    title: "Research your specific situation",
    body: "Get plain-language explanations of family law concepts tailored to your state and case type."
  },
  {
    id: "document-builder",
    label: "Document builder",
    title: "Build documents with guidance",
    body: "Create court documents with step-by-step guidance. civilla.ai helps you understand what each section requires."
  }
];

export default function ToolsSection() {
  const [activeTab, setActiveTab] = useState("case-journey");
  const tab = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <section 
      className="bg-bush-dark w-full flex flex-col items-center px-5 md:px-16 py-16 md:py-28"
      data-testid="section-tools"
    >
      <div className="flex flex-col gap-12 md:gap-20 items-center max-w-container w-full">
        <div className="flex flex-col gap-3 md:gap-4 items-center max-w-content-large w-full">
          <span className="font-sans font-bold text-tagline text-white text-center">
            Tools
          </span>
          <div className="flex flex-col gap-5 md:gap-6 items-center text-white text-center w-full">
            <h2 className="font-heading font-bold text-heading-2-mobile md:text-heading-2 tracking-[0.44px] md:tracking-[0.6px] w-full">
              What civilla.ai does
            </h2>
            <p className="font-sans font-normal text-sm md:text-body-medium leading-[1.6] w-full">
              Each tool is built to help you move through your case with less confusion and more confidence. You choose what you need, when you need it.
            </p>
          </div>
        </div>

        <section className="cv-card p-6 md:p-8 w-full">
          <div className="cv-grid-2">
            <div className="rounded-xl border-2 border-white/70 overflow-hidden min-h-0">
              <div className="flex flex-col">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={[
                      "w-full text-left px-6 py-6 border-b-2 border-white/70 last:border-b-0",
                      "font-heading font-bold text-heading-5-mobile md:text-heading-5 text-white tracking-[0.2px] md:tracking-[0.32px] break-words",
                      t.id === activeTab ? "bg-white/10" : "bg-transparent",
                    ].join(" ")}
                    data-testid={`button-tab-${t.id}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cv-panel border-0 md:border-2">
              <div className="cv-panel-body pr-1">
                <div className="mb-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="w-12 h-12 relative">
                      <img src={iconUrl} alt="" className="w-full h-full" />
                    </div>
                  </div>

                  <h3 className="cv-h text-heading-3-mobile md:text-heading-3 text-white tracking-[0.32px] md:tracking-[0.48px]">
                    {tab.title}
                  </h3>

                  <p className="cv-p mt-4 text-sm md:text-body-regular text-white/90">
                    {tab.body}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button 
                  className="bg-transparent border-2 border-white text-white font-bold text-sm md:text-body-regular leading-[1.6] px-6 py-2.5 rounded-md"
                  data-testid="button-tools-explore"
                >
                  Explore
                </button>
                <button 
                  className="flex gap-2 items-center justify-center rounded-md"
                  data-testid="button-tools-learn"
                >
                  <span className="font-sans font-bold text-sm md:text-body-regular text-white leading-[1.6]">
                    Learn more
                  </span>
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
