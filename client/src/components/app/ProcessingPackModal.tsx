import { useState, createContext, useContext, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProcessingPackContextType {
  showPackModal: (packSuggested?: "overlimit_200" | "plus_600") => void;
  hidePackModal: () => void;
}

const ProcessingPackContext = createContext<ProcessingPackContextType | null>(null);

export function useProcessingPackModal() {
  const context = useContext(ProcessingPackContext);
  if (!context) {
    throw new Error("useProcessingPackModal must be used within ProcessingPackProvider");
  }
  return context;
}

interface ProcessingPackProviderProps {
  children: React.ReactNode;
}

export function ProcessingPackProvider({ children }: ProcessingPackProviderProps) {
  const [open, setOpen] = useState(false);
  const [suggestedPack, setSuggestedPack] = useState<"overlimit_200" | "plus_600">("overlimit_200");

  const showPackModal = useCallback((packSuggested?: "overlimit_200" | "plus_600") => {
    setSuggestedPack(packSuggested || "overlimit_200");
    setOpen(true);
  }, []);

  const hidePackModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <ProcessingPackContext.Provider value={{ showPackModal, hidePackModal }}>
      {children}
      <ProcessingPackModalContent 
        open={open} 
        onClose={hidePackModal} 
        suggestedPack={suggestedPack} 
      />
    </ProcessingPackContext.Provider>
  );
}

interface ProcessingPackModalContentProps {
  open: boolean;
  onClose: () => void;
  suggestedPack: "overlimit_200" | "plus_600";
}

function ProcessingPackModalContent({ open, onClose, suggestedPack }: ProcessingPackModalContentProps) {
  const { toast } = useToast();
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  const handleBuyPack = async (packType: "overlimit_200" | "plus_600") => {
    setLoadingPack(packType);
    try {
      const response = await fetch("/api/billing/processing-pack/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Pack checkout error:", error);
      toast({
        title: "Unable to purchase pack",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoadingPack(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Processing Limit Reached
          </DialogTitle>
          <DialogDescription>
            You've used all your included processing for this period. Add credits to continue analyzing documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              suggestedPack === "overlimit_200" ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => handleBuyPack("overlimit_200")}
            data-testid="pack-option-overlimit-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Over-Limit Pack</div>
                  <div className="text-sm text-muted-foreground">200 processing credits</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">$19.99</div>
                <div className="text-xs text-muted-foreground">one-time</div>
              </div>
            </div>
          </div>

          <div 
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              suggestedPack === "plus_600" ? "border-primary bg-primary/5" : "border-border"
            }`}
            onClick={() => handleBuyPack("plus_600")}
            data-testid="pack-option-plus-600"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium flex items-center gap-2">
                    Plus Pack
                    <span className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">Best Value</span>
                  </div>
                  <div className="text-sm text-muted-foreground">600 processing credits</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">$49.99</div>
                <div className="text-xs text-muted-foreground">one-time</div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center pt-2">
            Credits never expire and can be used for OCR, AI analysis, and document processing.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            className="w-full" 
            onClick={() => handleBuyPack(suggestedPack)}
            disabled={loadingPack !== null}
            data-testid="button-buy-suggested-pack"
          >
            {loadingPack ? "Processing..." : suggestedPack === "overlimit_200" ? "Add Over-Limit Pack — $19.99" : "Add Plus Pack — $49.99"}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={onClose}
            data-testid="button-close-pack-modal"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
