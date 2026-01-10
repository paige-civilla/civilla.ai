import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { FileText, Search, ExternalLink, Bookmark, BookmarkCheck, Trash2, Pencil, Loader2, Plus, Globe, Building2, Scale, FolderOpen, X, Check, FileQuestion, ListChecks } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useModuleView } from "@/hooks/useModuleView";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Case, CaseResource } from "@shared/schema";
import ModuleIntro from "@/components/app/ModuleIntro";
import PhaseBanner from "@/components/app/PhaseBanner";
import ResourceFieldMapPanel from "@/components/app/ResourceFieldMapPanel";

const US_STATES = [
  { code: "CA", name: "California" },
  { code: "TX", name: "Texas" },
  { code: "NY", name: "New York" },
  { code: "FL", name: "Florida" },
  { code: "IL", name: "Illinois" },
  { code: "PA", name: "Pennsylvania" },
  { code: "OH", name: "Ohio" },
  { code: "GA", name: "Georgia" },
  { code: "NC", name: "North Carolina" },
  { code: "MI", name: "Michigan" },
];

const FORM_CATEGORIES = [
  { value: "general", label: "General Forms" },
  { value: "family", label: "Family Law" },
  { value: "dv", label: "Domestic Violence" },
  { value: "custody", label: "Child Custody" },
  { value: "support", label: "Child Support" },
  { value: "federal", label: "Federal Courts" },
];

const RESOURCE_TYPES = [
  { value: "form", label: "Form" },
  { value: "packet", label: "Form Packet" },
  { value: "instruction", label: "Instructions" },
  { value: "rule", label: "Court Rule" },
  { value: "guide", label: "Self-Help Guide" },
];

interface SearchResult {
  title: string;
  url: string;
  description: string;
  category: string;
  domain: string;
  isOfficial: boolean;
  state?: string;
}

interface SearchResponse {
  results: SearchResult[];
  meta: {
    state?: string;
    county?: string;
    category?: string;
    totalResults: number;
    officialDomainsOnly: boolean;
  };
}

function getDomainBadge(domain: string, isOfficial: boolean) {
  if (isOfficial) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
        <Scale className="w-3 h-3 mr-1" />
        Official
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Globe className="w-3 h-3 mr-1" />
      {domain}
    </Badge>
  );
}

function getResourceTypeLabel(type: string): string {
  const rt = RESOURCE_TYPES.find(r => r.value === type);
  return rt ? rt.label : type;
}

function getCategoryLabel(category: string): string {
  const cat = FORM_CATEGORIES.find(c => c.value === category);
  return cat ? cat.label : category;
}

