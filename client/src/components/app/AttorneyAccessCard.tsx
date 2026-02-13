import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Copy, Check, Trash2, Mail, Clock, Shield, Briefcase } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Collaborator {
  id: string;
  userId: string;
  role: string;
  email: string;
  createdAt: string;
}

interface Invite {
  id: string;
  email: string;
  expiresAt: string;
  createdAt: string;
}

interface Case {
  id: string;
  title: string;
  nickname: string | null;
}

interface AttorneyAccessCardProps {
  caseId?: string;
  caseTitle?: string;
}

export default function AttorneyAccessCard({ caseId: propCaseId, caseTitle: propCaseTitle }: AttorneyAccessCardProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(propCaseId || "");

  const { data: casesResponse } = useQuery<{ cases: Case[] }>({
    queryKey: ["/api/cases"],
    enabled: !propCaseId,
  });
  const casesData = casesResponse?.cases;

  useEffect(() => {
    if (!propCaseId && casesData && casesData.length > 0 && !selectedCaseId) {
      setSelectedCaseId(casesData[0].id);
    }
  }, [casesData, propCaseId, selectedCaseId]);

  const caseId = propCaseId || selectedCaseId;
  const caseTitle = propCaseTitle || casesData?.find((c) => c.id === caseId)?.title;
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [expiryDays, setExpiryDays] = useState("30");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: collaboratorsData, isLoading: collabLoading } = useQuery<{ collaborators: Collaborator[] }>({
    queryKey: ["/api/cases", caseId, "attorney/collaborators"],
    enabled: !!caseId,
  });

  const { data: invitesData, isLoading: invitesLoading } = useQuery<{ invites: Invite[] }>({
    queryKey: ["/api/cases", caseId, "attorney/invites"],
    enabled: !!caseId,
  });

  const createInviteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/cases/${caseId}/attorney/invites`, {
        email: email.trim().toLowerCase(),
        expiresInDays: parseInt(expiryDays, 10),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedUrl(data.inviteUrl);
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "attorney/invites"] });
      toast({ title: "Invite created", description: "Share the link with your attorney." });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    },
  });

  const revokeCollaboratorMutation = useMutation({
    mutationFn: async (collaboratorUserId: string) => {
      await apiRequest("DELETE", `/api/cases/${caseId}/attorney/collaborators/${collaboratorUserId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "attorney/collaborators"] });
      toast({ title: "Access revoked" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      await apiRequest("DELETE", `/api/cases/${caseId}/attorney/invites/${inviteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "attorney/invites"] });
      toast({ title: "Invite revoked" });
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: String(error) });
    },
  });

  const handleCopy = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-lg font-heading font-bold text-neutral-darkest">
          <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          Attorney Access
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-[#f4f6f5] rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-sans text-sm text-neutral-darkest">
                Invite an attorney to view this case <strong>read-only</strong>. They can view and download materials but cannot edit anything.
              </p>
              {caseTitle && (
                <p className="font-sans text-sm text-neutral-darkest/60 mt-1">
                  Sharing access to: <strong>{caseTitle}</strong>
                </p>
              )}
            </div>
          </div>
        </div>

        {!propCaseId && casesData && casesData.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="case-select">Select Case</Label>
            <Select value={selectedCaseId} onValueChange={(val) => { setSelectedCaseId(val); setGeneratedUrl(null); }}>
              <SelectTrigger id="case-select" data-testid="select-case">
                <Briefcase className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {casesData.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nickname || c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!caseId && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <p className="font-sans text-sm text-amber-800 dark:text-amber-200">
              You need to create a case first before you can invite an attorney.
            </p>
          </div>
        )}

        {caseId && (
        <>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attorney-email">Attorney Email</Label>
              <Input
                id="attorney-email"
                type="email"
                placeholder="attorney@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-attorney-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-days">Link Expires In</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger id="expiry-days" data-testid="select-expiry-days">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={() => createInviteMutation.mutate()}
            disabled={!email || createInviteMutation.isPending}
            className="w-full"
            data-testid="button-generate-invite"
          >
            {createInviteMutation.isPending ? "Creating..." : "Generate Invite Link"}
          </Button>
        </div>

        {generatedUrl && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 space-y-3">
            <p className="font-sans font-medium text-green-800 dark:text-green-200">Invite link created!</p>
            <div className="flex items-center gap-2">
              <Input
                value={generatedUrl}
                readOnly
                className="bg-white dark:bg-neutral-800 text-sm"
                data-testid="input-invite-url"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                data-testid="button-copy-invite"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="font-sans text-xs text-green-700 dark:text-green-300">
              Send this link to your attorney. It will expire in {expiryDays} days.
            </p>
          </div>
        )}

        {!collabLoading && collaboratorsData?.collaborators && collaboratorsData.collaborators.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-sans font-medium text-neutral-darkest">Active Attorney Access</h4>
            <div className="space-y-2">
              {collaboratorsData.collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-4 py-3"
                  data-testid={`collaborator-${collab.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-neutral-darkest/60" />
                    <div>
                      <p className="font-sans text-sm text-neutral-darkest">{collab.email}</p>
                      <p className="font-sans text-xs text-neutral-darkest/60">
                        Access granted {new Date(collab.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeCollaboratorMutation.mutate(collab.userId)}
                    disabled={revokeCollaboratorMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-revoke-${collab.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!invitesLoading && invitesData?.invites && invitesData.invites.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-sans font-medium text-neutral-darkest">Pending Invites</h4>
            <div className="space-y-2">
              {invitesData.invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3"
                  data-testid={`invite-${invite.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-sans text-sm text-neutral-darkest">{invite.email}</p>
                      <p className="font-sans text-xs text-neutral-darkest/60">
                        Expires {new Date(invite.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revokeInviteMutation.mutate(invite.id)}
                    disabled={revokeInviteMutation.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`button-revoke-invite-${invite.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        </>
        )}
      </CardContent>
    </Card>
  );
}
