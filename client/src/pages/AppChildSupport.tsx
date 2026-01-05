import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { BookOpen, Info, HelpCircle, RefreshCw, Loader2, Search, ExternalLink, Calculator } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, CaseChild } from "@shared/schema";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

interface ResearchResponse {
  ok: boolean;
  content: string | null;
  cached: boolean;
  lastCheckedAt?: string;
}

interface EstimateResponse {
  ok: boolean;
  content: string;
  didCompute: boolean;
}

export default function AppChildSupport() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;

  const { data: caseData } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: childrenData } = useQuery<{ children: CaseChild[] }>({
    queryKey: ["/api/cases", caseId, "children"],
    enabled: !!caseId,
  });

  const [state, setState] = useState("");
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  
  // Estimate input fields
  const [estParentAIncome, setEstParentAIncome] = useState<string>("");
  const [estParentBIncome, setEstParentBIncome] = useState<string>("");
  const [estChildren, setEstChildren] = useState<string>("");
  const [estOvernights, setEstOvernights] = useState<string>("");
  const [estChildcare, setEstChildcare] = useState<string>("");
  const [estHealthInsurance, setEstHealthInsurance] = useState<string>("");
  
  // "I don't know" toggles
  const [unknownParentA, setUnknownParentA] = useState(false);
  const [unknownParentB, setUnknownParentB] = useState(false);
  const [unknownChildren, setUnknownChildren] = useState(false);
  const [unknownOvernights, setUnknownOvernights] = useState(false);

  // Result state
  const [activeResult, setActiveResult] = useState<{ type: "research" | "estimate"; content: string; didCompute?: boolean } | null>(null);

  useEffect(() => {
    if (caseData?.case?.state) {
      setState(caseData.case.state);
    }
  }, [caseData]);

  useEffect(() => {
    if (childrenData?.children) {
      setEstChildren(String(childrenData.children.length));
    }
  }, [childrenData]);

  const { data: cachedResearch, isLoading: isLoadingCached } = useQuery<ResearchResponse>({
    queryKey: ["/api/cases", caseId, "child-support", "research", state],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/child-support/research?state=${encodeURIComponent(state)}`);
      if (!res.ok) throw new Error("Failed to fetch cached research");
      return res.json();
    },
    enabled: !!caseId && !!state && state !== "unknown",
  });

  // Show cached research on load
  useEffect(() => {
    if (cachedResearch?.content && !activeResult) {
      setActiveResult({ type: "research", content: cachedResearch.content });
    }
  }, [cachedResearch, activeResult]);

  const researchMutation = useMutation({
    mutationFn: async ({ refresh }: { refresh?: boolean }) => {
      const response = await apiRequest("POST", `/api/cases/${caseId}/child-support/research`, {
        state,
        refresh,
      });
      return response.json() as Promise<ResearchResponse>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "child-support", "research", state] });
      if (data.content) {
        setActiveResult({ type: "research", content: data.content });
      }
    },
  });

  const estimateMutation = useMutation({
    mutationFn: async () => {
      const inputs: Record<string, number | undefined> = {};
      
      if (!unknownParentA && estParentAIncome) {
        inputs.parentAIncome = parseFloat(estParentAIncome);
      }
      if (!unknownParentB && estParentBIncome) {
        inputs.parentBIncome = parseFloat(estParentBIncome);
      }
      if (!unknownChildren && estChildren) {
        inputs.children = parseInt(estChildren, 10);
      }
      if (!unknownOvernights && estOvernights) {
        inputs.overnights = parseInt(estOvernights, 10);
      }
      if (estChildcare) {
        inputs.childcare = parseFloat(estChildcare);
      }
      if (estHealthInsurance) {
        inputs.healthInsurance = parseFloat(estHealthInsurance);
      }

      const response = await apiRequest("POST", `/api/cases/${caseId}/child-support/estimate`, {
        state,
        inputs,
      });
      return response.json() as Promise<EstimateResponse>;
    },
    onSuccess: (data) => {
      setShowEstimateModal(false);
      setActiveResult({ type: "estimate", content: data.content, didCompute: data.didCompute });
    },
  });

  const handleResearch = () => {
    researchMutation.mutate({ refresh: false });
  };

  const handleRefreshResearch = () => {
    researchMutation.mutate({ refresh: true });
  };

  const handleEstimate = () => {
    estimateMutation.mutate();
  };

  const openEstimateModal = () => {
    // Pre-fill from case if available
    if (childrenData?.children) {
      setEstChildren(String(childrenData.children.length));
      setUnknownChildren(false);
    }
    setShowEstimateModal(true);
  };

  const primaryCase = caseData?.case;
  const hasState = state && state !== "unknown";
  const isResearching = researchMutation.isPending;
  const isEstimating = estimateMutation.isPending;

  const formatResearchContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="font-heading font-bold text-xl text-neutral-darkest mt-4 mb-3">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="font-heading font-semibold text-lg text-neutral-darkest mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('- ')) {
        return <li key={idx} className="font-sans text-sm text-neutral-darkest/80 ml-4 mb-1">{line.replace('- ', '')}</li>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className="font-sans font-bold text-lg text-[#314143] mb-2">{line.replace(/\*\*/g, '')}</p>;
      }
      if (line.trim() === '') {
        return <br key={idx} />;
      }
      return <p key={idx} className="font-sans text-sm text-neutral-darkest/80 mb-2">{line}</p>;
    });
  };

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div className="w-12 h-12 rounded-lg bg-[hsl(var(--module-tile-icon))] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#314143]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                Child Support (Worksheet Helper)
              </h1>
              {primaryCase && (
                <p className="font-sans text-sm text-neutral-darkest/60 mt-1">
                  {primaryCase.title}
                </p>
              )}
            </div>
          </div>

          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans font-semibold text-blue-800 text-sm">Educational Tool</p>
              <p className="font-sans text-blue-700 text-sm mt-1">
                This tool helps you find your state's official worksheet and optionally get an educational estimate. 
                It is <strong>not court-accurate</strong>. Verify with your state's official calculator/worksheet.
              </p>
            </div>
          </div>

          <div className="w-full bg-white rounded-lg border border-[#1E2020] p-5 sm:p-6 mb-6">
            <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-[#314143]" />
              Select Your State
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState}>
                  <SelectTrigger data-testid="select-state" className="mt-1">
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unknown">I don't know yet</SelectItem>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasState && (
                  <p className="text-xs text-amber-600 mt-2">
                    Select a state to find the official worksheet/calculator.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  className="flex-1 bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A] border border-[#1E2020] min-h-[44px]"
                  onClick={handleResearch}
                  disabled={!hasState || isResearching}
                  data-testid="button-research-state"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Find My State's Official Worksheet
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#314143] text-[#314143]"
                  onClick={openEstimateModal}
                  disabled={!hasState || isEstimating}
                  data-testid="button-get-estimate"
                >
                  {isEstimating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Get an Educational Estimate
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-neutral-darkest/60">
                We'll save this research to this case so you can come back later.
              </p>
            </div>
          </div>

          {activeResult && (
            <div className="w-full bg-[hsl(var(--module-tile))] rounded-lg border border-[hsl(var(--module-tile-border))] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-heading font-bold text-lg text-[#1E2020] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#314143]" />
                  {activeResult.type === "estimate" 
                    ? (activeResult.didCompute ? "Educational Estimate" : "Worksheet Guidance")
                    : "Research Results"
                  }
                </h2>
                <div className="flex items-center gap-2">
                  {activeResult.type === "research" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshResearch}
                      disabled={isResearching}
                      className="text-xs"
                      data-testid="button-refresh-research"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isResearching ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  )}
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(state + ' child support calculator official')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#314143] hover:underline flex items-center gap-1"
                  >
                    Search online
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              <div className="bg-white/80 rounded-lg p-4">
                {formatResearchContent(activeResult.content)}
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={showEstimateModal} onOpenChange={setShowEstimateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#314143]" />
              Educational Estimate
            </DialogTitle>
            <DialogDescription>
              Enter your information below. We'll try to give you an educational estimate based on your state's guidelines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="font-sans text-xs text-amber-800">
                This is for educational purposes only. Results are not court-accurate and should not be relied upon for legal decisions.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Your Monthly Gross Income</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-neutral-darkest/60 h-6"
                  onClick={() => {
                    setUnknownParentA(!unknownParentA);
                    if (!unknownParentA) setEstParentAIncome("");
                  }}
                  data-testid="button-unknown-parent-a"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  {unknownParentA ? "I know this" : "I don't know"}
                </Button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  className="pl-7"
                  value={estParentAIncome}
                  onChange={(e) => setEstParentAIncome(e.target.value)}
                  placeholder={unknownParentA ? "Unknown" : "e.g., 5000"}
                  disabled={unknownParentA}
                  data-testid="input-est-parent-a"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Other Parent's Monthly Gross Income</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-neutral-darkest/60 h-6"
                  onClick={() => {
                    setUnknownParentB(!unknownParentB);
                    if (!unknownParentB) setEstParentBIncome("");
                  }}
                  data-testid="button-unknown-parent-b"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  {unknownParentB ? "I know this" : "I don't know"}
                </Button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  className="pl-7"
                  value={estParentBIncome}
                  onChange={(e) => setEstParentBIncome(e.target.value)}
                  placeholder={unknownParentB ? "Unknown" : "e.g., 4000"}
                  disabled={unknownParentB}
                  data-testid="input-est-parent-b"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Number of Children</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-neutral-darkest/60 h-6"
                  onClick={() => {
                    setUnknownChildren(!unknownChildren);
                    if (!unknownChildren) setEstChildren("");
                  }}
                  data-testid="button-unknown-children"
                >
                  <HelpCircle className="w-3 h-3 mr-1" />
                  {unknownChildren ? "I know this" : "I don't know"}
                </Button>
              </div>
              <Input
                type="number"
                min="1"
                max="10"
                value={estChildren}
                onChange={(e) => setEstChildren(e.target.value)}
                placeholder={unknownChildren ? "Unknown" : "e.g., 2"}
                disabled={unknownChildren}
                data-testid="input-est-children"
              />
              {childrenData?.children && childrenData.children.length > 0 && !unknownChildren && (
                <p className="text-xs text-neutral-darkest/60 mt-1">
                  Pre-filled from case: {childrenData.children.length}
                </p>
              )}
            </div>

            <div className="border-t border-neutral-darkest/10 pt-4">
              <p className="font-sans text-xs text-neutral-darkest/60 mb-3">Optional fields (may improve accuracy)</p>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm">Overnights per Year</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-neutral-darkest/60 h-6"
                      onClick={() => {
                        setUnknownOvernights(!unknownOvernights);
                        if (!unknownOvernights) setEstOvernights("");
                      }}
                      data-testid="button-unknown-overnights"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      {unknownOvernights ? "I know this" : "I don't know"}
                    </Button>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="365"
                    value={estOvernights}
                    onChange={(e) => setEstOvernights(e.target.value)}
                    placeholder={unknownOvernights ? "Unknown" : "e.g., 90"}
                    disabled={unknownOvernights}
                    data-testid="input-est-overnights"
                  />
                </div>

                <div>
                  <Label className="text-sm">Monthly Childcare Costs</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      className="pl-7"
                      value={estChildcare}
                      onChange={(e) => setEstChildcare(e.target.value)}
                      placeholder="Optional"
                      data-testid="input-est-childcare"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">Monthly Health Insurance for Child(ren)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      className="pl-7"
                      value={estHealthInsurance}
                      onChange={(e) => setEstHealthInsurance(e.target.value)}
                      placeholder="Optional"
                      data-testid="input-est-health"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEstimateModal(false)}
                data-testid="button-cancel-estimate"
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A]"
                onClick={handleEstimate}
                disabled={isEstimating}
                data-testid="button-submit-estimate"
              >
                {isEstimating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Get Estimate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
