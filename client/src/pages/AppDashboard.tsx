import { useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, FileText, Calendar, MessageSquare, Users, FolderOpen, FileStack, CheckSquare, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import type { Case } from "@shared/schema";

const getModuleCards = (caseId: string) => [
  {
    title: "Documents",
    description: "Upload and organize your case documents",
    icon: FileText,
    href: `/app/documents/${caseId}`,
  },
  {
    title: "Timeline",
    description: "Track key dates and deadlines",
    icon: Calendar,
    href: `/app/timeline/${caseId}`,
  },
  {
    title: "Evidence",
    description: "Manage and organize case evidence",
    icon: FolderOpen,
    href: `/app/evidence/${caseId}`,
  },
  {
    title: "Exhibits",
    description: "Prepare exhibits for court filings",
    icon: FileStack,
    href: `/app/exhibits/${caseId}`,
  },
  {
    title: "Tasks",
    description: "Track your to-do items",
    icon: CheckSquare,
    href: `/app/tasks/${caseId}`,
  },
  {
    title: "Deadlines",
    description: "Never miss an important date",
    icon: Clock,
    href: `/app/deadlines/${caseId}`,
  },
  {
    title: "Messages",
    description: "Secure communication center",
    icon: MessageSquare,
    href: `/app/messages/${caseId}`,
  },
  {
    title: "Contacts",
    description: "Manage case-related contacts",
    icon: Users,
    href: `/app/contacts/${caseId}`,
  },
];

export default function AppDashboard() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const { data: caseData, isLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const primaryCase = caseData?.case;

  useEffect(() => {
    if (primaryCase) {
      localStorage.setItem("selectedCaseId", primaryCase.id);
    }
  }, [primaryCase]);

  useEffect(() => {
    if (!isLoading && !primaryCase && caseId) {
      setLocation("/app/cases");
    }
  }, [isLoading, primaryCase, caseId, setLocation]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!primaryCase) {
    return null;
  }

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full mb-8">
            <div>
              <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Your Case Workspace</p>
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {primaryCase.title}
              </h1>
            </div>
            <Link
              href="/app/cases"
              className="inline-flex items-center gap-2 text-sm text-bush font-medium"
              data-testid="link-view-all-cases"
            >
              <Briefcase className="w-4 h-4" />
              View all cases
            </Link>
          </div>

          <div className="w-full bg-[#e7ebea] rounded-lg p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-bush flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-heading font-bold text-lg text-neutral-darkest">
                  Your Case Workspace
                </p>
                <p className="font-sans text-sm text-neutral-darkest/70 mt-1">
                  This is your central hub for managing your case. Access documents, track deadlines, and stay organized.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full">
            <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-4">
              Modules
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getModuleCards(primaryCase.id).map((module) => (
                <Link
                  key={module.title}
                  href={module.href}
                  className="relative bg-white border border-neutral-darkest/10 rounded-lg p-5 hover:border-neutral-darkest/20 cursor-pointer block"
                  data-testid={`module-card-${module.title.toLowerCase()}`}
                >
                  <div className="w-10 h-10 rounded-md bg-muted-green/30 flex items-center justify-center mb-3">
                    <module.icon className="w-5 h-5 text-bush" />
                  </div>
                  <h3 className="font-heading font-bold text-base text-neutral-darkest mb-1">
                    {module.title}
                  </h3>
                  <p className="font-sans text-sm text-neutral-darkest/60">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {primaryCase.state && (
            <div className="w-full mt-8 pt-8 border-t border-neutral-darkest/10">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-3">
                Case Details
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-neutral-darkest/70">
                {primaryCase.state && <span>State: {primaryCase.state}</span>}
                {primaryCase.county && <span>County: {primaryCase.county}</span>}
                {primaryCase.caseType && <span>Type: {primaryCase.caseType}</span>}
              </div>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}