export default function AppCourtForms() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();
  useModuleView("court-forms", caseId);

  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveResource, setSaveResource] = useState<SearchResult | null>(null);
  const [resourceNotes, setResourceNotes] = useState("");
  const [resourceType, setResourceType] = useState<string>("form");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<CaseResource | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [fieldMapResource, setFieldMapResource] = useState<CaseResource | null>(null);
  const [fieldMapOpen, setFieldMapOpen] = useState(false);

  const caseQuery = useQuery<{ case: Case }>({
    queryKey: ["/api/cases", caseId],
  });

  const resourcesQuery = useQuery<{ resources: CaseResource[] }>({
    queryKey: ["/api/cases", caseId, "resources"],
    enabled: !!caseId,
  });

  const statesQuery = useQuery<{ states: string[] }>({
    queryKey: ["/api/form-packs/states"],
  });

  const searchMutation = useMutation({
    mutationFn: async (params: { state?: string; category?: string; query?: string }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/form-packs/search`, params);
      return res.json() as Promise<SearchResponse>;
    },
    onSuccess: (data) => {
      setSearchResults(data.results);
      setHasSearched(true);
    },
    onError: () => {
      toast({
        title: "Search Failed",
        description: "Could not search for court forms. Please try again.",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string; url: string; state?: string; category?: string; notes?: string; resourceType?: string }) => {
      const res = await apiRequest("POST", `/api/cases/${caseId}/resources`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "resources"] });
      setSaveDialogOpen(false);
      setSaveResource(null);
      setResourceNotes("");
      toast({
        title: "Resource Saved",
        description: "Court form has been added to your saved resources.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Could not save resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ resourceId, data }: { resourceId: string; data: { notes?: string } }) => {
      const res = await apiRequest("PATCH", `/api/cases/${caseId}/resources/${resourceId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "resources"] });
      setEditDialogOpen(false);
      setEditingResource(null);
      toast({
        title: "Resource Updated",
        description: "Your notes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Could not update resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await apiRequest("DELETE", `/api/cases/${caseId}/resources/${resourceId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "resources"] });
      setDeleteConfirmId(null);
      toast({
        title: "Resource Removed",
        description: "The resource has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Could not remove resource. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!selectedState && !selectedCategory && !searchQuery.trim()) {
      toast({
        title: "Select Filters",
        description: "Please select a state, category, or enter a search term.",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    searchMutation.mutate(
      {
        state: selectedState || undefined,
        category: selectedCategory || undefined,
        query: searchQuery.trim() || undefined,
      },
      {
        onSettled: () => setIsSearching(false),
      }
    );
  };

  const handleSaveResource = (result: SearchResult) => {
    setSaveResource(result);
    setResourceType("form");
    setResourceNotes("");
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = () => {
    if (!saveResource) return;
    saveMutation.mutate({
      title: saveResource.title,
      description: saveResource.description,
      url: saveResource.url,
      state: saveResource.state,
      category: saveResource.category,
      notes: resourceNotes.trim() || undefined,
      resourceType,
    });
  };

  const handleEditResource = (resource: CaseResource) => {
    setEditingResource(resource);
    setEditNotes(resource.notes || "");
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = () => {
    if (!editingResource) return;
    updateMutation.mutate({
      resourceId: editingResource.id,
      data: { notes: editNotes.trim() || undefined },
    });
  };

  const handleDeleteResource = (resourceId: string) => {
    setDeleteConfirmId(resourceId);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteMutation.mutate(deleteConfirmId);
  };

  const savedResources = resourcesQuery.data?.resources || [];
  const savedUrls = new Set(savedResources.map(r => r.url));

  const caseData = caseQuery.data?.case;
  const availableStates = statesQuery.data?.states || US_STATES.map(s => s.code);

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6" data-testid="court-forms-page">
        <PhaseBanner caseId={caseId} />

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Court Forms & Packets</h1>
            <p className="text-muted-foreground">Find official court forms from verified government sources</p>
          </div>
        </div>

        <ModuleIntro
          title="Finding the Right Court Forms"
          paragraphs={["We help you locate official court forms from verified government websites."]}
          bullets={[
            "Search by state to find your local court forms",
            "Filter by category (family law, custody, support)",
            "Save forms to your case for easy reference",
            "All results come from official .gov domains",
          ]}
        />

        <Card data-testid="card-search-forms">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Official Court Forms
            </CardTitle>
            <CardDescription>
              Results are limited to official government sources (.gov, state courts)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="state-select">State</Label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger id="state-select" data-testid="select-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All States</SelectItem>
                      {availableStates.map(code => {
                        const stateInfo = US_STATES.find(s => s.code === code);
                        return (
                          <SelectItem key={code} value={code}>
                            {stateInfo?.name || code}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category-select">Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="category-select" data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {FORM_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-query">Keyword Search</Label>
                  <Input
                    id="search-query"
                    placeholder="e.g., custody, restraining order"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    data-testid="input-search-query"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  data-testid="button-search-forms"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search Forms
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {hasSearched && (
          <Card data-testid="card-search-results">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Search Results
                <Badge variant="secondary" className="ml-2">{searchResults.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <FileQuestion className="w-12 h-12 mb-4 opacity-50" />
                  <p className="font-medium">No forms found</p>
                  <p className="text-sm">Try selecting a different state or category</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {searchResults.map((result, idx) => {
                    const isSaved = savedUrls.has(result.url);
                    return (
                      <div
                        key={`${result.url}-${idx}`}
                        className="flex items-start justify-between gap-4 p-4 border rounded-lg hover-elevate"
                        data-testid={`search-result-${idx}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium">{result.title}</h4>
                            {getDomainBadge(result.domain, result.isOfficial)}
                            {result.state && (
                              <Badge variant="outline">
                                <Building2 className="w-3 h-3 mr-1" />
                                {result.state}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{result.description}</p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                            data-testid={`link-result-${idx}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            {result.domain}
                          </a>
                        </div>
                        <div className="flex-shrink-0">
                          {isSaved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              <BookmarkCheck className="w-3 h-3 mr-1" />
                              Saved
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveResource(result)}
                              data-testid={`button-save-result-${idx}`}
                            >
                              <Bookmark className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card data-testid="card-saved-resources">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Saved Resources
              <Badge variant="secondary" className="ml-2">{savedResources.length}</Badge>
            </CardTitle>
            <CardDescription>
              Court forms and resources you've saved for this case
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resourcesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : savedResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Bookmark className="w-12 h-12 mb-4 opacity-50" />
                <p className="font-medium">No saved resources yet</p>
                <p className="text-sm">Search for court forms above and save them for quick access</p>
              </div>
            ) : (
              <div className="space-y-3">
                {savedResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                    data-testid={`saved-resource-${resource.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-medium">{resource.title}</h4>
                        <Badge variant="secondary">{getResourceTypeLabel(resource.resourceType)}</Badge>
                        {resource.state && (
                          <Badge variant="outline">
                            <Building2 className="w-3 h-3 mr-1" />
                            {resource.state}
                          </Badge>
                        )}
                        {resource.category && (
                          <Badge variant="outline">{getCategoryLabel(resource.category)}</Badge>
                        )}
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{resource.description}</p>
                      )}
                      {resource.notes && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          <span className="font-medium">Notes:</span> {resource.notes}
                        </div>
                      )}
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                          data-testid={`link-saved-${resource.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {resource.domain || "View Resource"}
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setFieldMapResource(resource);
                              setFieldMapOpen(true);
                            }}
                            data-testid={`button-field-map-${resource.id}`}
                          >
                            <ListChecks className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Map Fields</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditResource(resource)}
                            data-testid={`button-edit-${resource.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit Notes</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteResource(resource.id)}
                            data-testid={`button-delete-${resource.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Court Form</DialogTitle>
              <DialogDescription>
                Add this resource to your saved forms for quick access
              </DialogDescription>
            </DialogHeader>
            {saveResource && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Resource</Label>
                  <p className="font-medium">{saveResource.title}</p>
                  <p className="text-sm text-muted-foreground">{saveResource.description}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-type">Resource Type</Label>
                  <Select value={resourceType} onValueChange={setResourceType}>
                    <SelectTrigger id="resource-type" data-testid="select-resource-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESOURCE_TYPES.map(rt => (
                        <SelectItem key={rt.value} value={rt.value}>
                          {rt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resource-notes">Notes (optional)</Label>
                  <Textarea
                    id="resource-notes"
                    placeholder="Add any notes about this form..."
                    value={resourceNotes}
                    onChange={(e) => setResourceNotes(e.target.value)}
                    rows={3}
                    data-testid="input-resource-notes"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSave}
                disabled={saveMutation.isPending}
                data-testid="button-confirm-save"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Resource
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Resource Notes</DialogTitle>
              <DialogDescription>
                Update your notes for this saved resource
              </DialogDescription>
            </DialogHeader>
            {editingResource && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Resource</Label>
                  <p className="font-medium">{editingResource.title}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Add any notes about this form..."
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    data-testid="input-edit-notes"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmEdit}
                disabled={updateMutation.isPending}
                data-testid="button-confirm-edit"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Resource</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this resource from your saved list? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {fieldMapResource && (
          <ResourceFieldMapPanel
            caseId={caseId}
            resourceId={fieldMapResource.id}
            resourceTitle={fieldMapResource.title}
            open={fieldMapOpen}
            onOpenChange={(open) => {
              setFieldMapOpen(open);
              if (!open) setFieldMapResource(null);
            }}
          />
        )}
      </div>
    </AppLayout>
  );
}
