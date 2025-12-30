import { Link, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, MessageSquare, Users, FolderOpen, FileStack, CheckSquare, Clock } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

export default function AppCase() {
  const params = useParams() as { caseId?: string };
  const caseId = params.caseId || "";

  const modules = [
    {
      key: "documents",
      title: "Documents",
      subtitle: "Upload and organize your case documents",
      href: caseId ? `/app/documents/${caseId}` : "/app",
      comingSoon: false,
      Icon: FileText,
    },
    {
      key: "timeline",
      title: "Timeline",
      subtitle: "Track key dates and deadlines",
      href: caseId ? `/app/timeline/${caseId}` : "/app",
      comingSoon: false,
      Icon: Calendar,
    },
    {
      key: "evidence",
      title: "Evidence",
      subtitle: "Manage and organize case evidence",
      href: caseId ? `/app/evidence/${caseId}` : "/app",
      comingSoon: false,
      Icon: FolderOpen,
    },
    {
      key: "exhibits",
      title: "Exhibits",
      subtitle: "Prepare exhibits for court filings",
      href: caseId ? `/app/exhibits/${caseId}` : "/app",
      comingSoon: false,
      Icon: FileStack,
    },
    {
      key: "tasks",
      title: "Tasks",
      subtitle: "Track your to-do items",
      href: caseId ? `/app/tasks/${caseId}` : "/app",
      comingSoon: false,
      Icon: CheckSquare,
    },
    {
      key: "deadlines",
      title: "Deadlines",
      subtitle: "Never miss an important date",
      href: caseId ? `/app/deadlines/${caseId}` : "/app",
      comingSoon: false,
      Icon: Clock,
    },
    {
      key: "messages",
      title: "Messages",
      subtitle: "Secure communication center",
      href: caseId ? `/app/messages/${caseId}` : "/app",
      comingSoon: false,
      Icon: MessageSquare,
    },
    {
      key: "contacts",
      title: "Contacts",
      subtitle: "Manage case-related contacts",
      href: caseId ? `/app/contacts/${caseId}` : "/app",
      comingSoon: true,
      Icon: Users,
    },
  ];

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8">
        <div className="rounded-2xl bg-[#e7ebea] p-6 md:p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-bush text-white flex items-center justify-center">
              <span className="text-lg font-semibold"> </span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-darkest">
                You&apos;re in your Case Workspace
              </h1>
              <p className="font-sans text-neutral-darkest/70 mt-1">
                This is your central hub for managing your case. Access documents, track deadlines, and stay organized.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {modules.map(({ key, title, subtitle, href, comingSoon, Icon }) => {
            const Tile = (
              <Card
                className={[
                  "h-full rounded-2xl border bg-white",
                  comingSoon ? "opacity-70" : "cursor-pointer hover:shadow-md transition-shadow",
                ].join(" ")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#f4f6f5] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-bush" />
                    </div>

                    {comingSoon && (
                      <span className="px-3 py-1 rounded-full text-xs bg-neutral-100 text-neutral-600">
                        Coming soon
                      </span>
                    )}
                  </div>

                  <h2 className="mt-6 font-heading font-bold text-lg text-neutral-darkest">{title}</h2>
                  <p className="mt-2 font-sans text-sm text-neutral-darkest/60">{subtitle}</p>
                </CardContent>
              </Card>
            );

            return comingSoon ? (
              <div key={key} data-testid={`tile-${key}`}>{Tile}</div>
            ) : (
              <Link key={key} href={href}>
                <a className="block" data-testid={`tile-${key}`}>{Tile}</a>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 border-t pt-8">
          <h2 className="font-heading font-bold text-xl text-neutral-darkest">Case Details</h2>
        </div>
      </div>
    </AppLayout>
  );
}
