import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { User, CreditCard, Settings, Palette, Calculator, ChevronDown, ChevronUp, Bot, Sparkles, BarChart3, Clock, Activity } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AppLayout from "@/components/layout/AppLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import ModuleIntro from "@/components/app/ModuleIntro";
import { UnknownControls, UNKNOWN_VALUE, PREFER_NOT_VALUE, isFieldDeferred, isDeferredValue } from "@/components/onboarding/UnknownControls";
import ActivityLogsViewer from "@/components/app/ActivityLogsViewer";
import AiStatusCard from "@/components/app/AiStatusCard";

interface UserProfile {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  partyRole: string | null;
  isSelfRepresented: boolean;
  autoFillEnabled: boolean;
  firmName: string | null;
  barNumber: string | null;
  subscriptionTier: string;
  subscriptionSource: string | null;
  isLifetime: boolean;
  compedReason: string | null;
  isAdmin: boolean;
  isGrantViewer: boolean;
}

interface LexiUserPrefs {
  id: string;
  userId: string;
  responseStyle: string | null;
  verbosity: number | null;
  citationStrictness: string | null;
  defaultMode: string | null;
  streamingEnabled: boolean | null;
  fasterMode: boolean | null;
}

interface UserActivityOverview {
  totalEvents: number;
  moduleUsage: { moduleKey: string; count: number }[];
  eventTypeCounts: { type: string; count: number }[];
  recentDays: number;
}

interface BillingStatus {
  tier: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  addOns: {
    secondCase: boolean;
    archiveMode: boolean;
  };
  limits: {
    cases: number;
    storageMb: number;
    analysis: boolean;
    downloads: boolean;
    videoUploads: boolean;
    advancedExhibits: boolean;
  };
}

