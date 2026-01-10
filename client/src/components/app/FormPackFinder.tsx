import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, AlertTriangle, FileText, Scale, Building2, Info } from "lucide-react";

interface CourtFormLink {
  name: string;
  url: string;
  description: string;
}

interface StateFormDirectory {
  state: string;
  stateCode: string;
  judiciaryUrl: string;
  familyCourtUrl?: string;
  caseTypes: {
    custody: CourtFormLink[];
    divorce: CourtFormLink[];
    support: CourtFormLink[];
    general: CourtFormLink[];
  };
}

const STATE_FORM_DIRECTORIES: StateFormDirectory[] = [
  {
    state: "Alabama",
    stateCode: "AL",
    judiciaryUrl: "https://judicial.alabama.gov/",
    familyCourtUrl: "https://judicial.alabama.gov/Library/Forms",
    caseTypes: {
      custody: [
        { name: "Alabama Court Forms", url: "https://judicial.alabama.gov/Library/Forms", description: "Official Alabama court forms library" },
      ],
      divorce: [
        { name: "Alabama Court Forms", url: "https://judicial.alabama.gov/Library/Forms", description: "Official Alabama court forms library" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://judicial.alabama.gov/Library/Forms", description: "Child support calculation forms" },
      ],
      general: [
        { name: "Alabama Judiciary", url: "https://judicial.alabama.gov/", description: "Alabama state judiciary website" },
      ],
    },
  },
  {
    state: "Alaska",
    stateCode: "AK",
    judiciaryUrl: "https://courts.alaska.gov/",
    familyCourtUrl: "https://courts.alaska.gov/shc/family/",
    caseTypes: {
      custody: [
        { name: "Custody & Parenting Forms", url: "https://courts.alaska.gov/shc/family/shcparentingplan.htm", description: "Alaska parenting plan forms" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://courts.alaska.gov/shc/family/shcdivorce.htm", description: "Alaska divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://courts.alaska.gov/shc/family/shcchildsupport.htm", description: "Alaska child support forms" },
      ],
      general: [
        { name: "Alaska Court System", url: "https://courts.alaska.gov/", description: "Alaska state court system" },
      ],
    },
  },
  {
    state: "Arizona",
    stateCode: "AZ",
    judiciaryUrl: "https://www.azcourts.gov/",
    familyCourtUrl: "https://www.azcourts.gov/selfservicecenter/",
    caseTypes: {
      custody: [
        { name: "Family Court Self-Service", url: "https://www.azcourts.gov/selfservicecenter/", description: "Arizona self-service center for family law" },
      ],
      divorce: [
        { name: "Dissolution Forms", url: "https://www.azcourts.gov/selfservicecenter/", description: "Arizona divorce dissolution forms" },
      ],
      support: [
        { name: "Child Support Calculator", url: "https://www.azcourts.gov/familylaw/Child-Support-Calculator", description: "Arizona child support calculator" },
      ],
      general: [
        { name: "Arizona Courts", url: "https://www.azcourts.gov/", description: "Arizona state court system" },
      ],
    },
  },
  {
    state: "California",
    stateCode: "CA",
    judiciaryUrl: "https://www.courts.ca.gov/",
    familyCourtUrl: "https://www.courts.ca.gov/selfhelp-familylaw.htm",
    caseTypes: {
      custody: [
        { name: "Custody & Parenting Time", url: "https://www.courts.ca.gov/selfhelp-custody.htm", description: "California custody and visitation forms" },
        { name: "FL-300 Request for Order", url: "https://www.courts.ca.gov/documents/fl300.pdf", description: "Request for custody/support modification" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://www.courts.ca.gov/selfhelp-divorce.htm", description: "California divorce forms and instructions" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.courts.ca.gov/selfhelp-support.htm", description: "California child support forms" },
      ],
      general: [
        { name: "California Courts Self-Help", url: "https://www.courts.ca.gov/selfhelp.htm", description: "California courts self-help center" },
      ],
    },
  },
  {
    state: "Colorado",
    stateCode: "CO",
    judiciaryUrl: "https://www.courts.state.co.us/",
    familyCourtUrl: "https://www.courts.state.co.us/Self_Help/",
    caseTypes: {
      custody: [
        { name: "Parenting Plan Forms", url: "https://www.courts.state.co.us/Forms/SubCategory.cfm?Category=Parenting", description: "Colorado parenting plan forms" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://www.courts.state.co.us/Forms/SubCategory.cfm?Category=Divorce", description: "Colorado divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.courts.state.co.us/Forms/SubCategory.cfm?Category=Support", description: "Colorado child support forms" },
      ],
      general: [
        { name: "Colorado Judicial Branch", url: "https://www.courts.state.co.us/", description: "Colorado state courts" },
      ],
    },
  },
  {
    state: "Connecticut",
    stateCode: "CT",
    judiciaryUrl: "https://www.jud.ct.gov/",
    familyCourtUrl: "https://www.jud.ct.gov/webforms/",
    caseTypes: {
      custody: [
        { name: "Family Matters Forms", url: "https://www.jud.ct.gov/webforms/#Family", description: "Connecticut family court forms" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://www.jud.ct.gov/webforms/#Family", description: "Connecticut divorce forms" },
      ],
      support: [
        { name: "Support Forms", url: "https://www.jud.ct.gov/webforms/#Family", description: "Connecticut support forms" },
      ],
      general: [
        { name: "Connecticut Judicial Branch", url: "https://www.jud.ct.gov/", description: "Connecticut state courts" },
      ],
    },
  },
  {
    state: "Florida",
    stateCode: "FL",
    judiciaryUrl: "https://www.flcourts.org/",
    familyCourtUrl: "https://www.flcourts.org/Resources-Services/Court-Improvement/Family-Courts/Family-Law-Forms",
    caseTypes: {
      custody: [
        { name: "Parenting Plan Forms", url: "https://www.flcourts.org/Resources-Services/Court-Improvement/Family-Courts/Family-Law-Forms", description: "Florida parenting plan forms" },
      ],
      divorce: [
        { name: "Dissolution Forms", url: "https://www.flcourts.org/Resources-Services/Court-Improvement/Family-Courts/Family-Law-Forms", description: "Florida divorce dissolution forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.flcourts.org/Resources-Services/Court-Improvement/Family-Courts/Family-Law-Forms", description: "Florida child support forms" },
      ],
      general: [
        { name: "Florida Courts", url: "https://www.flcourts.org/", description: "Florida state courts" },
      ],
    },
  },
  {
    state: "Georgia",
    stateCode: "GA",
    judiciaryUrl: "https://georgiacourts.gov/",
    familyCourtUrl: "https://georgiacourts.gov/resources/court-forms/",
    caseTypes: {
      custody: [
        { name: "Family Law Forms", url: "https://georgiacourts.gov/resources/court-forms/", description: "Georgia family law forms" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://georgiacourts.gov/resources/court-forms/", description: "Georgia divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://georgiacourts.gov/resources/court-forms/", description: "Georgia child support forms" },
      ],
      general: [
        { name: "Georgia Courts", url: "https://georgiacourts.gov/", description: "Georgia state courts" },
      ],
    },
  },
  {
    state: "Illinois",
    stateCode: "IL",
    judiciaryUrl: "https://www.illinoiscourts.gov/",
    familyCourtUrl: "https://www.illinoiscourts.gov/forms/approved-forms/",
    caseTypes: {
      custody: [
        { name: "Allocation of Parental Responsibilities", url: "https://www.illinoiscourts.gov/forms/approved-forms/", description: "Illinois custody allocation forms" },
      ],
      divorce: [
        { name: "Dissolution of Marriage", url: "https://www.illinoiscourts.gov/forms/approved-forms/", description: "Illinois divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.illinoiscourts.gov/forms/approved-forms/", description: "Illinois child support forms" },
      ],
      general: [
        { name: "Illinois Courts", url: "https://www.illinoiscourts.gov/", description: "Illinois state courts" },
      ],
    },
  },
  {
    state: "New York",
    stateCode: "NY",
    judiciaryUrl: "https://www.nycourts.gov/",
    familyCourtUrl: "https://www.nycourts.gov/courthelp/Family/",
    caseTypes: {
      custody: [
        { name: "Custody & Visitation Forms", url: "https://www.nycourts.gov/courthelp/Family/custodyVisitation.shtml", description: "New York custody and visitation forms" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://www.nycourts.gov/courthelp/Family/divorce.shtml", description: "New York divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.nycourts.gov/courthelp/Family/childSupport.shtml", description: "New York child support forms" },
      ],
      general: [
        { name: "NYCourts.gov", url: "https://www.nycourts.gov/", description: "New York state courts" },
      ],
    },
  },
  {
    state: "Texas",
    stateCode: "TX",
    judiciaryUrl: "https://www.txcourts.gov/",
    familyCourtUrl: "https://www.texaslawhelp.org/",
    caseTypes: {
      custody: [
        { name: "SAPCR Forms", url: "https://www.texaslawhelp.org/legal-help/lawhelp-interactive-forms", description: "Suit Affecting Parent-Child Relationship forms" },
      ],
      divorce: [
        { name: "Divorce Forms", url: "https://www.texaslawhelp.org/legal-help/lawhelp-interactive-forms", description: "Texas divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.texaslawhelp.org/legal-help/lawhelp-interactive-forms", description: "Texas child support forms" },
      ],
      general: [
        { name: "Texas Courts", url: "https://www.txcourts.gov/", description: "Texas state courts" },
        { name: "TexasLawHelp.org", url: "https://www.texaslawhelp.org/", description: "Texas legal self-help resources" },
      ],
    },
  },
  {
    state: "Washington",
    stateCode: "WA",
    judiciaryUrl: "https://www.courts.wa.gov/",
    familyCourtUrl: "https://www.courts.wa.gov/forms/",
    caseTypes: {
      custody: [
        { name: "Parenting Plan Forms", url: "https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=20", description: "Washington parenting plan forms" },
      ],
      divorce: [
        { name: "Dissolution Forms", url: "https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=15", description: "Washington divorce forms" },
      ],
      support: [
        { name: "Child Support Forms", url: "https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=16", description: "Washington child support forms" },
      ],
      general: [
        { name: "Washington Courts", url: "https://www.courts.wa.gov/", description: "Washington state courts" },
      ],
    },
  },
];

const ALL_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
  "Wisconsin", "Wyoming", "District of Columbia"
];

const CASE_TYPE_LABELS: Record<string, { label: string; icon: typeof Scale }> = {
  custody: { label: "Custody & Parenting Time", icon: Scale },
  divorce: { label: "Divorce / Dissolution", icon: FileText },
  support: { label: "Child Support", icon: Building2 },
  general: { label: "General Court Resources", icon: Building2 },
};

export default function FormPackFinder() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCaseType, setSelectedCaseType] = useState<string>("custody");

  const stateDirectory = STATE_FORM_DIRECTORIES.find(s => s.state === selectedState);

  const getGenericStateLink = (stateName: string) => {
    const searchQuery = encodeURIComponent(`${stateName} state court family law forms official`);
    return `https://www.google.com/search?q=${searchQuery}`;
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">Official Court Forms (External)</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Find official court forms from your state's judiciary website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-xs text-amber-800">
            These forms are provided by the court. Civilla does not control their content, accuracy, or availability. 
            Always verify forms are current before filing.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium">State</label>
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger data-testid="select-state">
                <SelectValue placeholder="Select your state..." />
              </SelectTrigger>
              <SelectContent>
                <ScrollArea className="h-64">
                  {ALL_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </ScrollArea>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium">Case Type</label>
            <Select value={selectedCaseType} onValueChange={setSelectedCaseType}>
              <SelectTrigger data-testid="select-case-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CASE_TYPE_LABELS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedState && (
          <div className="space-y-3 pt-2">
            {stateDirectory ? (
              <>
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stateDirectory.state} Court Resources</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {stateDirectory.stateCode}
                  </Badge>
                </div>

                <ScrollArea className="max-h-48">
                  <div className="space-y-2">
                    {stateDirectory.caseTypes[selectedCaseType as keyof typeof stateDirectory.caseTypes]?.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg border hover-elevate transition-all group"
                        data-testid={`link-form-${idx}`}
                      >
                        <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium group-hover:text-primary transition-colors">
                              {link.name}
                            </span>
                            <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {link.description}
                          </p>
                        </div>
                      </a>
                    ))}

                    <a
                      href={stateDirectory.judiciaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Building2 className="w-3 h-3" />
                      Visit {stateDirectory.state} Judiciary Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm">
                      We don't have specific form links for {selectedState} yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the search link below to find official court forms.
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(getGenericStateLink(selectedState), "_blank")}
                  data-testid="button-search-forms"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Search for {selectedState} Court Forms
                </Button>
              </div>
            )}
          </div>
        )}

        {!selectedState && (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Select your state to find official court forms
          </div>
        )}
      </CardContent>
    </Card>
  );
}
