import { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Users, Briefcase, Plus, Search, Edit, Trash2, Copy, Phone, Mail, Building, MapPin, StickyNote, Check, X, ArrowRightLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Case, CaseContact, contactRoles } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "opposing_party", label: "Opposing Party" },
  { value: "opposing_counsel", label: "Opposing Counsel" },
  { value: "mediator", label: "Mediator" },
  { value: "gal", label: "Guardian ad Litem (GAL)" },
  { value: "school", label: "School" },
  { value: "therapist", label: "Therapist" },
  { value: "other", label: "Other" },
];

function getRoleLabel(role: string): string {
  const found = ROLE_OPTIONS.find((r) => r.value === role);
  return found ? found.label : role;
}

export default function AppContacts() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "az">("az");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<CaseContact | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    role: "other",
    contactGroup: "case" as "case" | "witness",
    organizationOrFirm: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery<{ contacts: CaseContact[] }>({
    queryKey: ["/api/cases", caseId, "contacts"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const contacts = contactsData?.contacts || [];

  const uniqueRoles = useMemo(() => {
    const roles = new Set(contacts.map((c) => c.role));
    return Array.from(roles);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let result = contacts;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          (c.role && getRoleLabel(c.role).toLowerCase().includes(term)) ||
          (c.organizationOrFirm && c.organizationOrFirm.toLowerCase().includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.phone && c.phone.toLowerCase().includes(term))
      );
    }

    if (filterRole !== "all") {
      result = result.filter((c) => c.role === filterRole);
    }

    result = [...result].sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [contacts, searchTerm, filterRole, sortOrder]);

  useEffect(() => {
    if (currentCase) {
      localStorage.setItem("selectedCaseId", currentCase.id);
    }
  }, [currentCase]);

  useEffect(() => {
    if (!caseLoading && !currentCase && caseId) {
      if (caseError && (caseError as any).status === 401) {
        setLocation("/login?reason=session");
      } else {
        setLocation("/app/cases");
      }
    }
  }, [caseLoading, currentCase, caseId, caseError, setLocation]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", `/api/cases/${caseId}/contacts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      toast({ title: "Contact added", description: "Contact created successfully." });
      closeModal();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create contact", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: typeof formData }) => {
      return apiRequest("PATCH", `/api/contacts/${contactId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      toast({ title: "Contact updated", description: "Contact saved successfully." });
      closeModal();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to update contact", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest("DELETE", `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      toast({ title: "Contact deleted", description: "Contact removed successfully." });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to delete contact", variant: "destructive" });
    },
  });

  const openAddModal = (defaultGroup: "case" | "witness" = "case") => {
    setEditingContact(null);
    setFormData({
      name: "",
      role: "other",
      contactGroup: defaultGroup,
      organizationOrFirm: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (contact: CaseContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      role: contact.role || "other",
      contactGroup: (contact.contactGroup as "case" | "witness") || "case",
      organizationOrFirm: contact.organizationOrFirm || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      notes: contact.notes || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingContact(null);
    setFormData({
      name: "",
      role: "other",
      contactGroup: "case",
      organizationOrFirm: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: "Validation error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (editingContact) {
      updateMutation.mutate({ contactId: editingContact.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({ title: "Copied", description: `${field} copied to clipboard` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard", variant: "destructive" });
    }
  };

  const copyFullContact = (contact: CaseContact) => {
    const lines: string[] = [];
    lines.push(`Full Name: ${contact.name}`);
    if (contact.role) lines.push(`Role: ${getRoleLabel(contact.role)}`);
    if (contact.organizationOrFirm) lines.push(`Organization/Firm: ${contact.organizationOrFirm}`);
    if (contact.phone) lines.push(`Phone: ${contact.phone}`);
    if (contact.email) lines.push(`Email: ${contact.email}`);
    if (contact.address) lines.push(`Address: ${contact.address}`);
    if (contact.notes) lines.push(`Notes: ${contact.notes}`);
    copyToClipboard(lines.join("\n"), "Full contact");
    toast({ title: "Copied full contact to clipboard" });
  };

  const moveContactMutation = useMutation({
    mutationFn: async ({ contactId, newGroup }: { contactId: string; newGroup: "case" | "witness" }) => {
      return apiRequest("PATCH", `/api/contacts/${contactId}`, { contactGroup: newGroup });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      toast({ title: "Contact moved", description: "Contact group updated." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to move contact", variant: "destructive" });
    },
  });

  const caseContacts = useMemo(() => {
    return filteredContacts.filter(c => c.contactGroup !== "witness");
  }, [filteredContacts]);

  const witnessContacts = useMemo(() => {
    return filteredContacts.filter(c => c.contactGroup === "witness");
  }, [filteredContacts]);

  if (caseLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (caseError || !currentCase) {
    return (
      <AppLayout>
        <section className="w-full flex flex-col items-center px-5 md:px-16 py-10 md:py-16">
          <div className="flex flex-col items-center text-center max-w-md">
            <p className="font-sans text-neutral-darkest/70 mb-4">Case not found or you don't have access.</p>
            <Link
              href="/app/cases"
              className="inline-flex items-center gap-2 text-sm text-primary font-medium"
              data-testid="link-back-to-cases"
            >
              <Briefcase className="w-4 h-4" />
              Back to Cases
            </Link>
          </div>
        </section>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <Link
            href={`/app/dashboard/${caseId}`}
            className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-6"
            data-testid="link-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full mb-6">
            <div>
              <p className="font-sans text-sm text-neutral-darkest/60 mb-1">Contacts</p>
              <h1 className="font-heading font-bold text-heading-3-mobile md:text-heading-3 text-neutral-darkest">
                {currentCase.title}
              </h1>
            </div>
            <Button onClick={() => openAddModal()} className="min-h-[44px]" data-testid="button-add-contact">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>

          <ModuleIntro
            title="About Case Contacts"
            paragraphs={[
              "Keep track of people involved in your case, including the other party, attorneys, witnesses, and court personnel.",
              "Having contact information organized saves time when you need to reach someone."
            ]}
          />

          <div className="flex flex-col sm:flex-row gap-3 w-full mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-darkest/40" />
              <Input
                placeholder="Search by name, role, org, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 min-h-[44px]"
                data-testid="input-search-contacts"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-48 min-h-[44px]" data-testid="select-filter-role">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "az")}>
              <SelectTrigger className="w-full sm:w-40 min-h-[44px]" data-testid="select-sort-order">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="az">A–Z</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contactsLoading ? (
            <div className="w-full py-12 text-center">
              <p className="font-sans text-neutral-darkest/60">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="w-full bg-[#e7ebea] rounded-lg p-8 md:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-xl text-neutral-darkest mb-2">No Contacts Yet</h2>
              <p className="font-sans text-sm text-neutral-darkest/70 max-w-md mb-6">
                Add attorneys, witnesses, mediators, and other parties involved in your case.
              </p>
              <Button onClick={() => openAddModal()} className="min-h-[44px]" data-testid="button-add-first-contact">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Contact
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest">Case Contacts</h2>
                  <Button size="sm" variant="outline" onClick={() => openAddModal("case")} data-testid="button-add-case-contact">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {caseContacts.length === 0 ? (
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No case contacts yet. Add attorneys, the other party, school, doctors, etc.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {caseContacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={openEditModal}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onCopyFull={copyFullContact}
                        onCopyField={copyToClipboard}
                        onMove={(id) => moveContactMutation.mutate({ contactId: id, newGroup: "witness" })}
                        moveLabel="Move to Witnesses"
                        deleteConfirmId={deleteConfirmId}
                        setDeleteConfirmId={setDeleteConfirmId}
                        deletePending={deleteMutation.isPending}
                        movePending={moveContactMutation.isPending}
                        getRoleLabel={getRoleLabel}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest">Witnesses</h2>
                  <Button size="sm" variant="outline" onClick={() => openAddModal("witness")} data-testid="button-add-witness">
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {witnessContacts.length === 0 ? (
                  <div className="bg-muted/50 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No witnesses yet. Add people who can testify or provide statements.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {witnessContacts.map((contact) => (
                      <ContactCard
                        key={contact.id}
                        contact={contact}
                        onEdit={openEditModal}
                        onDelete={(id) => deleteMutation.mutate(id)}
                        onCopyFull={copyFullContact}
                        onCopyField={copyToClipboard}
                        onMove={(id) => moveContactMutation.mutate({ contactId: id, newGroup: "case" })}
                        moveLabel="Move to Case Contacts"
                        deleteConfirmId={deleteConfirmId}
                        setDeleteConfirmId={setDeleteConfirmId}
                        deletePending={deleteMutation.isPending}
                        movePending={moveContactMutation.isPending}
                        getRoleLabel={getRoleLabel}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Dialog open={modalOpen} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name *</Label>
              <Input
                id="contact-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
                maxLength={200}
                className="min-h-[44px]"
                data-testid="input-contact-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-role">Role</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger id="contact-role" className="min-h-[44px]" data-testid="select-contact-role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-type">Contact Type</Label>
              <Select value={formData.contactGroup} onValueChange={(v) => setFormData({ ...formData, contactGroup: v as "case" | "witness" })}>
                <SelectTrigger id="contact-type" className="min-h-[44px]" data-testid="select-contact-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="case">Case Contact</SelectItem>
                  <SelectItem value="witness">Witness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-org">Organization / Firm</Label>
              <Input
                id="contact-org"
                value={formData.organizationOrFirm}
                onChange={(e) => setFormData({ ...formData, organizationOrFirm: e.target.value })}
                placeholder="Company, firm, or institution"
                maxLength={200}
                className="min-h-[44px]"
                data-testid="input-contact-org"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                maxLength={200}
                className="min-h-[44px]"
                data-testid="input-contact-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Input
                id="contact-phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                maxLength={30}
                className="min-h-[44px]"
                data-testid="input-contact-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-address">Address</Label>
              <Input
                id="contact-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street, city, state, zip"
                maxLength={500}
                className="min-h-[44px]"
                data-testid="input-contact-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-notes">Notes</Label>
              <Textarea
                id="contact-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this contact..."
                rows={3}
                maxLength={2000}
                data-testid="textarea-contact-notes"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={closeModal} className="w-full sm:w-auto min-h-[44px]" data-testid="button-cancel-contact">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || !formData.name.trim()}
              className="w-full sm:w-auto min-h-[44px]"
              data-testid="button-save-contact"
            >
              {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : editingContact ? "Save Changes" : "Add Contact"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

interface ContactCardProps {
  contact: CaseContact;
  onEdit: (contact: CaseContact) => void;
  onDelete: (id: string) => void;
  onCopyFull: (contact: CaseContact) => void;
  onCopyField: (text: string, field: string) => void;
  onMove: (id: string) => void;
  moveLabel: string;
  deleteConfirmId: string | null;
  setDeleteConfirmId: (id: string | null) => void;
  deletePending: boolean;
  movePending: boolean;
  getRoleLabel: (role: string) => string;
}

function ContactCard({
  contact,
  onEdit,
  onDelete,
  onCopyFull,
  onCopyField,
  onMove,
  moveLabel,
  deleteConfirmId,
  setDeleteConfirmId,
  deletePending,
  movePending,
  getRoleLabel,
}: ContactCardProps) {
  return (
    <Card className="bg-white border border-neutral-darkest/10" data-testid={`card-contact-${contact.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-neutral-darkest truncate" data-testid={`text-contact-name-${contact.id}`}>
              {contact.name}
            </h3>
            {contact.role && (
              <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded mt-1">
                {getRoleLabel(contact.role)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" data-testid={`button-copy-menu-${contact.id}`} title="Copy">
                  <Copy className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {contact.email && (
                  <DropdownMenuItem onClick={() => onCopyField(contact.email!, "Email")}>
                    <Mail className="w-4 h-4 mr-2" />
                    Copy Email
                  </DropdownMenuItem>
                )}
                {contact.phone && (
                  <DropdownMenuItem onClick={() => onCopyField(contact.phone!, "Phone")}>
                    <Phone className="w-4 h-4 mr-2" />
                    Copy Phone
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onCopyFull(contact)}>
                  <Users className="w-4 h-4 mr-2" />
                  Copy Full Contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onMove(contact.id)}
              disabled={movePending}
              data-testid={`button-move-${contact.id}`}
              title={moveLabel}
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => onEdit(contact)} data-testid={`button-edit-contact-${contact.id}`} title="Edit">
              <Edit className="w-4 h-4" />
            </Button>
            {deleteConfirmId === contact.id ? (
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => onDelete(contact.id)}
                  disabled={deletePending}
                  data-testid={`button-confirm-delete-${contact.id}`}
                  title="Confirm"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                  data-testid={`button-cancel-delete-${contact.id}`}
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmId(contact.id)} data-testid={`button-delete-contact-${contact.id}`} title="Delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 text-sm text-neutral-darkest/70">
          {contact.organizationOrFirm && (
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{contact.organizationOrFirm}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </div>
          )}
          {contact.address && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{contact.address}</span>
            </div>
          )}
          {contact.notes && (
            <div className="flex items-start gap-2 pt-1">
              <StickyNote className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{contact.notes}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
