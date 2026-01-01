import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollablePolicyModal } from "@/components/onboarding/ScrollablePolicyModal";
import { NotSureButton } from "@/components/onboarding/NotSureButton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  User, 
  MapPin, 
  Briefcase, 
  Users, 
  FileText,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/Footer";

const STEPS = [
  { id: 1, title: "Your Information", icon: User },
  { id: 2, title: "Your Address", icon: MapPin },
  { id: 3, title: "Case Details", icon: Briefcase },
  { id: 4, title: "Children", icon: Users },
  { id: 5, title: "Agreements", icon: FileText },
];

interface Child {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  notes: string;
}

interface OnboardingData {
  profile: {
    fullName: string;
    email: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    zip: string;
    partyRole: string;
    isSelfRepresented: boolean;
    barNumber: string;
    firmName: string;
    petitionerName: string;
    respondentName: string;
  };
  case: {
    title: string;
    state: string;
    county: string;
    caseNumber: string;
    caseType: string;
    hasChildren: boolean;
  };
  children: Child[];
  agreements: {
    tosAccepted: boolean;
    privacyAccepted: boolean;
    notLawFirmAccepted: boolean;
    responsibilityAccepted: boolean;
    scrolledTos: boolean;
    scrolledPrivacy: boolean;
    scrolledNotLawFirm: boolean;
    scrolledResponsibility: boolean;
  };
}

const initialData: OnboardingData = {
  profile: {
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
    partyRole: "petitioner",
    isSelfRepresented: true,
    barNumber: "",
    firmName: "",
    petitionerName: "",
    respondentName: "",
  },
  case: {
    title: "",
    state: "",
    county: "",
    caseNumber: "",
    caseType: "family",
    hasChildren: false,
  },
  children: [],
  agreements: {
    tosAccepted: false,
    privacyAccepted: false,
    notLawFirmAccepted: false,
    responsibilityAccepted: false,
    scrolledTos: false,
    scrolledPrivacy: false,
    scrolledNotLawFirm: false,
    scrolledResponsibility: false,
  },
};

const DEFERRABLE_FIELDS = [
  "phone",
  "addressLine2",
  "city",
  "state",
  "zip",
  "caseNumber",
  "firmName",
  "barNumber",
] as const;

