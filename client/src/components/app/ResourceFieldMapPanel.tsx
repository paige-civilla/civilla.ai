import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, ChevronDown, ChevronRight, Trash2, Sparkles, FileText, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResourceFieldMap {
  id: string;
  resourceId: string;
  fieldLabel: string;
  fieldDescription?: string | null;
  claimId?: string | null;
  suggestedClaimIds: string[];
  manualValue?: string | null;
  isCompleted: boolean;
  sortOrder: number;
}

interface CaseClaim {
  id: string;
  claimText: string;
  claimType: string;
  status: string;
}

interface ResourceFieldMapPanelProps {
  caseId: string;
  resourceId: string;
  resourceTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ResourceFieldMapPanel({
  caseId,
  resourceId,
  resourceTitle,
  open,
  onOpenChange,
}: ResourceFieldMapPanelProps) {
  const { toast } = useToast();
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldDescription, setNewFieldDescription] = useState("");
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const fieldMapsQuery = useQuery<{ fieldMaps: ResourceFieldMap[] }>({
    queryKey: ["/api/cases", caseId, "resources", resourceId, "field-maps"],
    enabled: open && !!resourceId,
  });

  const claimsQuery = useQuery<{ claims: CaseClaim[] }>({
    queryKey: ["/api/cases", caseId, "claims"],
    enabled: open,
  });

