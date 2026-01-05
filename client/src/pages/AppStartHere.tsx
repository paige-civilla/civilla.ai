import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle, ChevronDown, ChevronUp, ArrowRight, Search, AlertTriangle, FileText, Scale, Gavel, Calendar, Briefcase } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";
import { apiRequest } from "@/lib/queryClient";
import type { Case } from "@shared/schema";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
];

const SECTIONS = [
  {
    id: "first-steps",
    title: "Your First Steps",
    icon: Briefcase,
    content: [
      "If you were served papers: You typically have a limited number of days (often 20-30 depending on your state) to file a response. Check your papers and your state's rules for the exact deadline.",
      "If you are starting a case: You will typically file a petition or complaint, pay a filing fee, and arrange for the other party to be served.",
      "Either way, understanding the basic timeline and required documents is your first priority."
    ]
  },
  {
    id: "document-types",
    title: "Key Document Types",
    icon: FileText,
    content: [
      "Petition / Complaint: The document that starts a case, filed by the party initiating the action.",
      "Response / Answer: Filed by the responding party within a deadline after being served.",
      "Motion: A formal request to the court asking for a specific order or ruling.",
      "Declaration / Affidavit: A sworn written statement of facts, signed under penalty of perjury.",
      "Proposed Order: A draft of the order you are asking the judge to sign.",
      "Proof of Service / Certificate of Service: Evidence that documents were properly delivered to the other party."
    ]
  },
  {
    id: "motions-overview",
    title: "Understanding Motions",
    icon: Gavel,
    content: [
      "A motion is a formal written request to the court. Motions are how parties ask the court to take action or make decisions.",
      "Procedural motions: Requests related to case management (extensions, continuances).",
      "Temporary motions: Requests for interim orders while the case is pending (temporary custody, support).",
      "Evidentiary motions: Requests about what evidence can or cannot be used at trial.",
      "Each motion typically requires a supporting declaration or affidavit explaining the facts, and may require a proposed order."
    ]
  },
  {
    id: "motion-to-amend",
    title: "Motion to Amend",
    icon: FileText,
    content: [
      "A Motion to Amend asks the court for permission to change or update a previously filed document.",
      "Common reasons include correcting errors, adding new information that wasn't available before, or updating circumstances that have changed.",
      "Courts generally allow amendments early in a case but may require showing good cause later on.",
      "The amended document replaces the original, so it should include all the content you want the court to consider."
    ]
  },
  {
    id: "counter-petition",
    title: "Counter-Petition / Counterclaim",
    icon: Scale,
    content: [
      "A Counter-Petition (or Counterclaim) is filed by the responding party to request their own relief from the court.",
      "Instead of only responding to what the other party requested, you can ask for different or additional orders.",
      "For example, if the petitioner asks for sole custody, the respondent might counter-petition for joint custody.",
      "Filing a counterclaim typically follows the same format as a petition and may have its own filing fee."
    ]
  },
  {
    id: "motion-for-sanctions",
    title: "Motion for Sanctions",
    icon: AlertTriangle,
    content: [
      "A Motion for Sanctions asks the court to impose penalties on a party for misconduct or rule violations.",
      "Common grounds include failure to comply with court orders, discovery abuse, or filing frivolous motions.",
      "Sanctions can range from monetary penalties to adverse rulings on disputed issues.",
      "The specific grounds and procedures vary significantly by state and court rules."
    ]
  },
  {
    id: "disclosures-discovery",
    title: "Disclosures vs Discovery",
    icon: Search,
    content: [
      "Disclosures: Documents and information you are required to provide to the other party, often without being asked. Many states call these 'mandatory disclosures' or 'initial disclosures.'",
      "Discovery: Formal requests for information from the other party, including interrogatories (written questions), requests for production (documents), and depositions (recorded testimony).",
      "Key difference: Disclosures are typically required automatically; discovery is requested by one party from the other.",
      "Important: Disclosures and discovery documents are usually exchanged between parties, NOT filed with the court unless used in a motion or at trial. The naming and timing varies by state."
    ]
  },
  {
    id: "evidence-basics",
    title: "Evidence Basics",
    icon: FileText,
    content: [
      "Relevance: Evidence must relate to a fact that matters in your case.",
      "Credibility: Consider whether the source of information is trustworthy and consistent.",
      "Admissibility: Not all relevant evidence is automatically allowed. Rules govern what a judge can consider.",
      "Authentication: You may need to prove that a document or piece of evidence is what you claim it is.",
      "Keep your evidence organized with clear labels and dates to make it easier to use when needed."
    ]
  },
  {
    id: "deadlines",
    title: "Understanding Deadlines",
    icon: Calendar,
    content: [
      "Family court cases have strict deadlines. Missing a deadline can mean losing the right to respond or request relief.",
      "Common deadlines include: response filing deadline, discovery cutoffs, motion filing deadlines, and trial dates.",
      "Deadlines are usually calculated from a specific event (like being served) or a court order.",
      "Use the Deadlines module to track your dates, and ask Lexi to research your state's specific rules."
    ]
  }
];

