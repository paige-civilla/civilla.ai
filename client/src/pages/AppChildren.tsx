import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Baby, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Case, CaseChild } from "@shared/schema";
import { Link } from "wouter";
import ModuleIntro from "@/components/app/ModuleIntro";

export default function AppChildren() {
  const params = useParams() as { caseId?: string };
  const caseId = params.caseId || "";
  const { toast } = useToast();

  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<CaseChild | null>(null);
  const [deleteChildId, setDeleteChildId] = useState<string | null>(null);
  const [childForm, setChildForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    notes: "",
  });

  const { data: caseData, isLoading: caseLoading } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const caseRecord = caseData?.case;

  const { data: childrenData, isLoading: childrenLoading } = useQuery<{ children: CaseChild[] }>({
    queryKey: ["/api/cases", caseId, "children"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/children`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch children");
      return res.json();
    },
    enabled: !!caseId,
  });

  const children = childrenData?.children || [];

  const enableChildrenMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", `/api/cases/${caseId}`, { hasChildren: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId] });
      toast({ title: "Children module enabled for this case" });
    },
    onError: () => {
      toast({ title: "Failed to enable children module", variant: "destructive" });
    },
  });

  const createChildMutation = useMutation({
    mutationFn: async (data: typeof childForm) => {
      return apiRequest("POST", `/api/cases/${caseId}/children`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "children"] });
      toast({ title: "Child added successfully" });
      closeChildDialog();
    },
    onError: () => {
      toast({ title: "Failed to add child", variant: "destructive" });
    },
  });

  const updateChildMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof childForm }) => {
      return apiRequest("PATCH", `/api/children/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "children"] });
      toast({ title: "Child updated successfully" });
      closeChildDialog();
    },
    onError: () => {
      toast({ title: "Failed to update child", variant: "destructive" });
    },
  });

  const deleteChildMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/children/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "children"] });
      toast({ title: "Child removed successfully" });
      setDeleteChildId(null);
    },
    onError: () => {
      toast({ title: "Failed to remove child", variant: "destructive" });
    },
  });

  const openAddChildDialog = () => {
    setEditingChild(null);
    setChildForm({ firstName: "", lastName: "", dateOfBirth: "", notes: "" });
    setChildDialogOpen(true);
  };

  const openEditChildDialog = (child: CaseChild) => {
    setEditingChild(child);
    setChildForm({
      firstName: child.firstName,
      lastName: child.lastName || "",
      dateOfBirth: child.dateOfBirth,
      notes: child.notes || "",
    });
    setChildDialogOpen(true);
  };

  const closeChildDialog = () => {
    setChildDialogOpen(false);
    setEditingChild(null);
    setChildForm({ firstName: "", lastName: "", dateOfBirth: "", notes: "" });
  };

  const handleChildSubmit = () => {
    if (!childForm.firstName.trim() || !childForm.dateOfBirth.trim()) {
      toast({ title: "First name and date of birth are required", variant: "destructive" });
      return;
    }

    if (editingChild) {
      updateChildMutation.mutate({ id: editingChild.id, data: childForm });
    } else {
      createChildMutation.mutate(childForm);
    }
  };

  const formatDob = (dob: string) => {
    try {
      return new Date(dob).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dob;
    }
  };

  const calculateAge = (dob: string): number | null => {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 0 ? age : null;
    } catch {
      return null;
    }
  };

  const isLoading = caseLoading || childrenLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (!caseRecord) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Case not found</p>
        </div>
      </AppLayout>
    );
  }

  const childrenEnabled = caseRecord.hasChildren || children.length > 0;

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex items-center gap-3 mb-6">
            <Link href={`/app/dashboard/${caseId}`}>
              <Button variant="ghost" size="icon" data-testid="button-back-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--module-tile-icon))] flex items-center justify-center">
                <Baby className="w-5 h-5 text-[#314143]" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-neutral-darkest">Children</h1>
                <p className="font-sans text-sm text-neutral-darkest/60">{caseRecord.title}</p>
              </div>
            </div>
          </div>

          <ModuleIntro
            title="About Children Information"
            paragraphs={[
              "If your case involves children, this section helps you organize information about each child, including basic details and relevant notes.",
              "This information may be needed for various court forms and filings."
            ]}
          />

          {!childrenEnabled ? (
            <Card className="w-full border-dashed">
              <CardContent className="p-8 sm:p-12 text-center">
                <Baby className="w-16 h-16 text-neutral-darkest/30 mx-auto mb-4" />
                <h2 className="font-heading font-bold text-lg text-neutral-darkest mb-2">
                  Children Module Not Enabled
                </h2>
                <p className="font-sans text-neutral-darkest/60 mb-6 max-w-md mx-auto">
                  You marked this case as having no children. If that's incorrect, you can enable the Children module for this case.
                </p>
                <Button
                  onClick={() => enableChildrenMutation.mutate()}
                  disabled={enableChildrenMutation.isPending}
                  className="bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A] min-h-[44px] w-full sm:w-auto"
                  data-testid="button-enable-children"
                >
                  {enableChildrenMutation.isPending ? "Enabling..." : "Enable Children for this Case"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between w-full mb-6">
                <p className="font-sans text-sm text-neutral-darkest/60">
                  {children.length} {children.length === 1 ? "child" : "children"} in this case
                </p>
                <Button
                  onClick={openAddChildDialog}
                  className="bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A] min-h-[44px]"
                  data-testid="button-add-child"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Child
                </Button>
              </div>

              {children.length === 0 ? (
                <Card className="w-full border-dashed">
                  <CardContent className="p-8 text-center">
                    <Baby className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-4" />
                    <p className="font-sans text-neutral-darkest/60 mb-4">
                      No children added to this case yet.
                    </p>
                    <Button
                      onClick={openAddChildDialog}
                      variant="outline"
                      className="min-h-[44px] w-full sm:w-auto"
                      data-testid="button-add-first-child"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Child
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {children.map((child) => {
                    const age = calculateAge(child.dateOfBirth);
                    return (
                      <Card key={child.id} className="bg-white" data-testid={`card-child-${child.id}`}>
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-heading font-bold text-base text-neutral-darkest truncate">
                                {child.firstName} {child.lastName || ""}
                              </h3>
                              <p className="font-sans text-sm text-neutral-darkest/60 mt-1">
                                Born: {formatDob(child.dateOfBirth)}
                                {age !== null && ` (${age} years old)`}
                              </p>
                              {child.notes && (
                                <p className="font-sans text-sm text-neutral-darkest/50 mt-2 line-clamp-2">
                                  {child.notes}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditChildDialog(child)}
                                data-testid={`button-edit-child-${child.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteChildId(child.id)}
                                data-testid={`button-delete-child-${child.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingChild ? "Edit Child" : "Add Child"}</DialogTitle>
            <DialogDescription>
              {editingChild ? "Update the child's information." : "Enter the child's information."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="child-firstName">First Name *</Label>
              <Input
                id="child-firstName"
                value={childForm.firstName}
                onChange={(e) => setChildForm({ ...childForm, firstName: e.target.value })}
                placeholder="First name"
                data-testid="input-child-firstName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-lastName">Last Name</Label>
              <Input
                id="child-lastName"
                value={childForm.lastName}
                onChange={(e) => setChildForm({ ...childForm, lastName: e.target.value })}
                placeholder="Last name (optional)"
                data-testid="input-child-lastName"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-dob">Date of Birth *</Label>
              <Input
                id="child-dob"
                type="date"
                value={childForm.dateOfBirth}
                onChange={(e) => setChildForm({ ...childForm, dateOfBirth: e.target.value })}
                data-testid="input-child-dob"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child-notes">Notes</Label>
              <Textarea
                id="child-notes"
                value={childForm.notes}
                onChange={(e) => setChildForm({ ...childForm, notes: e.target.value })}
                placeholder="Any additional notes (optional)"
                rows={3}
                data-testid="input-child-notes"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeChildDialog} className="min-h-[44px]" data-testid="button-cancel-child">
              Cancel
            </Button>
            <Button
              onClick={handleChildSubmit}
              disabled={createChildMutation.isPending || updateChildMutation.isPending}
              className="bg-[#314143] text-[#F2F2F2] hover:bg-[#27363A] min-h-[44px]"
              data-testid="button-save-child"
            >
              {createChildMutation.isPending || updateChildMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteChildId} onOpenChange={(open) => !open && setDeleteChildId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Child</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this child from the case? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChildId && deleteChildMutation.mutate(deleteChildId)}
              className="bg-[#7A1E2D] hover:bg-[#5C1622] min-h-[44px]"
              data-testid="button-confirm-delete-child"
            >
              {deleteChildMutation.isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
