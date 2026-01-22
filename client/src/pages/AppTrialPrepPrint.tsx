import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Scale, Printer, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Case, TrialBinderSection, TrialBinderItem, EvidenceFile, TimelineEvent, CaseCommunication, Deadline, Task, Document, CaseContact, CaseChild } from "@shared/schema";

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface SourceItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  sourceType: string;
}

export default function AppTrialPrepPrint() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: sectionsData } = useQuery<TrialBinderSection[]>({
    queryKey: ["/api/cases", caseId, "trial-prep/sections"],
    enabled: !!caseId,
  });

  const { data: itemsData } = useQuery<TrialBinderItem[]>({
    queryKey: ["/api/cases", caseId, "trial-prep/items"],
    enabled: !!caseId,
  });

  const { data: evidenceData } = useQuery<{ files: EvidenceFile[] }>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!caseId,
  });

  const { data: timelineData } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/cases", caseId, "timeline"],
    enabled: !!caseId,
  });

  const { data: communicationsData } = useQuery<CaseCommunication[]>({
    queryKey: ["/api/cases", caseId, "communications"],
    enabled: !!caseId,
  });

  const { data: deadlinesData } = useQuery<Deadline[]>({
    queryKey: ["/api/cases", caseId, "deadlines"],
    enabled: !!caseId,
  });

  const { data: tasksData } = useQuery<Task[]>({
    queryKey: ["/api/cases", caseId, "tasks"],
    enabled: !!caseId,
  });

  const { data: documentsData } = useQuery<Document[]>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!caseId,
  });

  const { data: contactsData } = useQuery<CaseContact[]>({
    queryKey: ["/api/cases", caseId, "contacts"],
    enabled: !!caseId,
  });

  const { data: childrenData } = useQuery<CaseChild[]>({
    queryKey: ["/api/cases", caseId, "children"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const sections = sectionsData || [];
  const binderItems = itemsData || [];

  useEffect(() => {
    if (!caseLoading && !currentCase && caseId) {
      if (caseError && (caseError as any).status === 401) {
        console.log("[redirect->login] 401 on case fetch");
        setLocation("/login?reason=session");
      } else {
        console.log("[redirect->cases] case not found or access denied");
        setLocation("/app/cases");
      }
    }
  }, [caseLoading, currentCase, caseId, caseError, setLocation]);

  function getSourceItems(sectionKey: string): SourceItem[] {
    switch (sectionKey) {
      case "evidence":
        return (evidenceData?.files || []).map(f => ({
          id: f.id,
          title: f.originalName,
          subtitle: f.category || undefined,
          date: formatDate(f.createdAt),
          sourceType: "evidence",
        }));
      case "timeline":
        return (timelineData || []).map(e => ({
          id: e.id,
          title: e.title,
          subtitle: e.category || undefined,
          date: formatDate(e.eventDate),
          sourceType: "timeline",
        }));
      case "communications":
        return (communicationsData || []).map(c => ({
          id: c.id,
          title: c.subject || `${c.direction} ${c.channel}`,
          subtitle: c.summary?.substring(0, 50) || undefined,
          date: formatDate(c.occurredAt),
          sourceType: "communication",
        }));
      case "deadlines":
        return (deadlinesData || []).map(d => ({
          id: d.id,
          title: d.title,
          subtitle: d.status,
          date: formatDate(d.dueDate),
          sourceType: "deadline",
        }));
      case "tasks":
        return (tasksData || []).map(t => ({
          id: t.id,
          title: t.title,
          subtitle: t.status,
          date: formatDate(t.dueDate),
          sourceType: "task",
        }));
      case "documents":
        return (documentsData || []).map(d => ({
          id: d.id,
          title: d.title,
          subtitle: d.templateKey || undefined,
          date: formatDate(d.createdAt),
          sourceType: "document",
        }));
      case "contacts":
        return (contactsData || []).map(c => ({
          id: c.id,
          title: c.name,
          subtitle: c.role || undefined,
          date: undefined,
          sourceType: "contact",
        }));
      case "children":
        return (childrenData || []).map(c => ({
          id: c.id,
          title: `${c.firstName} ${c.lastName || ""}`.trim(),
          subtitle: c.dateOfBirth ? `DOB: ${formatDate(c.dateOfBirth)}` : undefined,
          date: undefined,
          sourceType: "child",
        }));
      default:
        return [];
    }
  }

  function getPinnedItems(sectionKey: string): (TrialBinderItem & { sourceItem?: SourceItem })[] {
    const sourceItems = getSourceItems(sectionKey);
    return binderItems
      .filter(i => i.sectionKey === sectionKey && i.pinnedRank !== null)
      .sort((a, b) => (a.pinnedRank || 0) - (b.pinnedRank || 0))
      .map(i => ({
        ...i,
        sourceItem: sourceItems.find(s => s.id === i.sourceId),
      }));
  }

  const sectionsWithPinnedItems = sections.filter(s => getPinnedItems(s.key).length > 0);

  function handlePrint() {
    window.print();
  }

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="loading-spinner">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!currentCase) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      <div className="print:hidden p-4 border-b flex items-center gap-4 bg-background">
        <Link href={`/app/trial-prep/${caseId}`}>
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <Scale className="w-6 h-6 text-[#628286]" />
        <h1 className="text-xl font-semibold">Trial Prep Binder - Print View</h1>
        <div className="flex-1" />
        <Button onClick={handlePrint} data-testid="button-print">
          <Printer className="w-4 h-4 mr-2" />
          Print
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-8 print:p-4">
        <div className="text-center mb-8 pb-4 border-b-2 border-black">
          <h1 className="text-2xl font-bold uppercase tracking-wider">Trial Prep Binder</h1>
          <h2 className="text-lg mt-2">{currentCase.nickname || currentCase.title}</h2>
          {currentCase.caseNumber && (
            <p className="text-sm text-gray-600 mt-1">Case No: {currentCase.caseNumber}</p>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Prepared: {formatDate(new Date())}
          </p>
        </div>

        {sectionsWithPinnedItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No items have been pinned yet.</p>
            <p className="text-sm mt-2">Go back to Trial Prep and pin your Top 3 items in each section.</p>
          </div>
        ) : (
          sectionsWithPinnedItems.map((section, sectionIdx) => {
            const pinnedItems = getPinnedItems(section.key);
            return (
              <div key={section.key} className={sectionIdx > 0 ? "mt-8 pt-8 border-t" : ""}>
                <h3 className="text-lg font-bold uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className="inline-block w-6 h-6 bg-gray-800 text-white text-center rounded-full text-sm leading-6">
                    {sectionIdx + 1}
                  </span>
                  {section.title}
                </h3>

                <div className="space-y-4">
                  {pinnedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 border rounded-lg bg-gray-50 print:bg-white print:border-gray-300"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-[#628286] text-white rounded-full font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{item.sourceItem?.title || "Unknown Item"}</h4>
                          {item.sourceItem?.subtitle && (
                            <p className="text-sm text-gray-600">{item.sourceItem.subtitle}</p>
                          )}
                          {item.sourceItem?.date && (
                            <p className="text-sm text-gray-600">Date: {item.sourceItem.date}</p>
                          )}
                          {item.note && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm print:bg-gray-100 print:border-gray-300">
                              <span className="font-medium">Note:</span> {item.note}
                            </div>
                          )}
                        </div>
                        <Pin className="w-5 h-5 text-[#628286] flex-shrink-0" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        <div className="mt-12 pt-4 border-t text-center text-xs text-gray-400 print:text-gray-600">
          <p>Generated by <span className="italic">civilla</span></p>
          <p className="mt-1">This document is for personal reference only.</p>
        </div>
      </div>

      <style>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}
