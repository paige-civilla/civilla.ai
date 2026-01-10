import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Scale } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LegalAcknowledgementModalProps {
  open: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export default function LegalAcknowledgementModal({ open, onAccept, onCancel }: LegalAcknowledgementModalProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/user/accept-drafting-disclaimer");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      onAccept();
    },
  });

  const handleContinue = () => {
    if (acknowledged) {
      acceptMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Important Legal Notice
          </DialogTitle>
          <DialogDescription className="sr-only">
            Please acknowledge the following before proceeding to document drafting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200 space-y-2">
              <p className="font-medium">
                Civilla is not a law firm and does not provide legal advice.
              </p>
              <p>
                Documents are generated from user-provided information and must be reviewed before filing. You are responsible for verifying accuracy and appropriateness for your specific legal situation.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 border rounded-lg">
            <Checkbox
              id="acknowledge-legal"
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(checked === true)}
              data-testid="checkbox-acknowledge-legal"
            />
            <Label htmlFor="acknowledge-legal" className="text-sm cursor-pointer leading-relaxed">
              I understand that Civilla provides organizational tools only, and that I am responsible for reviewing all generated documents before use.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="button-cancel-acknowledgement">
            Go Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!acknowledged || acceptMutation.isPending}
            data-testid="button-accept-acknowledgement"
          >
            {acceptMutation.isPending ? "Saving..." : "I Understand, Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
