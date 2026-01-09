import { Button } from "@/components/ui/button";
import { HelpCircle, Ban, X } from "lucide-react";

export const UNKNOWN_VALUE = "unknown";
export const PREFER_NOT_VALUE = "prefer_not";
export const PREFER_NOT_TO_SAY_VALUE = "prefer_not_to_say";

export function isDeferredValue(v: string | null | undefined): boolean {
  return v === UNKNOWN_VALUE || v === PREFER_NOT_VALUE || v === PREFER_NOT_TO_SAY_VALUE;
}

export function normalizeDeferredValue(v: string | null | undefined): string {
  if (v === PREFER_NOT_TO_SAY_VALUE) return PREFER_NOT_VALUE;
  return v || "";
}

export function prettyDeferredValue(v: string | null | undefined): string {
  if (v === UNKNOWN_VALUE) return "I don't know yet";
  if (v === PREFER_NOT_VALUE || v === PREFER_NOT_TO_SAY_VALUE) return "Prefer not to say";
  return v || "";
}

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
  const isPreferNot = value === PREFER_NOT_VALUE || value === PREFER_NOT_TO_SAY_VALUE;
  const hasStatus = isUnknown || isPreferNot;

  return (
    <div className={`flex flex-wrap items-center gap-2 mt-1 ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(UNKNOWN_VALUE)}
        disabled={disabled}
        className={`text-xs p-1 h-auto ${
          isUnknown 
            ? "bg-primary/10 text-primary border border-primary/30" 
            : "text-neutral-darkest/60 hover:text-primary"
        }`}
        data-testid="button-unknown"
      >
        <HelpCircle className="w-3 h-3 mr-1" />
        {unknownLabel}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(PREFER_NOT_VALUE)}
        disabled={disabled}
        className={`text-xs p-1 h-auto ${
          isPreferNot 
            ? "bg-primary/10 text-primary border border-primary/30" 
            : "text-neutral-darkest/60 hover:text-primary"
        }`}
        data-testid="button-prefer-not"
      >
        <Ban className="w-3 h-3 mr-1" />
        {preferNotLabel}
      </Button>
      {hasStatus && (
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={disabled}
          className="text-xs text-neutral-darkest/50 hover:text-destructive flex items-center gap-0.5"
          data-testid="button-clear-status"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
      {showHelperText && !hasStatus && (
        <span className="text-[10px] text-neutral-darkest/40">
          You can update this later in Settings.
        </span>
      )}
    </div>
  );
}

export const isUnknownOrPreferNot = isDeferredValue;
export const isFieldDeferred = isDeferredValue;

export function getStatusBadge(value: string | null | undefined): string | null {
  if (value === UNKNOWN_VALUE) return "Unknown";
  if (value === PREFER_NOT_VALUE || value === PREFER_NOT_TO_SAY_VALUE) return "Not provided";
  return null;
}
