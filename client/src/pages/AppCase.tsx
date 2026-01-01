import { useState } from "react";
import { Link, useParams } from "wouter";
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
import { FileText, Calendar, MessageSquare, Users, FolderOpen, FileStack, CheckSquare, Clock, Plus, Pencil, Trash2, Baby } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CaseChild } from "@shared/schema";

export default function AppCase() {
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

  const { data: childrenData, isLoading: childrenLoading } = useQuery<{ children: CaseChild[] }>({
    queryKey: ["/api/cases", caseId, "children"],
    queryFn: async () => {
      const res = await fetch(`/api/cases/${caseId}/children`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch children");
      return res.json();
    },
    enabled: !!caseId,
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
      const date = new Date(dob);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch {
      return dob;
    }
  };

  const calculateAge = (dob: string) => {
    try {
      const birthDate = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

  const modules = [
    {
      key: "documents",
      title: "Documents",
      subtitle: "Upload and organize your case documents",
      href: caseId ? `/app/documents/${caseId}` : "/app",
      comingSoon: false,
      Icon: FileText,
    },
    {
      key: "timeline",
      title: "Timeline",
      subtitle: "Track key dates and deadlines",
      href: caseId ? `/app/timeline/${caseId}` : "/app",
      comingSoon: false,
      Icon: Calendar,
    },
    {
      key: "evidence",
      title: "Evidence",
      subtitle: "Manage and organize case evidence",
      href: caseId ? `/app/evidence/${caseId}` : "/app",
      comingSoon: false,
      Icon: FolderOpen,
    },
    {
      key: "exhibits",
      title: "Exhibits",
      subtitle: "Prepare exhibits for court filings",
      href: caseId ? `/app/exhibits/${caseId}` : "/app",
      comingSoon: false,
      Icon: FileStack,
    },
    {
      key: "tasks",
      title: "Tasks",
      subtitle: "Track your to-do items",
      href: caseId ? `/app/tasks/${caseId}` : "/app",
      comingSoon: false,
      Icon: CheckSquare,
    },
    {
      key: "deadlines",
      title: "Deadlines",
      subtitle: "Never miss an important date",
      href: caseId ? `/app/deadlines/${caseId}` : "/app",
      comingSoon: false,
      Icon: Clock,
    },
    {
      key: "messages",
      title: "Messages",
      subtitle: "Secure communication center",
      href: caseId ? `/app/messages/${caseId}` : "/app",
      comingSoon: false,
      Icon: MessageSquare,
    },
    {
      key: "contacts",
      title: "Contacts",
      subtitle: "Manage case-related contacts",
      href: caseId ? `/app/contacts/${caseId}` : "/app",
      comingSoon: false,
      Icon: Users,
    },
  ];

  const children = childrenData?.children || [];

  return (
    <AppLayout>
      <div className="px-4 md:px-8 py-8">
        <div className="rounded-2xl bg-[#e7ebea] p-6 md:p-8 mb-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-bush text-white flex items-center justify-center">
              <span className="text-lg font-semibold"> </span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-2xl md:text-3xl text-neutral-darkest">
                Case Workspace
              </h1>
              <p className="font-sans text-neutral-darkest/70 mt-1">
                This is your central hub for managing your case. Access documents, track deadlines, and stay organized.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {modules.map(({ key, title, subtitle, href, comingSoon, Icon }) => {
            const Tile = (
              <Card
                className={[
                  "h-full rounded-2xl border bg-white",
                  comingSoon ? "opacity-70" : "cursor-pointer hover:shadow-md transition-shadow",
                ].join(" ")}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#f4f6f5] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-bush" />
                    </div>

                    {comingSoon && (
                      <span className="px-3 py-1 rounded-full text-xs bg-neutral-100 text-neutral-600">
                        Coming soon
                      </span>
                    )}
                  </div>

                  <h2 className="mt-6 font-heading font-bold text-lg text-neutral-darkest">{title}</h2>
                  <p className="mt-2 font-sans text-sm text-neutral-darkest/60">{subtitle}</p>
                </CardContent>
              </Card>
            );

            return comingSoon ? (
              <div key={key} data-testid={`tile-${key}`}>{Tile}</div>
            ) : (
              <Link key={key} href={href}>
                <a className="block" data-testid={`tile-${key}`}>{Tile}</a>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 border-t pt-8">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f4f6f5] flex items-center justify-center">
                <Baby className="w-5 h-5 text-bush" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-xl text-neutral-darkest">Children</h2>
                <p className="font-sans text-sm text-neutral-darkest/60">Manage children involved in this case</p>
              </div>
            </div>
            <Button
              onClick={openAddChildDialog}
              className="bg-bush text-white"
              data-testid="button-add-child"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Child
            </Button>
          </div>

          {childrenLoading ? (
            <p className="font-sans text-sm text-neutral-darkest/60">Loading...</p>
          ) : children.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Baby className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-4" />
                <p className="font-sans text-neutral-darkest/60 mb-4">
                  No children added to this case yet.
                </p>
                <Button
                  onClick={openAddChildDialog}
                  variant="outline"
                  data-testid="button-add-first-child"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Child
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => {
                const age = calculateAge(child.dateOfBirth);
                return (
                  <Card key={child.id} className="bg-white" data-testid={`card-child-${child.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-heading font-bold text-base text-neutral-darkest">
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
                        <div className="flex items-center gap-1">
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
        </div>

        <div className="mt-10 border-t pt-8">
          <h2 className="font-heading font-bold text-xl text-neutral-darkest">Case Details</h2>
        </div>
      </div>

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
          <DialogFooter>
            <Button variant="outline" onClick={closeChildDialog} data-testid="button-cancel-child">
              Cancel
            </Button>
            <Button
              onClick={handleChildSubmit}
              disabled={createChildMutation.isPending || updateChildMutation.isPending}
              className="bg-bush text-white"
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
              Are you sure you want to remove this child from your case? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-child">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChildId && deleteChildMutation.mutate(deleteChildId)}
              className="bg-destructive text-destructive-foreground"
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