export default function AppStartHere() {
  const [, setLocation] = useLocation();
  const [selectedState, setSelectedState] = useState<string>("");
  const [stateError, setStateError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["first-steps"]);

  const { data: profileData } = useQuery<{ profile: { state?: string | null } }>({
    queryKey: ["/api/profile"],
  });

  const { data: casesData } = useQuery<{ cases: Case[] }>({
    queryKey: ["/api/cases"],
  });

  const firstCase = casesData?.cases?.[0];
  const profileState = profileData?.profile?.state;
  const caseState = firstCase?.state;

  const effectiveState = selectedState || caseState || profileState || "";

  const toggleSection = (id: string) => {
    setExpandedSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleAskLexiMotions = () => {
    if (!effectiveState) {
      setStateError(true);
      return;
    }
    setStateError(false);

    const question = `Research and list the common family court motion types in ${effectiveState}. Include what each motion is for, and cite official sources (state court rules, judiciary self-help pages, judiciary forms, state statutes where relevant). Do not give strategy or recommendations. End with a Sources section.`;

    window.dispatchEvent(new CustomEvent("lexi:ask", {
      detail: {
        text: question,
        mode: "research",
        moduleKey: "start-here",
        caseId: firstCase?.id || null
      }
    }));
  };

  const handleContinueToDashboard = async () => {
    try {
      await apiRequest("PATCH", "/api/profile", { startHereSeen: true });
    } catch (e) {
      localStorage.setItem("startHereSeen", "true");
    }
    if (firstCase?.id) {
      setLocation(`/app/dashboard/${firstCase.id}`);
    } else {
      setLocation("/app/cases");
    }
  };

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div>
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest flex items-center gap-2 sm:gap-3">
                <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                Start Here
              </h1>
              <p className="font-sans text-sm sm:text-base text-neutral-darkest/60 mt-2">
                Your AI research + organization assistant
              </p>
            </div>
            <Button
              onClick={handleContinueToDashboard}
              className="w-full sm:w-auto"
              data-testid="button-continue-to-dashboard"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <Card className="w-full mb-6 border-[#A2BEC2] bg-[#F9FAFB]">
            <CardContent className="py-4">
              <p className="text-sm text-neutral-darkest/70 text-center">
                civilla provides education, research, and organization tools. We do not provide legal advice or represent you.
              </p>
            </CardContent>
          </Card>

          <Card className="w-full mb-8 border-[#628286]">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="w-5 h-5 text-primary" />
                Research Your State's Motions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-neutral-darkest mb-2 block">
                    Select your state
                  </label>
                  <Select
                    value={selectedState || effectiveState}
                    onValueChange={(val) => {
                      setSelectedState(val);
                      setStateError(false);
                    }}
                  >
                    <SelectTrigger 
                      className={stateError ? "border-red-500" : ""} 
                      data-testid="select-state"
                    >
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {stateError && (
                    <p className="text-sm text-red-500 mt-1">Select your state first</p>
                  )}
                </div>
              </div>

              <Button
                size="lg"
                onClick={handleAskLexiMotions}
                className="w-full sm:w-auto"
                data-testid="button-ask-lexi-motions"
              >
                <Gavel className="w-5 h-5 mr-2" />
                Ask Lexi: List motions in my state
              </Button>
            </CardContent>
          </Card>

          <div className="w-full mb-8">
            <LexiSuggestedQuestions 
              moduleKey="start-here" 
              caseId={firstCase?.id || ""} 
              defaultMode="research" 
            />
          </div>

          <div className="w-full space-y-4">
            <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4">
              Understanding Family Court Basics
            </h2>

            {SECTIONS.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              const Icon = section.icon;

              return (
                <Collapsible
                  key={section.id}
                  open={isExpanded}
                  onOpenChange={() => toggleSection(section.id)}
                >
                  <Card className="border-[#A2BEC2]">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover-elevate py-4">
                        <CardTitle className="flex items-center justify-between text-base">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#C3D5D7] flex items-center justify-center">
                              <Icon className="w-4 h-4 text-[#628286]" />
                            </div>
                            <span>{section.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-neutral-darkest/50" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-darkest/50" />
                          )}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        <ul className="space-y-2">
                          {section.content.map((item, idx) => (
                            <li key={idx} className="flex gap-2 text-sm text-neutral-darkest/80">
                              <span className="text-primary mt-1 flex-shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          <div className="w-full mt-8 pt-8 border-t border-neutral-darkest/10 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={handleContinueToDashboard}
              className="w-full sm:w-auto"
              data-testid="button-continue-to-dashboard-bottom"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
