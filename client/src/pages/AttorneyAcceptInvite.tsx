import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AttorneyAcceptInvite() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"checking" | "needsLogin" | "accepting" | "success" | "error">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const { data: user } = useQuery<{ id: string } | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
    } else {
      setStatus("error");
      setErrorMessage("No invite token found in URL");
    }
  }, []);

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attorney/accept", { token });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.needsLogin) {
        setStatus("needsLogin");
      } else if (data.ok && data.caseId) {
        setCaseId(data.caseId);
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Failed to accept invite");
      }
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(String(error));
    },
  });

  useEffect(() => {
    if (token && user?.id && status === "checking") {
      setStatus("accepting");
      acceptMutation.mutate();
    } else if (token && !user?.id && status === "checking") {
      setStatus("needsLogin");
    }
  }, [token, user]);

  const handleLoginRedirect = () => {
    const returnUrl = `/attorney/accept?token=${token}`;
    navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleGoToCase = () => {
    if (caseId) {
      navigate(`/app/attorney/case/${caseId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f6f5] to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-heading font-bold text-neutral-darkest">
            Attorney Case Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {(status === "checking" || status === "accepting") && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="font-sans text-neutral-darkest/60">
                {status === "checking" ? "Verifying invite..." : "Accepting invite..."}
              </p>
            </div>
          )}

          {status === "needsLogin" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <LogIn className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-sans font-medium text-blue-800 dark:text-blue-200">Sign in required</p>
                    <p className="font-sans text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Please log in or create an account to accept this case access invitation.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLoginRedirect}
                className="w-full"
                data-testid="button-login-to-accept"
              >
                Sign in to Accept
              </Button>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-sans font-medium text-green-800 dark:text-green-200">Access granted!</p>
                    <p className="font-sans text-sm text-green-700 dark:text-green-300 mt-1">
                      You now have read-only access to view and download case materials.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleGoToCase}
                className="w-full"
                data-testid="button-go-to-case"
              >
                View Case Materials
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-sans font-medium text-red-800 dark:text-red-200">Unable to accept invite</p>
                    <p className="font-sans text-sm text-red-700 dark:text-red-300 mt-1">
                      {errorMessage || "The invite link may be expired or invalid."}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
                data-testid="button-go-home"
              >
                Go to Homepage
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