export default function AppOnboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [policyModal, setPolicyModal] = useState<string | null>(null);
  const [deferredFields, setDeferredFields] = useState<Record<string, boolean>>({});

  const { data: authData, isLoading: authLoading, isError: authError } = useQuery<{ user: { id: string; email: string } }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: policiesData } = useQuery<{
    tosText: string;
    privacyText: string;
    notLawFirmText: string;
    responsibilityText: string;
    versions: { tos: string; privacy: string; disclaimers: string };
  }>({
    queryKey: ["/api/onboarding/policies"],
    enabled: !!authData?.user,
  });

  const completeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("POST", "/api/onboarding/complete", payload);
      return res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      setLocation(`/app/dashboard/${result.caseId}`);
    },
    onError: (err: any) => {
      setErrors({ submit: err.message || "Failed to complete onboarding" });
    },
  });

  useEffect(() => {
    if (!authLoading && (authError || !authData?.user)) {
      setLocation("/login");
    }
  }, [authLoading, authError, authData, setLocation]);

  useEffect(() => {
    if (authData?.user?.email) {
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, email: authData.user.email }
      }));
    }
  }, [authData?.user?.email]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authData?.user) return null;

  const updateProfile = (field: keyof OnboardingData["profile"], value: string | boolean) => {
    setData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
    setErrors(prev => ({ ...prev, [field]: "" }));
    if (deferredFields[field]) {
      setDeferredFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const updateCase = (field: keyof OnboardingData["case"], value: string | boolean) => {
    setData(prev => ({
      ...prev,
      case: { ...prev.case, [field]: value }
    }));
    setErrors(prev => ({ ...prev, [field]: "" }));
    if (deferredFields[field]) {
      setDeferredFields(prev => ({ ...prev, [field]: false }));
    }
  };

  const deferField = (field: string, isProfileField: boolean = true) => {
    setDeferredFields(prev => ({ ...prev, [field]: true }));
    if (isProfileField) {
      setData(prev => ({
        ...prev,
        profile: { ...prev.profile, [field]: "" }
      }));
    } else {
      setData(prev => ({
        ...prev,
        case: { ...prev.case, [field]: "" }
      }));
    }
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const hasDeferredFieldsInStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      return !!(deferredFields.phone || deferredFields.firmName || deferredFields.barNumber);
    }
    if (stepNum === 2) {
      return !!(deferredFields.addressLine2 || deferredFields.city || deferredFields.state || deferredFields.zip);
    }
    if (stepNum === 3) {
      return !!deferredFields.caseNumber;
    }
    return false;
  };

  const updateAgreement = (field: keyof OnboardingData["agreements"], value: boolean) => {
    setData(prev => ({
      ...prev,
      agreements: { ...prev.agreements, [field]: value }
    }));
  };

  const addChild = () => {
    setData(prev => ({
      ...prev,
      children: [...prev.children, { firstName: "", lastName: "", dateOfBirth: "", notes: "" }]
    }));
  };

  const removeChild = (index: number) => {
    setData(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index: number, field: keyof Child, value: string) => {
    setData(prev => ({
      ...prev,
      children: prev.children.map((child, i) => 
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!data.profile.fullName.trim()) newErrors.fullName = "Full name is required";
      if (!data.profile.partyRole) newErrors.partyRole = "Party role is required";
    }

    if (currentStep === 2) {
      if (!data.profile.addressLine1.trim()) newErrors.addressLine1 = "Address is required";
    }

    if (currentStep === 3) {
      if (!data.case.title.trim()) newErrors.title = "Case title is required";
      if (!data.case.state.trim()) newErrors.caseState = "State is required";
      if (!data.case.county.trim()) newErrors.county = "County is required";
      if (!data.case.caseNumber.trim() && !deferredFields.caseNumber) newErrors.caseNumber = "Case number is required";
      if (!data.profile.petitionerName.trim()) newErrors.petitionerName = "Petitioner name is required";
      if (!data.profile.respondentName.trim()) newErrors.respondentName = "Respondent name is required";
    }

    if (currentStep === 4 && data.case.hasChildren) {
      if (data.children.length === 0) {
        newErrors.children = "Please add at least one child";
      }
      data.children.forEach((child, idx) => {
        if (!child.firstName.trim()) newErrors[`child_${idx}_firstName`] = "First name required";
        if (!child.dateOfBirth) newErrors[`child_${idx}_dob`] = "Date of birth required";
      });
    }

    if (currentStep === 5) {
      if (!data.agreements.scrolledTos) newErrors.scrolledTos = "Please read Terms of Service";
      if (!data.agreements.scrolledPrivacy) newErrors.scrolledPrivacy = "Please read Privacy Policy";
      if (!data.agreements.scrolledNotLawFirm) newErrors.scrolledNotLawFirm = "Please read Not a Law Firm disclosure";
      if (!data.agreements.scrolledResponsibility) newErrors.scrolledResponsibility = "Please read User Responsibility";
      if (!data.agreements.tosAccepted) newErrors.tosAccepted = "You must agree to Terms of Service";
      if (!data.agreements.privacyAccepted) newErrors.privacyAccepted = "You must agree to Privacy Policy";
      if (!data.agreements.notLawFirmAccepted) newErrors.notLawFirmAccepted = "You must acknowledge Not a Law Firm disclosure";
      if (!data.agreements.responsibilityAccepted) newErrors.responsibilityAccepted = "You must acknowledge User Responsibility";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const canProceed = (): boolean => {
    if (step === 1) {
      return !!data.profile.fullName.trim() && !!data.profile.partyRole;
    }
    if (step === 2) {
      return !!data.profile.addressLine1.trim();
    }
    if (step === 3) {
      const caseNumberOk = !!data.case.caseNumber.trim() || deferredFields.caseNumber;
      return !!data.case.title.trim() && !!data.case.state.trim() && 
             !!data.case.county.trim() && caseNumberOk &&
             !!data.profile.petitionerName.trim() && !!data.profile.respondentName.trim();
    }
    if (step === 4) {
      if (!data.case.hasChildren) return true;
      if (data.children.length === 0) return false;
      return data.children.every(c => c.firstName.trim() && c.dateOfBirth);
    }
    if (step === 5) {
      return data.agreements.tosAccepted && data.agreements.privacyAccepted &&
             data.agreements.notLawFirmAccepted && data.agreements.responsibilityAccepted &&
             data.agreements.scrolledTos && data.agreements.scrolledPrivacy &&
             data.agreements.scrolledNotLawFirm && data.agreements.scrolledResponsibility;
    }
    return true;
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    
    if (step === 3 && !data.case.hasChildren) {
      setStep(5);
    } else if (step < 5) {
      setStep(step + 1);
    }
    scrollToTop();
  };

  const handleBack = () => {
    if (step === 5 && !data.case.hasChildren) {
      setStep(3);
    } else if (step > 1) {
      setStep(step - 1);
    }
    scrollToTop();
  };

  const handleSubmit = () => {
    if (!validateStep(5)) return;
    if (!policiesData?.versions) return;

    completeMutation.mutate({
      profile: data.profile,
      case: data.case,
      children: data.case.hasChildren ? data.children : [],
      agreements: data.agreements,
      versions: policiesData.versions,
      deferredFields,
    });
  };

  const getDisplaySteps = () => {
    if (data.case.hasChildren) {
      return STEPS;
    }
    return STEPS.filter(s => s.id !== 4);
  };

  const displaySteps = getDisplaySteps();

  return (
    <div className="flex flex-col min-h-screen bg-cream text-neutral-darkest">
      <AppNavbar />
      <main className="flex-1 w-full">
        <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
          <div className="flex flex-col items-start max-w-2xl w-full">
            <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest mb-2">
              Welcome to <span className="italic">civilla</span>
            </h1>
            <p className="font-sans text-base text-neutral-darkest/70 mb-8">
              Let's get your account set up. This will only take a few minutes.
            </p>

            <div className="w-full mb-8">
              <div className="flex items-center justify-between gap-2">
                {displaySteps.map((s, idx) => {
                  const isActive = s.id === step;
                  const isComplete = s.id < step || (s.id === 4 && step === 5 && !data.case.hasChildren);
                  const Icon = s.icon;
                  
                  return (
                    <div key={s.id} className="flex-1 flex flex-col items-center">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors
                        ${isComplete ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-neutral-darkest/10 text-neutral-darkest/40'}
                      `}>
                        {isComplete ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      <span className={`text-xs font-medium text-center ${isActive ? 'text-primary' : 'text-neutral-darkest/60'}`}>
                        {s.title}
                      </span>
                      {idx < displaySteps.length - 1 && (
                        <div className="hidden" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full bg-white border border-neutral-darkest/10 rounded-lg p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Your Information</h2>
                  {hasDeferredFieldsInStep(1) && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-neutral-darkest">
                      <Info className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Some info was skipped. You can finish later in Account Settings.</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="fullName">Full Legal Name *</Label>
                      <Input
                        id="fullName"
                        value={data.profile.fullName}
                        onChange={e => updateProfile("fullName", e.target.value)}
                        placeholder="Enter your full legal name"
                        className={errors.fullName ? "border-destructive" : ""}
                        data-testid="input-full-name"
                      />
                      {errors.fullName && <p className="text-sm text-destructive mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={data.profile.email}
                        onChange={e => updateProfile("email", e.target.value)}
                        placeholder="your@email.com"
                        data-testid="input-email"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={data.profile.phone}
                        onChange={e => updateProfile("phone", e.target.value)}
                        placeholder="(555) 555-5555"
                        disabled={deferredFields.phone}
                        data-testid="input-phone"
                      />
                      <NotSureButton 
                        onClick={() => deferField("phone")} 
                        isDeferred={deferredFields.phone}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Your Role in the Case *</Label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="partyRole"
                            value="petitioner"
                            checked={data.profile.partyRole === "petitioner"}
                            onChange={e => updateProfile("partyRole", e.target.value)}
                            className="accent-bush"
                            data-testid="radio-petitioner"
                          />
                          <span className="text-sm">Petitioner</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="partyRole"
                            value="respondent"
                            checked={data.profile.partyRole === "respondent"}
                            onChange={e => updateProfile("partyRole", e.target.value)}
                            className="accent-bush"
                            data-testid="radio-respondent"
                          />
                          <span className="text-sm">Respondent</span>
                        </label>
                      </div>
                      {errors.partyRole && <p className="text-sm text-destructive mt-1">{errors.partyRole}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="selfRepresented"
                          checked={data.profile.isSelfRepresented}
                          onCheckedChange={(checked) => updateProfile("isSelfRepresented", !!checked)}
                          data-testid="checkbox-self-represented"
                        />
                        <Label htmlFor="selfRepresented" className="cursor-pointer">
                          I am representing myself (Pro Se / Pro Per)
                        </Label>
                      </div>
                    </div>

                    {!data.profile.isSelfRepresented && (
                      <>
                        <div>
                          <Label htmlFor="firmName">Law Firm Name</Label>
                          <Input
                            id="firmName"
                            value={data.profile.firmName}
                            onChange={e => updateProfile("firmName", e.target.value)}
                            placeholder="Firm name"
                            disabled={deferredFields.firmName}
                            data-testid="input-firm-name"
                          />
                          <NotSureButton 
                            onClick={() => deferField("firmName")} 
                            isDeferred={deferredFields.firmName}
                          />
                        </div>
                        <div>
                          <Label htmlFor="barNumber">Bar Number</Label>
                          <Input
                            id="barNumber"
                            value={data.profile.barNumber}
                            onChange={e => updateProfile("barNumber", e.target.value)}
                            placeholder="Bar number"
                            disabled={deferredFields.barNumber}
                            data-testid="input-bar-number"
                          />
                          <NotSureButton 
                            onClick={() => deferField("barNumber")} 
                            isDeferred={deferredFields.barNumber}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Your Address</h2>
                  {hasDeferredFieldsInStep(2) && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-neutral-darkest">
                      <Info className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Some info was skipped. You can finish later in Account Settings.</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine1">Street Address *</Label>
                      <Input
                        id="addressLine1"
                        value={data.profile.addressLine1}
                        onChange={e => updateProfile("addressLine1", e.target.value)}
                        placeholder="123 Main Street"
                        className={errors.addressLine1 ? "border-destructive" : ""}
                        data-testid="input-address-line1"
                      />
                      {errors.addressLine1 && <p className="text-sm text-destructive mt-1">{errors.addressLine1}</p>}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine2">Apt, Suite, Unit (Optional)</Label>
                      <Input
                        id="addressLine2"
                        value={data.profile.addressLine2}
                        onChange={e => updateProfile("addressLine2", e.target.value)}
                        placeholder="Apt 4B"
                        disabled={deferredFields.addressLine2}
                        data-testid="input-address-line2"
                      />
                      <NotSureButton 
                        label="Don't have this"
                        onClick={() => deferField("addressLine2")} 
                        isDeferred={deferredFields.addressLine2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={data.profile.city}
                        onChange={e => updateProfile("city", e.target.value)}
                        placeholder="City"
                        disabled={deferredFields.city}
                        data-testid="input-city"
                      />
                      <NotSureButton 
                        onClick={() => deferField("city")} 
                        isDeferred={deferredFields.city}
                      />
                    </div>

                    <div>
                      <Label htmlFor="profileState">State</Label>
                      <Input
                        id="profileState"
                        value={data.profile.state}
                        onChange={e => updateProfile("state", e.target.value)}
                        placeholder="State"
                        disabled={deferredFields.state}
                        data-testid="input-profile-state"
                      />
                      <NotSureButton 
                        onClick={() => deferField("state")} 
                        isDeferred={deferredFields.state}
                      />
                    </div>

                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={data.profile.zip}
                        onChange={e => updateProfile("zip", e.target.value)}
                        placeholder="12345"
                        disabled={deferredFields.zip}
                        data-testid="input-zip"
                      />
                      <NotSureButton 
                        onClick={() => deferField("zip")} 
                        isDeferred={deferredFields.zip}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Case Details</h2>
                  {hasDeferredFieldsInStep(3) && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm text-neutral-darkest">
                      <Info className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Some info was skipped. You can finish later in Account Settings.</span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="caseTitle">Case Title *</Label>
                      <Input
                        id="caseTitle"
                        value={data.case.title}
                        onChange={e => updateCase("title", e.target.value)}
                        placeholder="e.g., Smith v. Smith"
                        className={errors.title ? "border-destructive" : ""}
                        data-testid="input-case-title"
                      />
                      {errors.title && <p className="text-sm text-destructive mt-1">{errors.title}</p>}
                    </div>

                    <div>
                      <Label htmlFor="caseState">State *</Label>
                      <Input
                        id="caseState"
                        value={data.case.state}
                        onChange={e => updateCase("state", e.target.value)}
                        placeholder="e.g., Idaho"
                        className={errors.caseState ? "border-destructive" : ""}
                        data-testid="input-case-state"
                      />
                      {errors.caseState && <p className="text-sm text-destructive mt-1">{errors.caseState}</p>}
                    </div>

                    <div>
                      <Label htmlFor="county">County *</Label>
                      <Input
                        id="county"
                        value={data.case.county}
                        onChange={e => updateCase("county", e.target.value)}
                        placeholder="e.g., Bonneville"
                        className={errors.county ? "border-destructive" : ""}
                        data-testid="input-county"
                      />
                      {errors.county && <p className="text-sm text-destructive mt-1">{errors.county}</p>}
                    </div>

                    <div>
                      <Label htmlFor="caseNumber">Case Number {deferredFields.caseNumber ? "" : "*"}</Label>
                      <Input
                        id="caseNumber"
                        value={data.case.caseNumber}
                        onChange={e => updateCase("caseNumber", e.target.value)}
                        placeholder="e.g., CV-2024-12345"
                        className={errors.caseNumber ? "border-destructive" : ""}
                        disabled={deferredFields.caseNumber}
                        data-testid="input-case-number"
                      />
                      {errors.caseNumber && <p className="text-sm text-destructive mt-1">{errors.caseNumber}</p>}
                      <NotSureButton 
                        onClick={() => deferField("caseNumber", false)} 
                        isDeferred={deferredFields.caseNumber}
                      />
                    </div>

                    <div>
                      <Label htmlFor="caseType">Case Type</Label>
                      <select
                        id="caseType"
                        value={data.case.caseType}
                        onChange={e => updateCase("caseType", e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        data-testid="select-case-type"
                      >
                        <option value="family">Family Law</option>
                        <option value="divorce">Divorce</option>
                        <option value="custody">Custody</option>
                        <option value="support">Child Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="font-heading font-bold text-lg text-neutral-darkest mb-4">Parties</h3>
                    </div>

                    <div>
                      <Label htmlFor="petitionerName">Petitioner Name *</Label>
                      <Input
                        id="petitionerName"
                        value={data.profile.petitionerName}
                        onChange={e => updateProfile("petitionerName", e.target.value)}
                        placeholder="Full legal name"
                        className={errors.petitionerName ? "border-destructive" : ""}
                        data-testid="input-petitioner-name"
                      />
                      {errors.petitionerName && <p className="text-sm text-destructive mt-1">{errors.petitionerName}</p>}
                    </div>

                    <div>
                      <Label htmlFor="respondentName">Respondent Name *</Label>
                      <Input
                        id="respondentName"
                        value={data.profile.respondentName}
                        onChange={e => updateProfile("respondentName", e.target.value)}
                        placeholder="Full legal name"
                        className={errors.respondentName ? "border-destructive" : ""}
                        data-testid="input-respondent-name"
                      />
                      {errors.respondentName && <p className="text-sm text-destructive mt-1">{errors.respondentName}</p>}
                    </div>

                    <div className="md:col-span-2 border-t pt-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="hasChildren"
                          checked={data.case.hasChildren}
                          onCheckedChange={(checked) => updateCase("hasChildren", !!checked)}
                          data-testid="checkbox-has-children"
                        />
                        <Label htmlFor="hasChildren" className="cursor-pointer">
                          This case involves children
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Children</h2>
                  <p className="text-sm text-neutral-darkest/70">
                    Add information about the children involved in this case.
                  </p>
                  
                  {errors.children && (
                    <p className="text-sm text-destructive">{errors.children}</p>
                  )}

                  {data.children.map((child, idx) => (
                    <div key={idx} className="border border-neutral-darkest/10 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Child {idx + 1}</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeChild(idx)}
                          data-testid={`button-remove-child-${idx}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>First Name *</Label>
                          <Input
                            value={child.firstName}
                            onChange={e => updateChild(idx, "firstName", e.target.value)}
                            placeholder="First name"
                            className={errors[`child_${idx}_firstName`] ? "border-destructive" : ""}
                            data-testid={`input-child-first-name-${idx}`}
                          />
                          {errors[`child_${idx}_firstName`] && (
                            <p className="text-sm text-destructive mt-1">{errors[`child_${idx}_firstName`]}</p>
                          )}
                        </div>
                        <div>
                          <Label>Last Name</Label>
                          <Input
                            value={child.lastName}
                            onChange={e => updateChild(idx, "lastName", e.target.value)}
                            placeholder="Last name"
                            data-testid={`input-child-last-name-${idx}`}
                          />
                        </div>
                        <div>
                          <Label>Date of Birth *</Label>
                          <Input
                            type="date"
                            value={child.dateOfBirth}
                            onChange={e => updateChild(idx, "dateOfBirth", e.target.value)}
                            className={errors[`child_${idx}_dob`] ? "border-destructive" : ""}
                            data-testid={`input-child-dob-${idx}`}
                          />
                          {errors[`child_${idx}_dob`] && (
                            <p className="text-sm text-destructive mt-1">{errors[`child_${idx}_dob`]}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addChild}
                    className="w-full"
                    data-testid="button-add-child"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="font-heading font-bold text-xl text-neutral-darkest">Legal Agreements</h2>
                  <p className="text-sm text-neutral-darkest/70">
                    Please read and agree to the following documents to continue.
                  </p>

                  <div className="space-y-4">
                    <div className="border border-neutral-darkest/10 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-darkest">Terms of Service</h3>
                          <p className="text-sm text-neutral-darkest/60 mt-1">
                            {data.agreements.scrolledTos ? (
                              <span className="text-primary flex items-center gap-1">
                                <Check className="w-4 h-4" /> Read
                              </span>
                            ) : (
                              "Please read the full document"
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPolicyModal("tos")}
                          data-testid="button-read-tos"
                        >
                          Read
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Checkbox
                          id="tosAccepted"
                          checked={data.agreements.tosAccepted}
                          onCheckedChange={(checked) => updateAgreement("tosAccepted", !!checked)}
                          disabled={!data.agreements.scrolledTos}
                          data-testid="checkbox-tos"
                        />
                        <Label 
                          htmlFor="tosAccepted" 
                          className={`cursor-pointer ${!data.agreements.scrolledTos ? "text-neutral-darkest/40" : ""}`}
                        >
                          I agree to the Terms of Service
                        </Label>
                      </div>
                      {errors.tosAccepted && <p className="text-sm text-destructive mt-1">{errors.tosAccepted}</p>}
                      {errors.scrolledTos && <p className="text-sm text-destructive mt-1">{errors.scrolledTos}</p>}
                    </div>

                    <div className="border border-neutral-darkest/10 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-darkest">Privacy Policy</h3>
                          <p className="text-sm text-neutral-darkest/60 mt-1">
                            {data.agreements.scrolledPrivacy ? (
                              <span className="text-primary flex items-center gap-1">
                                <Check className="w-4 h-4" /> Read
                              </span>
                            ) : (
                              "Please read the full document"
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPolicyModal("privacy")}
                          data-testid="button-read-privacy"
                        >
                          Read
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Checkbox
                          id="privacyAccepted"
                          checked={data.agreements.privacyAccepted}
                          onCheckedChange={(checked) => updateAgreement("privacyAccepted", !!checked)}
                          disabled={!data.agreements.scrolledPrivacy}
                          data-testid="checkbox-privacy"
                        />
                        <Label 
                          htmlFor="privacyAccepted"
                          className={`cursor-pointer ${!data.agreements.scrolledPrivacy ? "text-neutral-darkest/40" : ""}`}
                        >
                          I agree to the Privacy Policy
                        </Label>
                      </div>
                      {errors.privacyAccepted && <p className="text-sm text-destructive mt-1">{errors.privacyAccepted}</p>}
                      {errors.scrolledPrivacy && <p className="text-sm text-destructive mt-1">{errors.scrolledPrivacy}</p>}
                    </div>

                    <div className="border border-neutral-darkest/10 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-darkest">Not a Law Firm Disclosure</h3>
                          <p className="text-sm text-neutral-darkest/60 mt-1">
                            {data.agreements.scrolledNotLawFirm ? (
                              <span className="text-primary flex items-center gap-1">
                                <Check className="w-4 h-4" /> Read
                              </span>
                            ) : (
                              "Please read the full document"
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPolicyModal("notLawFirm")}
                          data-testid="button-read-not-law-firm"
                        >
                          Read
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Checkbox
                          id="notLawFirmAccepted"
                          checked={data.agreements.notLawFirmAccepted}
                          onCheckedChange={(checked) => updateAgreement("notLawFirmAccepted", !!checked)}
                          disabled={!data.agreements.scrolledNotLawFirm}
                          data-testid="checkbox-not-law-firm"
                        />
                        <Label 
                          htmlFor="notLawFirmAccepted"
                          className={`cursor-pointer ${!data.agreements.scrolledNotLawFirm ? "text-neutral-darkest/40" : ""}`}
                        >
                          I acknowledge that Civilla is not a law firm
                        </Label>
                      </div>
                      {errors.notLawFirmAccepted && <p className="text-sm text-destructive mt-1">{errors.notLawFirmAccepted}</p>}
                      {errors.scrolledNotLawFirm && <p className="text-sm text-destructive mt-1">{errors.scrolledNotLawFirm}</p>}
                    </div>

                    <div className="border border-neutral-darkest/10 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-darkest">User Responsibility</h3>
                          <p className="text-sm text-neutral-darkest/60 mt-1">
                            {data.agreements.scrolledResponsibility ? (
                              <span className="text-primary flex items-center gap-1">
                                <Check className="w-4 h-4" /> Read
                              </span>
                            ) : (
                              "Please read the full document"
                            )}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPolicyModal("responsibility")}
                          data-testid="button-read-responsibility"
                        >
                          Read
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        <Checkbox
                          id="responsibilityAccepted"
                          checked={data.agreements.responsibilityAccepted}
                          onCheckedChange={(checked) => updateAgreement("responsibilityAccepted", !!checked)}
                          disabled={!data.agreements.scrolledResponsibility}
                          data-testid="checkbox-responsibility"
                        />
                        <Label 
                          htmlFor="responsibilityAccepted"
                          className={`cursor-pointer ${!data.agreements.scrolledResponsibility ? "text-neutral-darkest/40" : ""}`}
                        >
                          I acknowledge my responsibilities as a user
                        </Label>
                      </div>
                      {errors.responsibilityAccepted && <p className="text-sm text-destructive mt-1">{errors.responsibilityAccepted}</p>}
                      {errors.scrolledResponsibility && <p className="text-sm text-destructive mt-1">{errors.scrolledResponsibility}</p>}
                    </div>
                  </div>
                </div>
              )}

              {errors.submit && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive">{errors.submit}</p>
                </div>
              )}

              <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={step === 1}
                  data-testid="button-back"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>

                {step < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-next"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canProceed() || completeMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="button-complete-onboarding"
                  >
                    {completeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <Check className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {policiesData && (
        <>
          <ScrollablePolicyModal
            open={policyModal === "tos"}
            onOpenChange={(open) => !open && setPolicyModal(null)}
            title="Terms of Service"
            text={policiesData.tosText}
            onScrolledToBottom={() => updateAgreement("scrolledTos", true)}
            hasScrolled={data.agreements.scrolledTos}
          />
          <ScrollablePolicyModal
            open={policyModal === "privacy"}
            onOpenChange={(open) => !open && setPolicyModal(null)}
            title="Privacy Policy"
            text={policiesData.privacyText}
            onScrolledToBottom={() => updateAgreement("scrolledPrivacy", true)}
            hasScrolled={data.agreements.scrolledPrivacy}
          />
          <ScrollablePolicyModal
            open={policyModal === "notLawFirm"}
            onOpenChange={(open) => !open && setPolicyModal(null)}
            title="Not a Law Firm Disclosure"
            text={policiesData.notLawFirmText}
            onScrolledToBottom={() => updateAgreement("scrolledNotLawFirm", true)}
            hasScrolled={data.agreements.scrolledNotLawFirm}
          />
          <ScrollablePolicyModal
            open={policyModal === "responsibility"}
            onOpenChange={(open) => !open && setPolicyModal(null)}
            title="User Responsibility Acknowledgment"
            text={policiesData.responsibilityText}
            onScrolledToBottom={() => updateAgreement("scrolledResponsibility", true)}
            hasScrolled={data.agreements.scrolledResponsibility}
          />
        </>
      )}
    </div>
  );
}
