import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Shield, ArrowRight, SkipForward } from "lucide-react";
import { completeLiteOnboarding } from "@/lib/intakeApi";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/Footer";

const DISCLAIMER = "Prepared using Civilla for educational and research purposes. Not legal advice.";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "District of Columbia"
];

export default function OnboardingLite() {
  const [, navigate] = useLocation();
  const [state, setState] = useState("");
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [upl, setUpl] = useState(false);
  const [comms, setComms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = state && tos && privacy && upl;

  const mutation = useMutation({
    mutationFn: completeLiteOnboarding,
    onSuccess: (data) => {
      if (data.ok) {
        navigate("/app/lexi-intake?state=" + encodeURIComponent(state));
      } else {
        setError(data.error || "Failed to complete onboarding");
      }
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleContinue = () => {
    setError(null);
    mutation.mutate({
      state,
      tosAccepted: tos,
      privacyAccepted: privacy,
      notLawFirmAccepted: upl,
      commsConsent: comms,
    });
  };

  const handleSkip = () => {
    if (canContinue) {
      mutation.mutate({
        state,
        tosAccepted: tos,
        privacyAccepted: privacy,
        notLawFirmAccepted: upl,
        commsConsent: comms,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppNavbar />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Quick Setup</CardTitle>
            <CardDescription>
              Minimal setup now. You can add case details later when you draft or organize.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="state">State (where your case is or will be filed)</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger id="state" data-testid="select-state">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="tos"
                  checked={tos}
                  onCheckedChange={(checked) => setTos(checked === true)}
                  data-testid="checkbox-tos"
                />
                <Label htmlFor="tos" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the <a href="/terms" target="_blank" className="text-primary underline">Terms of Service</a>.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy"
                  checked={privacy}
                  onCheckedChange={(checked) => setPrivacy(checked === true)}
                  data-testid="checkbox-privacy"
                />
                <Label htmlFor="privacy" className="text-sm leading-relaxed cursor-pointer">
                  I acknowledge the <a href="/privacy-policy" target="_blank" className="text-primary underline">Privacy Policy</a>.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="upl"
                  checked={upl}
                  onCheckedChange={(checked) => setUpl(checked === true)}
                  data-testid="checkbox-upl"
                />
                <Label htmlFor="upl" className="text-sm leading-relaxed cursor-pointer">
                  I understand that Civilla is not a law firm and does not provide legal advice.
                </Label>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="comms"
                  checked={comms}
                  onCheckedChange={(checked) => setComms(checked === true)}
                  data-testid="checkbox-comms"
                />
                <Label htmlFor="comms" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                  Optional: I consent to receive account messages by email/SMS (you can change this later).
                </Label>
              </div>
            </div>

            <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Safety note:</strong> Civilla is not an emergency service. If you are in immediate danger, call local emergency services.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleContinue}
                disabled={!canContinue || mutation.isPending}
                className="flex-1"
                data-testid="button-continue"
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue to Lexi
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={!canContinue || mutation.isPending}
                data-testid="button-skip"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Skip to Start Here
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">{DISCLAIMER}</p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
