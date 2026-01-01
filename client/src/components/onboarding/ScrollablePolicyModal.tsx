import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";

interface ScrollablePolicyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  text: string;
  onScrolledToBottom: () => void;
  hasScrolled: boolean;
}

export function ScrollablePolicyModal({
  open,
  onOpenChange,
  title,
  text,
  onScrolledToBottom,
  hasScrolled,
}: ScrollablePolicyModalProps) {
  const [reachedBottom, setReachedBottom] = useState(false);
  const [savedScrollY, setSavedScrollY] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;
    
    if (scrollTop + clientHeight >= scrollHeight - 4) {
      if (!reachedBottom) {
        setReachedBottom(true);
        onScrolledToBottom();
      }
    }
  }, [reachedBottom, onScrolledToBottom]);

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSavedScrollY(window.scrollY);
    } else {
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY, left: 0, behavior: "instant" as ScrollBehavior });
      });
    }
    onOpenChange(newOpen);
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-2xl max-h-[85vh] flex flex-col"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-neutral-darkest">{title}</DialogTitle>
          <DialogDescription className="font-sans text-sm text-neutral-darkest/60">
            Please read the entire document below. You must scroll to the bottom to continue.
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto border rounded-lg p-4 bg-[#fafafa] max-h-[50vh]"
        >
          <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-darkest leading-relaxed">
            {text}
          </pre>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          {(reachedBottom || hasScrolled) ? (
            <div className="flex items-center gap-2 text-bush font-medium text-sm">
              <Check className="w-4 h-4" />
              <span>You can now agree to this document</span>
            </div>
          ) : (
            <p className="text-sm text-neutral-darkest/60">
              Scroll to the bottom to enable agreement
            </p>
          )}
          <Button onClick={handleClose} data-testid="button-close-policy-modal">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
