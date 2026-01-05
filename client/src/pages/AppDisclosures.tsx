import { useParams } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import ModuleIntro from "@/components/app/ModuleIntro";
import { FileSearch } from "lucide-react";

export default function AppDisclosures() {
  const params = useParams() as { caseId?: string };
  const caseId = params.caseId || "";

  return (
    <AppLayout>
      <div className="px-4 sm:px-5 md:px-8 py-6 sm:py-8">
        <ModuleIntro
          title="Disclosures & Discovery"
          paragraphs={[
            "Track and organize discovery requests, responses, and disclosure requirements for your case.",
          ]}
        />

        <div className="mt-8 rounded-lg border border-[#628286] bg-[#E4ECED] p-6 text-center">
          <FileSearch className="w-12 h-12 text-[#628286] mx-auto mb-4" />
          <h3 className="font-heading font-bold text-lg text-[#1E2020] mb-2">
            Coming Soon
          </h3>
          <p className="font-sans text-sm text-[#1E2020]/70 max-w-md mx-auto">
            This module will help you manage discovery requests, track responses, and organize disclosure documents for your case.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
