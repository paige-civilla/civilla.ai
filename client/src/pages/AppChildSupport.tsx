import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Calculator, DollarSign, Users, Calendar, Info, HelpCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [showEstimate, setShowEstimate] = useState(false);

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

  const handleClearField = (setter: (val: string) => void) => {
    setter("unknown");
  };

  const canEstimate = state && numberOfChildren && numberOfChildren !== "unknown" && 
    parentAIncome && parentAIncome !== "unknown" && 
    parentBIncome && parentBIncome !== "unknown";

  const handleCalculate = () => {
    if (canEstimate) {
      setShowEstimate(true);
    }
  };

  const primaryCase = caseData?.case;

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div className="w-12 h-12 rounded-lg bg-[#A2BEC2] flex items-center justify-center flex-shrink-0">
              <Calculator className="w-6 h-6 text-[#314143]" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-bold text-xl sm:text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                Child Support Estimator
              </h1>
              {primaryCase && (
                <p className="font-sans text-sm text-neutral-darkest/60 mt-1">
                  {primaryCase.title}
                </p>
              )}
            </div>
          </div>

          <div className="w-full bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans font-semibold text-amber-800 text-sm">Educational Estimate Only</p>
              <p className="font-sans text-amber-700 text-sm mt-1">
                This tool provides a rough educational estimate. It is <strong>not court-accurate</strong>. 
                Courts and formulas vary by state and case. For a court-accurate amount, consult an attorney 
                or use your state's official calculator.
              </p>
            </div>
          </div>

          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-lg border border-[#1E2020] p-5 sm:p-6">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#314143]" />
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="state">State</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-neutral-darkest/60 h-6"
                      onClick={() => handleClearField(setState)}
                      data-testid="button-unknown-state"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      I don't know yet
                    </Button>
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
                </div>

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
                    <Label htmlFor="overnights">Overnights per Year (or % parenting time)</Label>
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
                  <p className="text-xs text-neutral-darkest/60 mt-1">
                    Optional. Some states use overnights to calculate support.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-[#1E2020] p-5 sm:p-6">
              <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#314143]" />
                Income Information
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="parentAIncome">Parent A Monthly Gross Income</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-neutral-darkest/60 h-6"
                      onClick={() => handleClearField(setParentAIncome)}
                      data-testid="button-unknown-parent-a"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      I don't know yet
                    </Button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                    <Input
                      id="parentAIncome"
                      type="number"
                      min="0"
                      step="100"
                      className="pl-7"
                      value={parentAIncome === "unknown" ? "" : parentAIncome}
                      onChange={(e) => setParentAIncome(e.target.value)}
                      placeholder={parentAIncome === "unknown" ? "Unknown" : "Enter monthly income"}
                      disabled={parentAIncome === "unknown"}
                      data-testid="input-parent-a-income"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="parentBIncome">Parent B Monthly Gross Income</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-neutral-darkest/60 h-6"
                      onClick={() => handleClearField(setParentBIncome)}
                      data-testid="button-unknown-parent-b"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      I don't know yet
                    </Button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-darkest/60">$</span>
                    <Input
                      id="parentBIncome"
                      type="number"
                      min="0"
                      step="100"
                      className="pl-7"
                      value={parentBIncome === "unknown" ? "" : parentBIncome}
                      onChange={(e) => setParentBIncome(e.target.value)}
                      placeholder={parentBIncome === "unknown" ? "Unknown" : "Enter monthly income"}
                      disabled={parentBIncome === "unknown"}
                      data-testid="input-parent-b-income"
                    />
                  </div>
                </div>

                <div className="border-t border-neutral-darkest/10 pt-4 mt-4">
                  <p className="font-sans font-medium text-sm text-neutral-darkest/70 mb-3">Optional Expenses</p>
                  
                  <div className="space-y-3">
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

          <div className="w-full mt-6">
            <Button
              className="w-full sm:w-auto bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A] border border-[#1E2020] min-h-[44px]"
              onClick={handleCalculate}
              disabled={!canEstimate}
              data-testid="button-calculate-estimate"
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculate Estimate
            </Button>
            {!canEstimate && (
              <p className="text-xs text-neutral-darkest/60 mt-2">
                Please fill in at least the state, number of children, and both parents' incomes.
              </p>
            )}
          </div>

          {showEstimate && (
            <div className="w-full mt-6 bg-[#A2BEC2] rounded-lg border border-[#1E2020] p-5 sm:p-6">
              <h2 className="font-heading font-bold text-lg text-[#1E2020] mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#314143]" />
                Estimated Range
              </h2>
              
              <div className="bg-white/80 rounded-lg p-4 mb-4">
                <p className="font-sans text-sm text-[#1E2020]/70 mb-2">Based on your inputs:</p>
                <p className="font-heading font-bold text-2xl sm:text-3xl text-[#314143]">
                  $XXX - $XXX / month
                </p>
                <p className="font-sans text-xs text-[#1E2020]/60 mt-2">
                  (Placeholder - actual formula not yet implemented)
                </p>
              </div>

              <div className="bg-white/60 rounded-lg p-4">
                <h3 className="font-heading font-semibold text-[#1E2020] mb-2">Next Steps</h3>
                <ul className="font-sans text-sm text-[#1E2020]/80 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-[#314143] font-bold">1.</span>
                    Use your state's official child support calculator for an accurate estimate.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#314143] font-bold">2.</span>
                    Consult with a family law attorney to understand how support is calculated in your case.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#314143] font-bold">3.</span>
                    Gather documentation of income, childcare costs, and health insurance premiums.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="w-full mt-8 p-4 bg-neutral-darkest/5 rounded-lg border border-neutral-darkest/10">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-neutral-darkest/60 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-sans font-medium text-sm text-neutral-darkest/80">Reminder</p>
                <p className="font-sans text-sm text-neutral-darkest/60 mt-1">
                  This is an <em>educational tool only</em>. Child support calculations vary significantly by state 
                  and individual circumstances. Always verify with official state calculators and legal professionals 
                  before making decisions based on these estimates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
