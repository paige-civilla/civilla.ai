import { Badge } from "@/components/ui/badge";
import { HelpCircle } from "lucide-react";
import { lexiSuggestedPrompts, getDefaultModeForModule } from "@/lib/lexiSuggestedPrompts";

interface LexiSuggestedQuestionsProps {
  moduleKey: string;
  caseId: string;
  defaultMode?: "help" | "chat" | "research";
}

export function LexiSuggestedQuestions({ 
  moduleKey, 
  caseId,
  defaultMode 
}: LexiSuggestedQuestionsProps) {
  const prompts = lexiSuggestedPrompts[moduleKey];
  
  if (!prompts || prompts.length === 0) {
    return null;
  }

  const mode = defaultMode ?? getDefaultModeForModule(moduleKey);

  const handleQuestionClick = (text: string) => {
    window.dispatchEvent(new CustomEvent("lexi:ask", { 
      detail: { 
        text, 
        mode, 
        moduleKey,
        caseId 
      } 
    }));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="lexi-suggested-questions">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <HelpCircle className="h-4 w-4" />
        <span>Ask Lexi:</span>
      </div>
      {prompts.map((prompt, index) => (
        <Badge
          key={index}
          variant="outline"
          className="cursor-pointer hover-elevate px-3 py-1 text-xs font-normal"
          onClick={() => handleQuestionClick(prompt)}
          data-testid={`button-lexi-question-${index}`}
        >
          {prompt}
        </Badge>
      ))}
    </div>
  );
}