  const createFieldMapMutation = useMutation({
    mutationFn: async (data: { fieldLabel: string; fieldDescription?: string }) => {
      return apiRequest("POST", `/api/cases/${caseId}/resources/${resourceId}/field-maps`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "resources", resourceId, "field-maps"] });
      setNewFieldLabel("");
      setNewFieldDescription("");
      toast({ title: "Field added" });
    },
    onError: () => {
      toast({ title: "Failed to add field", variant: "destructive" });
    },
  });

  const updateFieldMapMutation = useMutation({
    mutationFn: async ({ fieldMapId, data }: { fieldMapId: string; data: Partial<ResourceFieldMap> }) => {
      return apiRequest("PATCH", `/api/cases/${caseId}/resources/${resourceId}/field-maps/${fieldMapId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "resources", resourceId, "field-maps"] });
    },
    onError: () => {
      toast({ title: "Failed to update field", variant: "destructive" });
    },
  });

  const deleteFieldMapMutation = useMutation({
    mutationFn: async (fieldMapId: string) => {
      return apiRequest("DELETE", `/api/cases/${caseId}/resources/${resourceId}/field-maps/${fieldMapId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "resources", resourceId, "field-maps"] });
      toast({ title: "Field removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove field", variant: "destructive" });
    },
  });

  const fieldMaps = fieldMapsQuery.data?.fieldMaps || [];
  const claims = claimsQuery.data?.claims?.filter((c: CaseClaim) => c.status === "accepted") || [];
  const completedCount = fieldMaps.filter(f => f.isCompleted).length;
  const totalCount = fieldMaps.length;

  const toggleExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    createFieldMapMutation.mutate({
      fieldLabel: newFieldLabel.trim(),
      fieldDescription: newFieldDescription.trim() || undefined,
    });
  };

  const handleToggleComplete = (fieldMap: ResourceFieldMap) => {
    updateFieldMapMutation.mutate({
      fieldMapId: fieldMap.id,
      data: { isCompleted: !fieldMap.isCompleted },
    });
  };

  const handleSelectClaim = (fieldMap: ResourceFieldMap, claimId: string | null) => {
    updateFieldMapMutation.mutate({
      fieldMapId: fieldMap.id,
      data: { claimId },
    });
  };

  const handleUpdateManualValue = (fieldMap: ResourceFieldMap, manualValue: string) => {
    updateFieldMapMutation.mutate({
      fieldMapId: fieldMap.id,
      data: { manualValue },
    });
  };

  const getClaimById = (claimId: string) => claims.find((c: CaseClaim) => c.id === claimId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="dialog-field-map">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" data-testid="text-field-map-title">
            <FileText className="w-5 h-5" />
            Field Mapping: {resourceTitle}
          </DialogTitle>
          <DialogDescription>
            Map form fields to your accepted claims. This helps you prepare answers for each field.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Progress:</span>
            <Badge variant={completedCount === totalCount && totalCount > 0 ? "default" : "secondary"}>
              {completedCount} / {totalCount} fields completed
            </Badge>
          </div>
        </div>

        <Separator />

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3 py-4">
            {fieldMaps.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No fields mapped yet.</p>
                <p className="text-sm">Add fields that appear on this form to track what information you need.</p>
              </div>
            ) : (
              fieldMaps.map((fieldMap) => {
                const isExpanded = expandedFields.has(fieldMap.id);
                const linkedClaim = fieldMap.claimId ? getClaimById(fieldMap.claimId) : null;
                const suggestedClaims = (fieldMap.suggestedClaimIds || [])
                  .map(id => getClaimById(id))
                  .filter(Boolean) as CaseClaim[];

                return (
                  <Card key={fieldMap.id} className={fieldMap.isCompleted ? "border-green-200 bg-green-50/30 dark:bg-green-950/10" : ""} data-testid={`card-field-${fieldMap.id}`}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(fieldMap.id)}>
                      <div className="flex items-center gap-2 p-3">
                        <Checkbox
                          checked={fieldMap.isCompleted}
                          onCheckedChange={() => handleToggleComplete(fieldMap)}
                          data-testid={`checkbox-field-${fieldMap.id}`}
                        />
                        <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left hover:text-primary">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                          <span className={fieldMap.isCompleted ? "line-through text-muted-foreground" : ""}>
                            {fieldMap.fieldLabel}
                          </span>
                        </CollapsibleTrigger>
                        {linkedClaim && (
                          <Badge variant="outline" className="text-xs">
                            Claim linked
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteFieldMapMutation.mutate(fieldMap.id)}
                          data-testid={`button-delete-field-${fieldMap.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-1 space-y-3 border-t">
                          {fieldMap.fieldDescription && (
                            <p className="text-sm text-muted-foreground">{fieldMap.fieldDescription}</p>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Link to Claim</Label>
                            <Select
                              value={fieldMap.claimId || ""}
                              onValueChange={(val) => handleSelectClaim(fieldMap, val || null)}
                            >
                              <SelectTrigger data-testid={`select-claim-${fieldMap.id}`}>
                                <SelectValue placeholder="Select a claim..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">No claim selected</SelectItem>
                                {claims.map((claim: CaseClaim) => (
                                  <SelectItem key={claim.id} value={claim.id}>
                                    <span className="truncate max-w-[400px] block">
                                      {claim.claimText.substring(0, 60)}...
                                    </span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {suggestedClaims.length > 0 && !fieldMap.claimId && (
                            <div className="space-y-2">
                              <Label className="text-xs font-medium flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Suggested Claims
                              </Label>
                              <div className="space-y-1">
                                {suggestedClaims.slice(0, 3).map((claim) => (
                                  <Button
                                    key={claim.id}
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-left h-auto py-2 text-xs"
                                    onClick={() => handleSelectClaim(fieldMap, claim.id)}
                                    data-testid={`button-suggest-${claim.id}`}
                                  >
                                    <span className="truncate">{claim.claimText.substring(0, 80)}...</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}

                          {linkedClaim && (
                            <div className="bg-muted/50 p-2 rounded text-sm">
                              <p className="font-medium text-xs mb-1">Selected Claim:</p>
                              <p>{linkedClaim.claimText}</p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Manual Notes / Answer</Label>
                            <Textarea
                              value={fieldMap.manualValue || ""}
                              onChange={(e) => handleUpdateManualValue(fieldMap, e.target.value)}
                              placeholder="Type your answer or notes here..."
                              rows={2}
                              data-testid={`textarea-manual-${fieldMap.id}`}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                );
              })
            )}
          </div>
        </ScrollArea>

        <Separator />

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-medium">Add New Field</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Field name (e.g., Petitioner's Name)"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddField()}
              data-testid="input-new-field-label"
            />
            <Button
              onClick={handleAddField}
              disabled={!newFieldLabel.trim() || createFieldMapMutation.isPending}
              data-testid="button-add-field"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
          <Input
            placeholder="Optional description..."
            value={newFieldDescription}
            onChange={(e) => setNewFieldDescription(e.target.value)}
            data-testid="input-new-field-description"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
