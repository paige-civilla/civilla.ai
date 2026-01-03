import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Plus, Pencil, Trash2, MessageSquare, User, Phone, Mail, Building, CheckCircle, Clock, Calendar, Send, ArrowUpRight, Pin, PinOff, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isPast } from "date-fns";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertContactSchema, insertCommunicationSchema, type Case, type CaseContact, type CaseCommunication, type InsertContact, type InsertCommunication, contactRoles, communicationDirections, communicationChannels, communicationStatuses } from "@shared/schema";
import { cn } from "@/lib/utils";
import { z } from "zod";

const roleLabels: Record<string, string> = {
  opposing_party: "Opposing Party",
  opposing_counsel: "Opposing Counsel",
  mediator: "Mediator",
  gal: "Guardian ad Litem",
  school: "School",
  therapist: "Therapist",
  other: "Other",
};

const channelLabels: Record<string, string> = {
  email: "Email",
  text: "Text Message",
  call: "Phone Call",
  in_person: "In Person",
  portal: "Court Portal",
  other: "Other",
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  received: "Received",
  no_response: "No Response",
  resolved: "Resolved",
};

const directionLabels: Record<string, string> = {
  outgoing: "Outgoing",
  incoming: "Incoming",
};

export default function AppCommunications() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("communications");
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [editContact, setEditContact] = useState<CaseContact | null>(null);
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<CaseContact | null>(null);
  const [isCommDialogOpen, setIsCommDialogOpen] = useState(false);
  const [editComm, setEditComm] = useState<CaseCommunication | null>(null);
  const [deleteCommConfirm, setDeleteCommConfirm] = useState<CaseCommunication | null>(null);

  const { data: caseData, isLoading, isError } = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const { data: contactsData, isLoading: contactsLoading } = useQuery<{ contacts: CaseContact[] }>({
    queryKey: ["/api/cases", caseId, "contacts"],
    enabled: !!caseId,
  });

  const { data: communicationsData, isLoading: commsLoading } = useQuery<{ communications: CaseCommunication[] }>({
    queryKey: ["/api/cases", caseId, "communications"],
    enabled: !!caseId,
  });

  const currentCase = caseData?.case;
  const contacts = contactsData?.contacts || [];
  const communications = communicationsData?.communications || [];

  const createContactMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return apiRequest("POST", `/api/cases/${caseId}/contacts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      setIsContactDialogOpen(false);
      toast({ title: "Contact created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create contact", description: error.message, variant: "destructive" });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ contactId, data }: { contactId: string; data: Partial<InsertContact> }) => {
      return apiRequest("PATCH", `/api/contacts/${contactId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      setEditContact(null);
      toast({ title: "Contact updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update contact", description: error.message, variant: "destructive" });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: string) => {
      return apiRequest("DELETE", `/api/contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "contacts"] });
      setDeleteContactConfirm(null);
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete contact", description: error.message, variant: "destructive" });
    },
  });

  const createCommMutation = useMutation({
    mutationFn: async (data: InsertCommunication) => {
      return apiRequest("POST", `/api/cases/${caseId}/communications`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      setIsCommDialogOpen(false);
      toast({ title: "Communication logged successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to log communication", description: error.message, variant: "destructive" });
    },
  });

  const updateCommMutation = useMutation({
    mutationFn: async ({ commId, data }: { commId: string; data: Partial<InsertCommunication> }) => {
      return apiRequest("PATCH", `/api/communications/${commId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      setEditComm(null);
      toast({ title: "Communication updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update communication", description: error.message, variant: "destructive" });
    },
  });

  const deleteCommMutation = useMutation({
    mutationFn: async (commId: string) => {
      return apiRequest("DELETE", `/api/communications/${commId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      setDeleteCommConfirm(null);
      toast({ title: "Communication deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete communication", description: error.message, variant: "destructive" });
    },
  });

  const pushToTimelineMutation = useMutation({
    mutationFn: async (commId: string) => {
      return apiRequest("POST", `/api/communications/${commId}/push-to-timeline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      toast({ title: "Added to timeline" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to push to timeline", description: error.message, variant: "destructive" });
    },
  });

  const pushToCalendarMutation = useMutation({
    mutationFn: async (commId: string) => {
      return apiRequest("POST", `/api/communications/${commId}/push-to-calendar`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      toast({ title: "Follow-up added to calendar" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to push to calendar", description: error.message, variant: "destructive" });
    },
  });

  const markResolvedMutation = useMutation({
    mutationFn: async (commId: string) => {
      return apiRequest("POST", `/api/communications/${commId}/mark-resolved`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "communications"] });
      toast({ title: "Marked as resolved" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to mark resolved", description: error.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (currentCase) {
      localStorage.setItem("selectedCaseId", currentCase.id);
    }
  }, [currentCase]);

  useEffect(() => {
    if (!isLoading && !currentCase && caseId) {
      setLocation("/app/cases");
    }
  }, [isLoading, currentCase, caseId, setLocation]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <p className="font-sans text-neutral-darkest/60">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (isError || !currentCase) {
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

  const getContactById = (id: string | null) => contacts.find(c => c.id === id);

  const pinnedComms = communications.filter(c => c.pinned);
  const unpinnedComms = communications.filter(c => !c.pinned);
  const sortedComms = [...pinnedComms, ...unpinnedComms];

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <Link
            href={`/app/dashboard/${caseId}`}
            className="inline-flex items-center gap-2 text-sm text-primary font-medium mb-4 sm:mb-6 min-h-[44px]"
            data-testid="link-back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 w-full mb-6 sm:mb-8">
            <div>
              <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-neutral-darkest" data-testid="text-page-title">
                Communications Log
              </h1>
              <p className="text-sm sm:text-base text-neutral-darkest/70 mt-1" data-testid="text-case-title">
                {currentCase.title}
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="communications" data-testid="tab-communications">
                <MessageSquare className="w-4 h-4 mr-2" />
                Communications
              </TabsTrigger>
              <TabsTrigger value="contacts" data-testid="tab-contacts">
                <User className="w-4 h-4 mr-2" />
                Contacts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="communications">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setIsCommDialogOpen(true)}
                  data-testid="button-add-communication"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Log Communication
                </Button>
              </div>

              {commsLoading ? (
                <p className="text-neutral-darkest/60">Loading...</p>
              ) : sortedComms.length === 0 ? (
                <Card className="bg-white border-[#A2BEC2]">
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-4" />
                    <p className="text-neutral-darkest/70 mb-4">No communications logged yet.</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsCommDialogOpen(true)}
                      data-testid="button-add-first-communication"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Your First Communication
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sortedComms.map((comm) => {
                    const contact = getContactById(comm.contactId);
                    const isOverdue = comm.followUpAt && isPast(new Date(comm.followUpAt)) && comm.status !== "resolved";

                    return (
                      <Card
                        key={comm.id}
                        className={cn(
                          "bg-white border-[#A2BEC2]",
                          comm.pinned && "ring-2 ring-primary/30"
                        )}
                        data-testid={`card-communication-${comm.id}`}
                      >
                        <CardContent className="py-4">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {comm.pinned && (
                                  <Pin className="w-4 h-4 text-primary" />
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {directionLabels[comm.direction] || comm.direction}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {channelLabels[comm.channel] || comm.channel}
                                </Badge>
                                <Badge
                                  variant={comm.status === "resolved" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {statusLabels[comm.status] || comm.status}
                                </Badge>
                                {isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Overdue
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-neutral-darkest">
                                  {contact?.name || "Unknown Contact"}
                                </span>
                                {contact && (
                                  <span className="text-sm text-neutral-darkest/60">
                                    ({roleLabels[contact.role] || contact.role})
                                  </span>
                                )}
                              </div>

                              {comm.subject && (
                                <p className="text-sm font-medium text-neutral-darkest/80 mb-1">
                                  {comm.subject}
                                </p>
                              )}

                              <p className="text-sm text-neutral-darkest/70 line-clamp-2">
                                {comm.summary}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-darkest/60">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(comm.occurredAt), "MMM d, yyyy h:mm a")}
                                </span>
                                {comm.followUpAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Follow up: {format(new Date(comm.followUpAt), "MMM d, yyyy")}
                                  </span>
                                )}
                                {comm.timelineEventId && (
                                  <Badge variant="outline" className="text-xs">
                                    On Timeline
                                  </Badge>
                                )}
                                {comm.calendarItemId && (
                                  <Badge variant="outline" className="text-xs">
                                    On Calendar
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {comm.status !== "resolved" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => markResolvedMutation.mutate(comm.id)}
                                  disabled={markResolvedMutation.isPending}
                                  data-testid={`button-resolve-${comm.id}`}
                                  title="Mark Resolved"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {!comm.timelineEventId && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => pushToTimelineMutation.mutate(comm.id)}
                                  disabled={pushToTimelineMutation.isPending}
                                  data-testid={`button-push-timeline-${comm.id}`}
                                  title="Add to Timeline"
                                >
                                  <ArrowUpRight className="w-4 h-4" />
                                </Button>
                              )}
                              {!comm.calendarItemId && comm.followUpAt && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => pushToCalendarMutation.mutate(comm.id)}
                                  disabled={pushToCalendarMutation.isPending}
                                  data-testid={`button-push-calendar-${comm.id}`}
                                  title="Add Follow-up to Calendar"
                                >
                                  <Calendar className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditComm(comm)}
                                data-testid={`button-edit-communication-${comm.id}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteCommConfirm(comm)}
                                data-testid={`button-delete-communication-${comm.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="contacts">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => setIsContactDialogOpen(true)}
                  data-testid="button-add-contact"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Contact
                </Button>
              </div>

              {contactsLoading ? (
                <p className="text-neutral-darkest/60">Loading...</p>
              ) : contacts.length === 0 ? (
                <Card className="bg-white border-[#A2BEC2]">
                  <CardContent className="py-12 text-center">
                    <User className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-4" />
                    <p className="text-neutral-darkest/70 mb-4">No contacts added yet.</p>
                    <Button
                      variant="outline"
                      onClick={() => setIsContactDialogOpen(true)}
                      data-testid="button-add-first-contact"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Contact
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {contacts.map((contact) => (
                    <Card
                      key={contact.id}
                      className="bg-white border-[#A2BEC2]"
                      data-testid={`card-contact-${contact.id}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-neutral-darkest">
                                {contact.name}
                              </span>
                              <Badge variant="secondary" className="text-xs">
                                {roleLabels[contact.role] || contact.role}
                              </Badge>
                            </div>

                            {contact.organizationOrFirm && (
                              <p className="text-sm text-neutral-darkest/70 flex items-center gap-1 mb-1">
                                <Building className="w-3 h-3" />
                                {contact.organizationOrFirm}
                              </p>
                            )}

                            <div className="flex flex-col gap-1 text-sm text-neutral-darkest/70">
                              {contact.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                </span>
                              )}
                              {contact.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {contact.phone}
                                </span>
                              )}
                            </div>

                            {contact.notes && (
                              <p className="text-sm text-neutral-darkest/60 mt-2 line-clamp-2">
                                {contact.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditContact(contact)}
                              data-testid={`button-edit-contact-${contact.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteContactConfirm(contact)}
                              data-testid={`button-delete-contact-${contact.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <ContactDialog
        open={isContactDialogOpen || !!editContact}
        onOpenChange={(open) => {
          if (!open) {
            setIsContactDialogOpen(false);
            setEditContact(null);
          }
        }}
        contact={editContact}
        onSubmit={(data) => {
          if (editContact) {
            updateContactMutation.mutate({ contactId: editContact.id, data });
          } else {
            createContactMutation.mutate(data);
          }
        }}
        isSubmitting={createContactMutation.isPending || updateContactMutation.isPending}
      />

      <CommunicationDialog
        open={isCommDialogOpen || !!editComm}
        onOpenChange={(open) => {
          if (!open) {
            setIsCommDialogOpen(false);
            setEditComm(null);
          }
        }}
        communication={editComm}
        contacts={contacts}
        onSubmit={(data) => {
          if (editComm) {
            updateCommMutation.mutate({ commId: editComm.id, data });
          } else {
            createCommMutation.mutate(data);
          }
        }}
        isSubmitting={createCommMutation.isPending || updateCommMutation.isPending}
      />

      <Dialog open={!!deleteContactConfirm} onOpenChange={() => setDeleteContactConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contact</DialogTitle>
          </DialogHeader>
          <p className="text-neutral-darkest/70">
            Are you sure you want to delete "{deleteContactConfirm?.name}"? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteContactConfirm(null)} data-testid="button-cancel-delete-contact">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteContactConfirm && deleteContactMutation.mutate(deleteContactConfirm.id)}
              disabled={deleteContactMutation.isPending}
              data-testid="button-confirm-delete-contact"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteCommConfirm} onOpenChange={() => setDeleteCommConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Communication</DialogTitle>
          </DialogHeader>
          <p className="text-neutral-darkest/70">
            Are you sure you want to delete this communication? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteCommConfirm(null)} data-testid="button-cancel-delete-communication">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteCommConfirm && deleteCommMutation.mutate(deleteCommConfirm.id)}
              disabled={deleteCommMutation.isPending}
              data-testid="button-confirm-delete-communication"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  contact,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: CaseContact | null;
  onSubmit: (data: InsertContact) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      role: "other",
      organizationOrFirm: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (contact) {
      form.reset({
        name: contact.name,
        role: contact.role || "other",
        organizationOrFirm: contact.organizationOrFirm || "",
        email: contact.email || "",
        phone: contact.phone || "",
        address: contact.address || "",
        notes: contact.notes || "",
      });
    } else {
      form.reset({
        name: "",
        role: "other",
        organizationOrFirm: "",
        email: "",
        phone: "",
        address: "",
        notes: "",
      });
    }
  }, [contact, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit Contact" : "Add Contact"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} data-testid="input-contact-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || "other"}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contact-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contactRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {roleLabels[role] || role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationOrFirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization / Firm</FormLabel>
                  <FormControl>
                    <Input placeholder="Law firm, school, etc." {...field} value={field.value || ""} data-testid="input-contact-org" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@example.com" {...field} value={field.value || ""} data-testid="input-contact-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 123-4567" {...field} value={field.value || ""} data-testid="input-contact-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this contact..."
                      {...field}
                      value={field.value || ""}
                      data-testid="input-contact-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-contact">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-save-contact">
                {isSubmitting ? "Saving..." : contact ? "Save Changes" : "Add Contact"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CommunicationDialog({
  open,
  onOpenChange,
  communication,
  contacts,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communication: CaseCommunication | null;
  contacts: CaseContact[];
  onSubmit: (data: InsertCommunication) => void;
  isSubmitting: boolean;
}) {
  const [occurredDate, setOccurredDate] = useState<Date | undefined>(new Date());
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(undefined);

  const form = useForm<InsertCommunication>({
    resolver: zodResolver(insertCommunicationSchema),
    defaultValues: {
      contactId: null,
      direction: "outgoing",
      channel: "email",
      status: "sent",
      subject: "",
      summary: "",
      needsFollowUp: false,
      pinned: false,
    },
  });

  useEffect(() => {
    if (communication) {
      form.reset({
        contactId: communication.contactId,
        direction: communication.direction as any || "outgoing",
        channel: communication.channel as any || "email",
        status: communication.status as any || "sent",
        subject: communication.subject || "",
        summary: communication.summary,
        needsFollowUp: communication.needsFollowUp,
        pinned: communication.pinned,
      });
      setOccurredDate(new Date(communication.occurredAt));
      setFollowUpDate(communication.followUpAt ? new Date(communication.followUpAt) : undefined);
    } else {
      form.reset({
        contactId: null,
        direction: "outgoing",
        channel: "email",
        status: "sent",
        subject: "",
        summary: "",
        needsFollowUp: false,
        pinned: false,
      });
      setOccurredDate(new Date());
      setFollowUpDate(undefined);
    }
  }, [communication, form]);

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit({
      ...data,
      occurredAt: occurredDate,
      followUpAt: followUpDate,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{communication ? "Edit Communication" : "Log Communication"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="contactId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-comm-contact">
                        <SelectValue placeholder="Select contact" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contacts.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          {contact.name} ({roleLabels[contact.role] || contact.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Direction</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "outgoing"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-comm-direction">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationDirections.map((dir) => (
                          <SelectItem key={dir} value={dir}>
                            {directionLabels[dir]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "email"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-comm-channel">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationChannels.map((ch) => (
                          <SelectItem key={ch} value={ch}>
                            {channelLabels[ch]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "sent"}>
                      <FormControl>
                        <SelectTrigger data-testid="select-comm-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {communicationStatuses.map((st) => (
                          <SelectItem key={st} value={st}>
                            {statusLabels[st]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Date/Time</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-occurred-date"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {occurredDate ? format(occurredDate, "MMM d, yyyy") : "Pick date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={occurredDate}
                      onSelect={setOccurredDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Email subject or topic" {...field} value={field.value || ""} data-testid="input-comm-subject" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Summary *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Summarize the communication..."
                      className="min-h-[100px]"
                      {...field}
                      data-testid="input-comm-summary"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="needsFollowUp"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-needs-followup"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Needs Follow-up</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pinned"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-pinned"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Pin to Top</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("needsFollowUp") && (
              <FormItem>
                <FormLabel>Follow-up Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      data-testid="button-followup-date"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {followUpDate ? format(followUpDate, "MMM d, yyyy") : "Pick follow-up date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={followUpDate}
                      onSelect={setFollowUpDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-communication">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-save-communication">
                {isSubmitting ? "Saving..." : communication ? "Save Changes" : "Log Communication"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
