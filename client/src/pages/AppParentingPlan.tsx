import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import ModuleIntro from "@/components/app/ModuleIntro";
import { LexiSuggestedQuestions } from "@/components/lexi/LexiSuggestedQuestions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Users, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ParentingPlan, ParentingPlanSection } from "@shared/schema";

const SECTION_DEFINITIONS = [
  {
    key: "decision-making",
    title: "Decision-Making",
    description: "How major decisions about children are made.",
    fields: [
      { key: "legalCustody", label: "Legal custody arrangement", type: "textarea", placeholder: "Describe how legal custody is structured (joint, sole, etc.)" },
      { key: "majorDecisions", label: "Major decisions process", type: "textarea", placeholder: "How are major decisions (education, healthcare, religion) handled?" },
      { key: "tieBreaker", label: "Tie-breaker mechanism", type: "textarea", placeholder: "What happens when parents disagree?" },
    ],
  },
  {
    key: "parenting-time",
    title: "Parenting Time",
    description: "Regular schedule for time with each parent.",
    fields: [
      { key: "regularSchedule", label: "Regular parenting time schedule", type: "textarea", placeholder: "Describe the regular weekly/biweekly schedule" },
      { key: "weekendSchedule", label: "Weekend schedule", type: "textarea", placeholder: "How are weekends divided?" },
      { key: "summerSchedule", label: "Summer schedule", type: "textarea", placeholder: "How is summer time arranged?" },
      { key: "transitions", label: "Transition details", type: "textarea", placeholder: "Where and when do transitions occur?" },
    ],
  },
  {
    key: "holidays",
    title: "Holidays & Special Days",
    description: "How holidays, birthdays, and special occasions are shared.",
    fields: [
      { key: "majorHolidays", label: "Major holidays", type: "textarea", placeholder: "How are major holidays (Thanksgiving, Christmas, etc.) divided?" },
      { key: "birthdays", label: "Birthdays", type: "textarea", placeholder: "How are children's birthdays handled?" },
      { key: "parentBirthdays", label: "Parent birthdays & special days", type: "textarea", placeholder: "Mother's Day, Father's Day, parent birthdays?" },
      { key: "schoolBreaks", label: "School breaks", type: "textarea", placeholder: "How are spring break, winter break handled?" },
    ],
  },
  {
    key: "medical",
    title: "Medical & Healthcare",
    description: "Healthcare decisions, insurance, and medical expenses.",
    fields: [
      { key: "healthInsurance", label: "Health insurance", type: "textarea", placeholder: "Who provides health insurance? How are premiums handled?" },
      { key: "medicalDecisions", label: "Medical decisions", type: "textarea", placeholder: "How are routine and emergency medical decisions made?" },
      { key: "medicalExpenses", label: "Medical expenses", type: "textarea", placeholder: "How are out-of-pocket medical expenses divided?" },
      { key: "mentalHealth", label: "Mental health care", type: "textarea", placeholder: "How are therapy or counseling decisions handled?" },
    ],
  },
  {
    key: "education",
    title: "Education",
    description: "School choice, academic decisions, and involvement.",
    fields: [
      { key: "schoolChoice", label: "School selection", type: "textarea", placeholder: "How are school placement decisions made?" },
      { key: "schoolInvolvement", label: "School involvement", type: "textarea", placeholder: "How do both parents stay involved in education?" },
      { key: "homeworkSupport", label: "Homework and academic support", type: "textarea", placeholder: "How is homework handled between households?" },
      { key: "educationalExpenses", label: "Educational expenses", type: "textarea", placeholder: "How are school fees, supplies, tutoring costs divided?" },
    ],
  },
  {
    key: "communication",
    title: "Communication",
    description: "How parents communicate with each other and with children.",
    fields: [
      { key: "parentCommunication", label: "Parent-to-parent communication", type: "textarea", placeholder: "Preferred methods and frequency of communication between parents" },
      { key: "childCommunication", label: "Child communication with other parent", type: "textarea", placeholder: "How can children communicate with the other parent during parenting time?" },
      { key: "emergencyProtocol", label: "Emergency communication", type: "textarea", placeholder: "How are emergencies communicated?" },
      { key: "appOrPlatform", label: "Communication tools", type: "textarea", placeholder: "Any specific apps or platforms used (OurFamilyWizard, etc.)?" },
    ],
  },
  {
    key: "extracurriculars",
    title: "Extracurricular Activities",
    description: "Sports, clubs, lessons, and other activities.",
    fields: [
      { key: "activityDecisions", label: "Activity decisions", type: "textarea", placeholder: "How are decisions about new activities made?" },
      { key: "activityTransportation", label: "Transportation to activities", type: "textarea", placeholder: "Who handles transportation to activities?" },
      { key: "activityCosts", label: "Activity costs", type: "textarea", placeholder: "How are costs for activities divided?" },
      { key: "bothParentsAttend", label: "Parent attendance", type: "toggle", placeholder: "Both parents may attend events/games" },
    ],
  },
  {
    key: "travel",
    title: "Travel",
    description: "Domestic and international travel with children.",
    fields: [
      { key: "domesticTravel", label: "Domestic travel", type: "textarea", placeholder: "What notice is required for domestic travel?" },
      { key: "internationalTravel", label: "International travel", type: "textarea", placeholder: "What is required for international travel?" },
      { key: "passports", label: "Passport handling", type: "textarea", placeholder: "Who holds passports? What consent is needed?" },
      { key: "travelItinerary", label: "Itinerary sharing", type: "textarea", placeholder: "What travel details must be shared with the other parent?" },
    ],
  },
  {
    key: "childcare",
    title: "Childcare",
    description: "Daycare, babysitters, and third-party care.",
    fields: [
      { key: "regularChildcare", label: "Regular childcare", type: "textarea", placeholder: "Current daycare or regular childcare arrangements" },
      { key: "childcareDecisions", label: "Childcare decisions", type: "textarea", placeholder: "How are childcare provider decisions made?" },
      { key: "rightOfFirstRefusal", label: "Right of first refusal", type: "toggle", placeholder: "Other parent offered first if care needed" },
      { key: "childcareCosts", label: "Childcare costs", type: "textarea", placeholder: "How are childcare costs divided?" },
    ],
  },
  {
    key: "safety",
    title: "Safety & Special Concerns",
    description: "Any safety concerns, allergies, or special needs.",
    fields: [
      { key: "allergies", label: "Allergies and medical conditions", type: "textarea", placeholder: "Any allergies or medical conditions both parents must know about" },
      { key: "specialNeeds", label: "Special needs", type: "textarea", placeholder: "Any developmental, emotional, or special needs" },
      { key: "safetyRestrictions", label: "Safety restrictions", type: "textarea", placeholder: "Any safety concerns or restrictions" },
      { key: "substanceUse", label: "Substance use provisions", type: "textarea", placeholder: "Any provisions about alcohol/substance use around children" },
    ],
  },
  {
    key: "financial",
    title: "Financial Responsibilities",
    description: "Child support and expense sharing.",
    fields: [
      { key: "childSupport", label: "Child support", type: "textarea", placeholder: "Child support arrangement (if any)" },
      { key: "expenseSharing", label: "Expense sharing", type: "textarea", placeholder: "How are shared expenses documented and divided?" },
      { key: "taxDependents", label: "Tax dependents", type: "textarea", placeholder: "Who claims children as dependents for taxes?" },
      { key: "collegeExpenses", label: "Future education costs", type: "textarea", placeholder: "Any provisions for future college/education costs?" },
    ],
  },
  {
    key: "modification",
    title: "Modification & Dispute Resolution",
    description: "How the plan can be changed and disputes resolved.",
    fields: [
      { key: "modificationProcess", label: "Modification process", type: "textarea", placeholder: "How can this plan be modified?" },
      { key: "disputeResolution", label: "Dispute resolution", type: "textarea", placeholder: "How are disputes resolved (mediation, court, etc.)?" },
      { key: "reviewSchedule", label: "Regular review", type: "textarea", placeholder: "Will the plan be reviewed periodically?" },
    ],
  },
];

