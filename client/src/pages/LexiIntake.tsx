import { useSearch } from "wouter";
import AppLayout from "@/components/layout/AppLayout";
import { LexiIntakeCard } from "@/components/lexi/LexiIntakeCard";

export default function LexiIntake() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const jurisdictionState = params.get("state") || undefined;

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <LexiIntakeCard jurisdictionState={jurisdictionState} />
      </div>
    </AppLayout>
  );
}