function SubscriptionTierCard({ tier }: { tier: "free" | "core" | "pro" | "premium" }) {
  const { toast } = useToast();
  const [isManaging, setIsManaging] = useState(false);

  const { data: billingData } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
  });

  const tierConfig: Record<string, { bg: string; border: string; badge: string; badgeText: string; label: string }> = {
    premium: {
      bg: "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20",
      border: "border-purple-200 dark:border-purple-700",
      badge: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-800 dark:text-purple-100 dark:border-purple-600",
      badgeText: "Premium",
      label: "Premium"
    },
    pro: {
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      border: "border-blue-200 dark:border-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600",
      badgeText: "Pro",
      label: "Pro"
    },
    core: {
      bg: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
      border: "border-green-200 dark:border-green-700",
      badge: "bg-green-100 text-green-800 border-green-300 dark:bg-green-800 dark:text-green-100 dark:border-green-600",
      badgeText: "Core",
      label: "Core"
    },
    free: {
      bg: "bg-[#f4f6f5] dark:bg-neutral-800",
      border: "border-gray-200 dark:border-gray-700",
      badge: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600",
      badgeText: "Free",
      label: "Free"
    }
  };

  const config = tierConfig[tier] || tierConfig.free;

  const handleManageSubscription = async () => {
    setIsManaging(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include"
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Error",
          description: data.error || "Unable to open billing portal",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive"
      });
    } finally {
      setIsManaging(false);
    }
  };

  const isPaid = tier !== "free" && billingData?.status === "active";
  const willCancel = billingData?.cancelAtPeriodEnd;
  const periodEnd = billingData?.currentPeriodEnd ? new Date(billingData.currentPeriodEnd).toLocaleDateString() : null;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-6`}>
      <div className="flex items-center gap-3 mb-3">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.badge} border`} data-testid={`badge-tier-${tier}`}>
          {config.badgeText}
        </span>
        {willCancel && periodEnd && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Cancels {periodEnd}
          </span>
        )}
      </div>
      <p className="font-sans text-neutral-darkest dark:text-cream mb-2">
        You're on the <strong>{config.label}</strong> plan.
      </p>
      {billingData?.limits && (
        <div className="grid grid-cols-2 gap-2 text-sm text-neutral-darkest/70 dark:text-cream/70 mb-4">
          <div>Cases: {billingData.limits.cases === 99 ? "Unlimited" : billingData.limits.cases}</div>
          <div>Storage: {billingData.limits.storageMb >= 100000 ? "100GB" : `${Math.round(billingData.limits.storageMb / 1000)}GB`}</div>
          {billingData.limits.analysis && <div>AI Analysis included</div>}
          {billingData.limits.videoUploads && <div>Video uploads enabled</div>}
        </div>
      )}
      <div className="flex gap-2">
        {isPaid ? (
          <Button 
            variant="outline" 
            onClick={handleManageSubscription}
            disabled={isManaging}
            data-testid="button-manage-subscription"
          >
            {isManaging ? "Loading..." : "Manage Subscription"}
          </Button>
        ) : (
          <Button 
            variant="default"
            onClick={() => window.location.href = "/plans"}
            data-testid="button-upgrade-plan"
          >
            Upgrade Plan
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AppAccountSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [savingsExpanded, setSavingsExpanded] = useState(false);
  const [savingsHours, setSavingsHours] = useState(10);
  const [savingsHourlyRate, setSavingsHourlyRate] = useState(300);
  const [savingsIncludeDocPrep, setSavingsIncludeDocPrep] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zip: "",
  });

  const { data: profileData, isLoading } = useQuery<{ profile: UserProfile }>({
    queryKey: ["/api/profile"],
  });

  const { data: lexiPrefsData } = useQuery<{ prefs: LexiUserPrefs | null }>({
    queryKey: ["/api/lexi/prefs"],
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<UserActivityOverview>({
    queryKey: ["/api/analytics/user-overview"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/user-overview?days=30", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  const [lexiPrefs, setLexiPrefs] = useState({
    responseStyle: "default",
    verbosity: 3,
    citationStrictness: "default",
    defaultMode: "research",
    streamingEnabled: true,
    fasterMode: false,
  });

  useEffect(() => {
    if (profileData?.profile) {
      setFormData({
        fullName: profileData.profile.fullName || "",
        email: profileData.profile.email || "",
        phone: profileData.profile.phone || "",
        addressLine1: profileData.profile.addressLine1 || "",
        addressLine2: profileData.profile.addressLine2 || "",
        city: profileData.profile.city || "",
        state: profileData.profile.state || "",
        zip: profileData.profile.zip || "",
      });
    }
  }, [profileData]);

  useEffect(() => {
    if (lexiPrefsData?.prefs) {
      setLexiPrefs({
        responseStyle: lexiPrefsData.prefs.responseStyle || "default",
        verbosity: lexiPrefsData.prefs.verbosity ?? 3,
        citationStrictness: lexiPrefsData.prefs.citationStrictness || "default",
        defaultMode: lexiPrefsData.prefs.defaultMode || "research",
        streamingEnabled: lexiPrefsData.prefs.streamingEnabled ?? true,
        fasterMode: lexiPrefsData.prefs.fasterMode ?? false,
      });
    }
  }, [lexiPrefsData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update profile", variant: "destructive" });
    },
  });

  const updateLexiPrefsMutation = useMutation({
    mutationFn: async (data: typeof lexiPrefs) => {
      return apiRequest("PUT", "/api/lexi/prefs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lexi/prefs"] });
      toast({ title: "Lexi preferences saved" });
    },
    onError: () => {
      toast({ title: "Failed to save Lexi preferences", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="px-4 sm:px-5 md:px-8 py-6 sm:py-8">
        <div className="rounded-2xl bg-[#e7ebea] p-4 sm:p-6 md:p-8 mb-6 sm:mb-10">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-bold text-xl sm:text-2xl md:text-3xl text-neutral-darkest">
                Account Settings
              </h1>
              <p className="font-sans text-sm sm:text-base text-neutral-darkest/70 mt-1">
                Manage your profile and subscription.
              </p>
            </div>
          </div>
        </div>

        <ModuleIntro
          title="About Account Settings"
          paragraphs={[
            "Manage your personal information and preferences. This information may be used to pre-fill documents and court forms.",
            "Keep your contact information current for accurate document generation."
          ]}
        />

        <div className="w-full max-w-[320px] mb-6">
          <div className="bg-[hsl(var(--module-tile))] border border-[hsl(var(--module-tile-border))] rounded-xl overflow-hidden">
            <button
              onClick={() => setSavingsExpanded(!savingsExpanded)}
              className="w-full flex items-center justify-between p-3 hover:bg-[hsl(var(--module-tile-hover))] transition-colors"
              data-testid="button-toggle-savings"
            >
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[hsl(var(--module-tile-icon))]" />
                <div className="text-left">
                  <p className="font-heading font-semibold text-sm text-[#243032]">Savings Estimate</p>
                  {!savingsExpanded && (
                    <p className="font-sans text-xs text-[#243032]/60">Estimate your potential legal cost savings.</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-[#243032]/60">{savingsExpanded ? "Hide" : "Show"}</span>
                {savingsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-[hsl(var(--module-tile-icon))]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[hsl(var(--module-tile-icon))]" />
                )}
              </div>
            </button>

            {savingsExpanded && (
              <div className="px-3 pb-3 space-y-3">
                <div>
                  <Label htmlFor="savings-hours" className="text-xs text-[#243032]/70">Hours organizing</Label>
                  <Input
                    id="savings-hours"
                    type="number"
                    min="1"
                    max="500"
                    value={savingsHours}
                    onChange={(e) => setSavingsHours(parseInt(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                    data-testid="input-savings-hours"
                  />
                </div>
                <div>
                  <Label htmlFor="savings-rate" className="text-xs text-[#243032]/70">Hourly value ($)</Label>
                  <Input
                    id="savings-rate"
                    type="number"
                    min="1"
                    max="1000"
                    value={savingsHourlyRate}
                    onChange={(e) => setSavingsHourlyRate(parseInt(e.target.value) || 0)}
                    className="mt-1 h-8 text-sm"
                    data-testid="input-savings-rate"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={savingsIncludeDocPrep}
                    onCheckedChange={(val) => setSavingsIncludeDocPrep(val === true)}
                    data-testid="checkbox-include-doc-prep"
                  />
                  <span className="text-xs text-[#243032]/70">Include doc prep (+25%)</span>
                </label>

                <div className="bg-white/60 rounded-lg p-3">
                  <p className="text-xs text-[#243032]/60 mb-1">Estimated value saved</p>
                  <p className="font-heading font-bold text-xl text-[#314143]" data-testid="text-savings-estimate">
                    ${((savingsIncludeDocPrep ? savingsHours * 1.25 : savingsHours) * savingsHourlyRate).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#243032]/50 mt-1">
                    Educational estimate. Actual costs vary.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName" className="text-neutral-darkest">Full Name</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Your full name"
                      className="mt-1"
                      data-testid="input-fullname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-neutral-darkest">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="mt-1"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-neutral-darkest">Phone</Label>
                    <Input
                      id="phone"
                      value={isFieldDeferred(formData.phone) ? "" : formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                      disabled={isFieldDeferred(formData.phone)}
                      data-testid="input-phone"
                    />
                    <UnknownControls
                      value={formData.phone}
                      onChange={(v) => setFormData({ ...formData, phone: v })}
                      showHelperText={false}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="font-sans font-medium text-neutral-darkest mb-4">Address</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine1" className="text-neutral-darkest">Street Address</Label>
                      <Input
                        id="addressLine1"
                        value={formData.addressLine1}
                        onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                        placeholder="123 Main St"
                        className="mt-1"
                        data-testid="input-address1"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="addressLine2" className="text-neutral-darkest">Apt, Suite, etc. (optional)</Label>
                      <Input
                        id="addressLine2"
                        value={isFieldDeferred(formData.addressLine2) ? "" : formData.addressLine2}
                        onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                        placeholder="Apt 4B"
                        className="mt-1"
                        disabled={isFieldDeferred(formData.addressLine2)}
                        data-testid="input-address2"
                      />
                      <UnknownControls
                        value={formData.addressLine2}
                        onChange={(v) => setFormData({ ...formData, addressLine2: v })}
                        showHelperText={false}
                        labels={{ unknown: "Don't have this" }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-neutral-darkest">City</Label>
                      <Input
                        id="city"
                        value={isFieldDeferred(formData.city) ? "" : formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City"
                        className="mt-1"
                        disabled={isFieldDeferred(formData.city)}
                        data-testid="input-city"
                      />
                      <UnknownControls
                        value={formData.city}
                        onChange={(v) => setFormData({ ...formData, city: v })}
                        showHelperText={false}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="state" className="text-neutral-darkest">State</Label>
                        <Input
                          id="state"
                          value={isFieldDeferred(formData.state) ? "" : formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="State"
                          className="mt-1"
                          disabled={isFieldDeferred(formData.state)}
                          data-testid="input-state"
                        />
                        <UnknownControls
                          value={formData.state}
                          onChange={(v) => setFormData({ ...formData, state: v })}
                          showHelperText={false}
                        />
                      </div>
                      <div>
                        <Label htmlFor="zip" className="text-neutral-darkest">ZIP</Label>
                        <Input
                          id="zip"
                          value={isFieldDeferred(formData.zip) ? "" : formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          placeholder="12345"
                          className="mt-1"
                          disabled={isFieldDeferred(formData.zip)}
                          data-testid="input-zip"
                        />
                        <UnknownControls
                          value={formData.zip}
                          onChange={(v) => setFormData({ ...formData, zip: v })}
                          showHelperText={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <Palette className="w-5 h-5 text-primary" />
                </div>
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-sans font-medium text-neutral-darkest">Theme</p>
                    <p className="font-sans text-sm text-neutral-darkest/60">
                      Choose between light and dark mode
                    </p>
                  </div>
                  <Select
                    value={theme}
                    onValueChange={(val) => setTheme(val as "light" | "dark")}
                  >
                    <SelectTrigger className="w-32" data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                Lexi AI Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label className="text-neutral-darkest">Response Style</Label>
                  <p className="font-sans text-sm text-neutral-darkest/60 mb-2">
                    How should Lexi structure responses?
                  </p>
                  <Select
                    value={lexiPrefs.responseStyle}
                    onValueChange={(val) => setLexiPrefs({ ...lexiPrefs, responseStyle: val })}
                  >
                    <SelectTrigger className="w-full max-w-xs" data-testid="select-lexi-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="formal">Formal / Professional</SelectItem>
                      <SelectItem value="friendly">Friendly / Conversational</SelectItem>
                      <SelectItem value="concise">Concise / Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-neutral-darkest">Verbosity Level</Label>
                  <p className="font-sans text-sm text-neutral-darkest/60 mb-2">
                    How detailed should responses be? (1 = brief, 5 = comprehensive)
                  </p>
                  <div className="flex items-center gap-4 max-w-xs">
                    <span className="text-sm text-neutral-darkest/60">1</span>
                    <Slider
                      value={[lexiPrefs.verbosity]}
                      onValueChange={([v]) => setLexiPrefs({ ...lexiPrefs, verbosity: v })}
                      min={1}
                      max={5}
                      step={1}
                      className="flex-1"
                      data-testid="slider-lexi-verbosity"
                    />
                    <span className="text-sm text-neutral-darkest/60">5</span>
                    <span className="w-8 text-center font-medium text-neutral-darkest">{lexiPrefs.verbosity}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-neutral-darkest">Citation Approach</Label>
                  <p className="font-sans text-sm text-neutral-darkest/60 mb-2">
                    How strict should Lexi be about citing sources?
                  </p>
                  <Select
                    value={lexiPrefs.citationStrictness}
                    onValueChange={(val) => setLexiPrefs({ ...lexiPrefs, citationStrictness: val })}
                  >
                    <SelectTrigger className="w-full max-w-xs" data-testid="select-lexi-citation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="strict">Strict (always cite sources)</SelectItem>
                      <SelectItem value="relaxed">Relaxed (cite when helpful)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-neutral-darkest">Default Mode</Label>
                  <p className="font-sans text-sm text-neutral-darkest/60 mb-2">
                    What should Lexi optimize for by default?
                  </p>
                  <Select
                    value={lexiPrefs.defaultMode}
                    onValueChange={(val) => setLexiPrefs({ ...lexiPrefs, defaultMode: val })}
                  >
                    <SelectTrigger className="w-full max-w-xs" data-testid="select-lexi-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="research">Research (comprehensive)</SelectItem>
                      <SelectItem value="organization">Organization (case-focused)</SelectItem>
                      <SelectItem value="analysis">Analysis (evidence review)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-neutral-light">
                  <div>
                    <Label className="text-neutral-darkest">Streaming Responses</Label>
                    <p className="font-sans text-sm text-neutral-darkest/60">
                      Show responses word-by-word as they are generated
                    </p>
                  </div>
                  <Switch
                    checked={lexiPrefs.streamingEnabled}
                    onCheckedChange={(checked) => setLexiPrefs({ ...lexiPrefs, streamingEnabled: checked })}
                    data-testid="switch-lexi-streaming"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-neutral-light">
                  <div>
                    <Label className="text-neutral-darkest">Faster Mode</Label>
                    <p className="font-sans text-sm text-neutral-darkest/60">
                      Prioritize speed with shorter, more direct answers
                    </p>
                  </div>
                  <Switch
                    checked={lexiPrefs.fasterMode}
                    onCheckedChange={(checked) => setLexiPrefs({ ...lexiPrefs, fasterMode: checked })}
                    data-testid="switch-lexi-faster"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => updateLexiPrefsMutation.mutate(lexiPrefs)}
                    disabled={updateLexiPrefsMutation.isPending}
                    className="bg-primary text-primary-foreground"
                    data-testid="button-save-lexi-prefs"
                  >
                    {updateLexiPrefsMutation.isPending ? "Saving..." : "Save Lexi Preferences"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <AiStatusCard />

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileData?.profile?.isLifetime && profileData?.profile?.subscriptionSource === "comped" ? (
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-800 border border-amber-300" data-testid="badge-tier-premium">
                        Premium
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r from-amber-200 to-yellow-200 text-amber-900 border border-amber-400" data-testid="badge-lifetime">
                        Lifetime
                      </span>
                    </div>
                  </div>
                  <p className="font-sans text-neutral-darkest mb-1">
                    You have <strong>Lifetime Premium</strong> access.
                  </p>
                  <p className="font-sans text-sm text-neutral-darkest/60">
                    No billing required. Thank you for being a founding supporter!
                  </p>
                </div>
              ) : profileData?.profile?.subscriptionTier === "premium" ? (
                <SubscriptionTierCard tier="premium" />
              ) : profileData?.profile?.subscriptionTier === "pro" ? (
                <SubscriptionTierCard tier="pro" />
              ) : profileData?.profile?.subscriptionTier === "core" ? (
                <SubscriptionTierCard tier="core" />
              ) : (
                <SubscriptionTierCard tier="free" />
              )}
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
                <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                Usage Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="bg-[#f4f6f5] rounded-lg p-6 text-center">
                  <p className="font-sans text-neutral-darkest/60">Loading usage data...</p>
                </div>
              ) : analyticsData ? (
                <div className="space-y-4">
                  <div className="bg-[#f4f6f5] rounded-lg p-4">
                    <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Total Activity (Last 30 days)</p>
                    <p className="font-heading font-bold text-2xl text-neutral-darkest" data-testid="text-total-events">
                      {analyticsData.totalEvents} actions
                    </p>
                  </div>
                  
                  {analyticsData.moduleUsage.length > 0 && (
                    <div>
                      <p className="font-sans font-medium text-neutral-darkest mb-2">Most Used Modules</p>
                      <div className="space-y-2">
                        {analyticsData.moduleUsage.slice(0, 5).map((m) => (
                          <div key={m.moduleKey} className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-3 py-2" data-testid={`module-usage-${m.moduleKey}`}>
                            <span className="font-sans text-sm text-neutral-darkest capitalize">{m.moduleKey.replace(/-/g, " ")}</span>
                            <span className="font-heading font-semibold text-sm text-neutral-darkest">{m.count} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analyticsData.eventTypeCounts.length > 0 && (
                    <div>
                      <p className="font-sans font-medium text-neutral-darkest mb-2">Action Breakdown</p>
                      <div className="space-y-2">
                        {analyticsData.eventTypeCounts.slice(0, 5).map((e) => (
                          <div key={e.type} className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-3 py-2" data-testid={`event-type-${e.type}`}>
                            <span className="font-sans text-sm text-neutral-darkest capitalize">{e.type.replace(/_/g, " ")}</span>
                            <span className="font-heading font-semibold text-sm text-neutral-darkest">{e.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analyticsData.totalEvents === 0 && (
                    <div className="bg-[#f4f6f5] rounded-lg p-6 text-center">
                      <p className="font-sans text-neutral-darkest/60">No activity recorded yet. Start exploring your case to see usage insights here.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#f4f6f5] rounded-lg p-6 text-center">
                  <p className="font-sans text-neutral-darkest/60">Unable to load usage data.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <ActivityLogsViewer />
        </div>
      </div>
    </AppLayout>
  );
}
