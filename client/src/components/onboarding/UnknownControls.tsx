import { Button } from "@/components/ui/button";
import { HelpCircle, Ban } from "lucide-react";

export const UNKNOWN_VALUE = "unknown";
export const PREFER_NOT_TO_SAY_VALUE = "prefer_not_to_say";

interface UnknownControlsProps {
  value: string;
  onChange: (value: string) => void;
  labels?: {
    unknown?: string;
    preferNot?: string;
  };
  showHelperText?: boolean;
  disabled?: boolean;
  className?: string;
}

export function UnknownControls({
  value,
  onChange,
  labels = {},
  showHelperText = true,
  disabled = false,
  className = "",
}: UnknownControlsProps) {
  const unknownLabel = labels.unknown || "I don't know yet";
  const preferNotLabel = labels.preferNot || "Prefer not to say";
  
  const isUnknown = value === UNKNOWN_VALUE;
  const isPreferNot = value === PREFER_NOT_TO_SAY_VALUE;
  const hasStatus = isUnknown || isPreferNot;

  if (hasStatus) {
    return (
      <div className={`mt-1 ${className}`}>
        <p className="text-xs text-neutral-darkest/60 flex items-center gap-1">
          <HelpCircle className="w-3 h-3" />
          {isUnknown ? `Marked as "${unknownLabel}"` : `Marked as "${preferNotLabel}"`}
          {" · "}
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled}
            className="text-primary hover:underline"
            data-testid="button-clear-status"
          >
            Clear
          </button>
        </p>
        {showHelperText && (
          <p className="text-xs text-neutral-darkest/40 mt-0.5">
            You can update this later in Settings.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 mt-1 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(UNKNOWN_VALUE)}
        disabled={disabled}
        className="text-xs text-neutral-darkest/60 hover:text-primary p-1 h-auto"
        data-testid="button-unknown"
      >
        <HelpCircle className="w-3 h-3 mr-1" />
        {unknownLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(PREFER_NOT_TO_SAY_VALUE)}
        disabled={disabled}
        className="text-xs text-neutral-darkest/60 hover:text-primary p-1 h-auto"
        data-testid="button-prefer-not-to-say"
      >
        <Ban className="w-3 h-3 mr-1" />
        {preferNotLabel}
      </Button>
      {showHelperText && (
        <span className="text-[10px] text-neutral-darkest/40">
          You can update this later in Settings.
        </span>
      )}
    </div>
  );
}

export function isUnknownOrPreferNot(value: string | null | undefined): boolean {
  return value === UNKNOWN_VALUE || value === PREFER_NOT_TO_SAY_VALUE;
}

export const isFieldDeferred = isUnknownOrPreferNot;

export function getStatusBadge(value: string | null | undefined): string | null {
  if (value === UNKNOWN_VALUE) return "Unknown";
  if (value === PREFER_NOT_TO_SAY_VALUE) return "Not provided";
  return null;
}
