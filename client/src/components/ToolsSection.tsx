import { useState } from "react";
import { ChevronRight } from "lucide-react";

const iconUrl = "https://www.figma.com/api/mcp/asset/778b2423-f093-4b22-9574-dd43479ff3f0";

const tabs = [
  {
    id: "case-journey",
    title: "Case journey",
    heading: "Track what matters to your case",
    description: "Family law cases follow predictable stages. civilla.ai shows you what happens at each one, from filing through trial, so you know what to expect."
  },
  {
    id: "evidence-timeline",
    title: "Evidence timeline",
    heading: "Organize your evidence clearly",
    description: "Upload documents, messages, and evidence. civilla.ai organizes everything into a timeline so you can see the full picture of your case."
  },
  {
    id: "pattern-analysis",
    title: "Pattern analysis",
    heading: "See patterns others might miss",
    description: "civilla.ai analyzes your evidence to identify patterns of behavior that may be relevant to your case."
  },
  {
    id: "research-assistant",
    title: "Research assistant",
    heading: "Research your specific situation",
    description: "Get plain-language explanations of family law concepts tailored to your state and case type."
  },
  {
    id: "document-builder",
    title: "Document builder",
    heading: "Build documents with guidance",
    description: "Create court documents with step-by-step guidance. civilla.ai helps you understand what each section requires."
  }
];

export default function ToolsSection() {
  const [activeTab, setActiveTab] = useState(0);

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

        <div className="bg-bush-dark border-2 border-white rounded-lg w-full flex flex-col md:flex-row">
          <div className="flex flex-col md:border-r-2 md:border-white md:max-w-[480px] w-full">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(index)}
                className={`flex flex-col items-start justify-center p-6 md:px-8 md:py-6 w-full text-left border-b-2 border-white last:border-b-0 md:last:border-b-0 ${
                  activeTab === index ? "bg-white/10" : ""
                }`}
                data-testid={`button-tab-${tab.id}`}
              >
                <span className="font-heading font-bold text-heading-5-mobile md:text-heading-5 text-white tracking-[0.2px] md:tracking-[0.32px] w-full">
                  {tab.title}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-col h-auto md:h-[448px] w-full">
            <div className="flex flex-col gap-6 md:gap-8 items-start justify-center p-6 md:p-16 w-full">
              <div className="flex flex-col gap-5 md:gap-6 items-start w-full">
                <div className="w-12 h-12 relative">
                  <img src={iconUrl} alt="" className="w-full h-full" />
                </div>
                <div className="flex flex-col gap-5 md:gap-6 items-start text-white w-full">
                  <h3 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 tracking-[0.32px] md:tracking-[0.48px] w-full">
                    {tabs[activeTab].heading}
                  </h3>
                  <p className="font-sans font-normal text-sm md:text-body-regular leading-[1.6] w-full">
                    {tabs[activeTab].description}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 items-center w-full">
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
        </div>
      </div>
    </section>
  );
}
