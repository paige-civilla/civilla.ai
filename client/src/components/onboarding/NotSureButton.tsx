import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface NotSureButtonProps {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  isDeferred?: boolean;
  className?: string;
}

export function NotSureButton({
  label = "I don't know yet",
  onClick,
  disabled = false,
  isDeferred = false,
  className = "",
}: NotSureButtonProps) {
  if (isDeferred) {
    return (
      <p className="text-xs text-neutral-darkest/60 mt-1 flex items-center gap-1">
        <HelpCircle className="w-3 h-3" />
        Saved as "not provided". You can add this later in Settings.
      </p>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs text-neutral-darkest/60 hover:text-primary p-0 h-auto mt-1 ${className}`}
      data-testid="button-not-sure"
    >
      <HelpCircle className="w-3 h-3 mr-1" />
      {label}
    </Button>
  );
}
