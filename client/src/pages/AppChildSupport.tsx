import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, DollarSign, Info, HelpCircle, RefreshCw, Loader2, Search, ExternalLink } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [numberOfChildren, setNumberOfChildren] = useState("");
  const [overnights, setOvernights] = useState("");
  const [parentAIncome, setParentAIncome] = useState("");
  const [parentBIncome, setParentBIncome] = useState("");
  const [childcare, setChildcare] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");

  useEffect(() => {
    if (caseData?.case?.state) {
      setState(caseData.case.state);
    }
  }, [caseData]);

  useEffect(() => {
    if (childrenData?.children) {
      setNumberOfChildren(String(childrenData.children.length));
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

  const researchMutation = useMutation({
    mutationFn: async ({ refresh }: { refresh?: boolean }) => {
      const response = await apiRequest("POST", `/api/cases/${caseId}/child-support/research`, {
        state,
        refresh,
      });
      return response.json() as Promise<ResearchResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "child-support", "research", state] });
    },
  });

  const handleClearField = (setter: (val: string) => void) => {
    setter("unknown");
  };

  const handleResearch = () => {
    researchMutation.mutate({ refresh: false });
  };

  const handleRefreshResearch = () => {
    researchMutation.mutate({ refresh: true });
  };

  const primaryCase = caseData?.case;
  const hasState = state && state !== "unknown";
  const researchContent = researchMutation.data?.content || cachedResearch?.content;
  const isCached = researchMutation.data?.cached ?? cachedResearch?.cached;
  const isResearching = researchMutation.isPending;

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
            <div className="w-12 h-12 rounded-lg bg-[#A2BEC2] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-[#314143]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                Child Support Research
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
              <p className="font-sans font-semibold text-blue-800 text-sm">Educational Research Helper</p>
              <p className="font-sans text-blue-700 text-sm mt-1">
                This tool helps you research your state's child support worksheet and official resources. 
                It does <strong>not</strong> calculate court amounts. Use your state's official calculator for accurate figures.
              </p>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-lg border border-[#1E2020] p-5 sm:p-6">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-[#314143]" />
                Find Your State's Worksheet
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="state">State</Label>
                  </div>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger data-testid="select-state">
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

                <div className="pt-2">
                  <Button
                    className="w-full bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A] border border-[#1E2020] min-h-[44px]"
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
                        Find My State's Worksheet
                      </>
                    )}
                  </Button>
                </div>

                {researchContent && (
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshResearch}
                      disabled={isResearching}
                      className="text-xs"
                      data-testid="button-refresh-research"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 ${isResearching ? 'animate-spin' : ''}`} />
                      Refresh Research
                    </Button>
                    {isCached && (
                      <span className="text-xs text-neutral-darkest/50 ml-2">
                        (cached result)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#1E2020] p-5 sm:p-6">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#314143]" />
                Your Case Details
              </h2>
              <p className="font-sans text-xs text-neutral-darkest/60 mb-4">
                Optional — these help you understand which worksheet fields apply to your situation.
              </p>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="numberOfChildren">Number of Children</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-neutral-darkest/60 h-6"
                      onClick={() => handleClearField(setNumberOfChildren)}
                      data-testid="button-unknown-children"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      I don't know yet
                    </Button>
                  </div>
                  <Input
                    id="numberOfChildren"
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfChildren === "unknown" ? "" : numberOfChildren}
                    onChange={(e) => setNumberOfChildren(e.target.value)}
                    placeholder={numberOfChildren === "unknown" ? "Unknown" : "Enter number of children"}
                    disabled={numberOfChildren === "unknown"}
                    data-testid="input-number-children"
                  />
                  {childrenData?.children && childrenData.children.length > 0 && (
                    <p className="text-xs text-neutral-darkest/60 mt-1">
                      Pre-filled from case: {childrenData.children.length} {childrenData.children.length === 1 ? "child" : "children"}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="overnights">Overnights per Year</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-neutral-darkest/60 h-6"
                      onClick={() => handleClearField(setOvernights)}
                      data-testid="button-unknown-overnights"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      I don't know yet
                    </Button>
                  </div>
                  <Input
                    id="overnights"
                    type="number"
                    min="0"
                    max="365"
                    value={overnights === "unknown" ? "" : overnights}
                    onChange={(e) => setOvernights(e.target.value)}
                    placeholder={overnights === "unknown" ? "Unknown" : "e.g., 182 overnights"}
                    disabled={overnights === "unknown"}
                    data-testid="input-overnights"
                  />
                </div>

                <div className="border-t border-neutral-darkest/10 pt-4 mt-4">
                  <p className="font-sans font-medium text-sm text-neutral-darkest/70 mb-3">Income (for your reference)</p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="parentAIncome">Your Monthly Gross Income</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                        <Input
                          id="parentAIncome"
                          type="number"
                          min="0"
                          step="100"
                          className="pl-7"
                          value={parentAIncome}
                          onChange={(e) => setParentAIncome(e.target.value)}
                          placeholder="Optional"
                          data-testid="input-parent-a-income"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="parentBIncome">Other Parent's Monthly Gross Income</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                        <Input
                          id="parentBIncome"
                          type="number"
                          min="0"
                          step="100"
                          className="pl-7"
                          value={parentBIncome}
                          onChange={(e) => setParentBIncome(e.target.value)}
                          placeholder="Optional"
                          data-testid="input-parent-b-income"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="childcare">Childcare per Month</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                        <Input
                          id="childcare"
                          type="number"
                          min="0"
                          step="50"
                          className="pl-7"
                          value={childcare}
                          onChange={(e) => setChildcare(e.target.value)}
                          placeholder="Optional"
                          data-testid="input-childcare"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="healthInsurance">Health Insurance per Month</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                        <Input
                          id="healthInsurance"
                          type="number"
                          min="0"
                          step="50"
                          className="pl-7"
                          value={healthInsurance}
                          onChange={(e) => setHealthInsurance(e.target.value)}
                          placeholder="Optional"
                          data-testid="input-health-insurance"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {researchContent && (
            <div className="w-full mt-6 bg-[#EFF3F4] rounded-lg border border-[#4F6A6E] p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-bold text-lg text-[#1E2020] flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#314143]" />
                  Research Results
                </h2>
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
              
              <div className="bg-white/80 rounded-lg p-4">
                {formatResearchContent(researchContent)}
              </div>
            </div>
          )}

          <div className="w-full mt-8 p-4 bg-neutral-darkest/5 rounded-lg border border-neutral-darkest/10">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-neutral-darkest/60 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans font-medium text-sm text-neutral-darkest/80">Remember</p>
                <p className="font-sans text-sm text-neutral-darkest/60 mt-1">
                  This is an <em>educational research tool only</em>. civilla does not provide legal advice or representation. 
                  Child support calculations vary significantly by state and individual circumstances. 
                  For court-accurate amounts, use your state's official calculator and consult with a family law attorney.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