export default function AppParentingPlan() {
  const params = useParams() as { caseId?: string };
  const caseId = params.caseId || "";

  const [sectionData, setSectionData] = useState<Record<string, Record<string, unknown>>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery<{ plan: ParentingPlan; sections: ParentingPlanSection[] }>({
    queryKey: ["/api/cases", caseId, "parenting-plan"],
    enabled: !!caseId,
  });

  useEffect(() => {
    if (data?.sections) {
      const loaded: Record<string, Record<string, unknown>> = {};
      for (const section of data.sections) {
        loaded[section.sectionKey] = section.data as Record<string, unknown>;
      }
      setSectionData(loaded);
    }
  }, [data?.sections]);

  const saveMutation = useMutation({
    mutationFn: async ({ sectionKey, sectionDataVal }: { sectionKey: string; sectionDataVal: Record<string, unknown> }) => {
      if (!data?.plan?.id) return;
      return apiRequest("PUT", `/api/parenting-plan/${data.plan.id}/sections/${sectionKey}`, { data: sectionDataVal });
    },
    onSuccess: (_, variables) => {
      setSavedSections((prev) => new Set(Array.from(prev).concat(variables.sectionKey)));
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "parenting-plan"] });
      setTimeout(() => {
        setSavedSections((prev) => {
          const next = new Set(prev);
          next.delete(variables.sectionKey);
          return next;
        });
      }, 2000);
    },
  });

  const handleFieldChange = useCallback((sectionKey: string, fieldKey: string, value: unknown) => {
    setSectionData((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value,
      },
    }));
  }, []);

  const handleSaveSection = useCallback((sectionKey: string) => {
    const sectionDataVal = sectionData[sectionKey] || {};
    setSavingSection(sectionKey);
    saveMutation.mutate({ sectionKey, sectionDataVal }, {
      onSettled: () => setSavingSection(null),
    });
  }, [sectionData, saveMutation]);

  const handleBlur = useCallback((sectionKey: string) => {
    handleSaveSection(sectionKey);
  }, [handleSaveSection]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-5 md:px-8 py-6 sm:py-8">
        <div className="rounded-2xl bg-[hsl(var(--module-tile))] border border-[hsl(var(--module-tile-border))] p-4 sm:p-6 md:p-8 mb-6 sm:mb-10">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[hsl(var(--module-tile-border))] text-white flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-[#1E2020] dark:text-[hsl(var(--foreground))]">
                Parenting Plan
              </h1>
              <p className="font-sans text-sm sm:text-base text-[#1E2020]/70 dark:text-[hsl(var(--foreground))]/70 mt-1">
                Organize your parenting arrangement details
              </p>
            </div>
          </div>
        </div>

        <ModuleIntro
          title="About Parenting Plans"
          paragraphs={[
            "A parenting plan organizes parenting responsibilities, schedules, and decision-making areas. Civilla helps you organize information — it does not provide legal advice or recommendations.",
            "Use the sections below to document your current or proposed arrangements. Your entries are saved automatically as drafts.",
          ]}
        />

        <LexiSuggestedQuestions
          moduleKey="parenting-plan"
          caseId={caseId}
        />

        <div className="mt-6">
          {data?.plan && (
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-xs">
                {data.plan.status === "draft" ? "Draft" : "Reviewed"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Last updated: {new Date(data.plan.lastUpdatedAt).toLocaleDateString()}
              </span>
            </div>
          )}

          <Accordion type="multiple" className="space-y-2">
            {SECTION_DEFINITIONS.map((section) => {
              const currentData = sectionData[section.key] || {};
              const isSaving = savingSection === section.key;
              const isSaved = savedSections.has(section.key);

              return (
                <AccordionItem
                  key={section.key}
                  value={section.key}
                  className="border border-[hsl(var(--module-tile-border))]/30 rounded-lg bg-white dark:bg-[hsl(var(--card))] overflow-hidden"
                  data-testid={`accordion-section-${section.key}`}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-[hsl(var(--module-tile-hover))]">
                    <div className="flex items-center gap-3 text-left">
                      <span className="font-heading font-semibold text-base">{section.title}</span>
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                      {isSaved && <CheckCircle className="w-4 h-4 text-green-600" />}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                    <div className="space-y-4">
                      {section.fields.map((field) => (
                        <div key={field.key}>
                          {field.type === "toggle" ? (
                            <div className="flex items-center justify-between">
                              <Label htmlFor={`${section.key}-${field.key}`} className="text-sm font-medium">
                                {field.label}
                              </Label>
                              <Switch
                                id={`${section.key}-${field.key}`}
                                checked={Boolean(currentData[field.key])}
                                onCheckedChange={(checked) => {
                                  handleFieldChange(section.key, field.key, checked);
                                  setTimeout(() => handleSaveSection(section.key), 100);
                                }}
                                data-testid={`toggle-${section.key}-${field.key}`}
                              />
                            </div>
                          ) : (
                            <>
                              <Label htmlFor={`${section.key}-${field.key}`} className="text-sm font-medium">
                                {field.label}
                              </Label>
                              <Textarea
                                id={`${section.key}-${field.key}`}
                                placeholder={field.placeholder}
                                value={(currentData[field.key] as string) || ""}
                                onChange={(e) => handleFieldChange(section.key, field.key, e.target.value)}
                                onBlur={() => handleBlur(section.key)}
                                className="mt-1.5 min-h-[80px]"
                                data-testid={`textarea-${section.key}-${field.key}`}
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      </div>
    </AppLayout>
  );
}
