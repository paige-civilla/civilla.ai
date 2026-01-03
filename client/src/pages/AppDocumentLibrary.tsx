import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import ModuleIntro from "@/components/app/ModuleIntro";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, 
  FileText, 
  HelpCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { 
  DOCUMENT_TYPES, 
  DOC_CATEGORIES, 
  getDocumentTypeByKey,
  type DocCategory,
  type DocumentType 
} from "@/lib/documentLibrary";
import { getTemplateByKey } from "@shared/templates";

export default function AppDocumentLibrary() {
  const [, setLocation] = useLocation();
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | "All">("All");
  const [creatingDocKey, setCreatingDocKey] = useState<string | null>(null);

  const { data: caseData } = useQuery<{ case: { id: string; title: string } }>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId,
  });

  const createDraftMutation = useMutation({
    mutationFn: async (docType: DocumentType) => {
      const template = getTemplateByKey(docType.templateKey || docType.key);
      const title = docType.subtypeLabel || docType.title;
      const content = template?.starterContent?.join("\n") || `# ${title}\n\n[Begin drafting your ${title.toLowerCase()} here]`;
      
      const res = await apiRequest("POST", `/api/cases/${caseId}/documents`, {
        title,
        templateKey: docType.templateKey || docType.key,
        content
      });
      return res.json();
    },
    onSuccess: (_, docType) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cases", caseId, "documents"] });
      toast({ title: `Draft "${docType.subtypeLabel || docType.title}" created` });
      setLocation(`/app/documents/${caseId}`);
    },
    onError: () => {
      toast({ title: "Failed to create draft", variant: "destructive" });
    },
    onSettled: () => {
      setCreatingDocKey(null);
    }
  });

  const handleStartDraft = (docType: DocumentType) => {
    setCreatingDocKey(docType.key);
    createDraftMutation.mutate(docType);
  };

  const filteredDocs = useMemo(() => {
    let docs = DOCUMENT_TYPES;
    
    if (selectedCategory !== "All") {
      docs = docs.filter(d => d.category === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(d => 
        d.title.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        (d.subtypeLabel && d.subtypeLabel.toLowerCase().includes(query))
      );
    }
    
    return docs;
  }, [selectedCategory, searchQuery]);

  const groupedDocs = useMemo(() => {
    const groups: Record<DocCategory, DocumentType[]> = {
      "Starting a case": [],
      "Motions": [],
      "Responses": [],
      "Orders": [],
      "Service": [],
      "Evidence/Exhibits": [],
      "Other": []
    };
    
    filteredDocs.forEach(doc => {
      groups[doc.category].push(doc);
    });
    
    return groups;
  }, [filteredDocs]);

  return (
    <AppLayout>
      <section className="w-full flex flex-col items-center px-4 sm:px-5 md:px-16 py-6 sm:py-10 md:py-16">
        <div className="flex flex-col items-start max-w-container w-full">
          <div className="flex items-center gap-2 mb-6">
            <h1 className="font-heading font-bold text-xl sm:text-2xl text-neutral-darkest" data-testid="text-library-title">
              Document Library
            </h1>
          </div>

          <ModuleIntro
            title="About Document Types"
            paragraphs={[
              "This library provides information about common document types used in family law proceedings. Each entry explains what the document is, when it's commonly used, and what information is typically included.",
              "Use this as a reference to understand different documents. When you're ready, click 'Start Draft' to begin creating a document in your Documents module."
            ]}
            caution="This information is for educational purposes. Consult your court's local rules for specific requirements."
          />

          <div className="w-full flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-darkest/40" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-library-search"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === "All" ? "default" : "outline"}
                onClick={() => setSelectedCategory("All")}
                data-testid="button-category-all"
              >
                All
              </Button>
              {DOC_CATEGORIES.map(cat => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  data-testid={`button-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          <div className="w-full space-y-8">
            {(selectedCategory === "All" ? DOC_CATEGORIES : [selectedCategory]).map(category => {
              const docs = groupedDocs[category as DocCategory];
              if (!docs || docs.length === 0) return null;
              
              return (
                <div key={category}>
                  <h2 className="font-heading font-semibold text-lg text-neutral-darkest mb-4" data-testid={`text-category-${category.toLowerCase().replace(/\s+/g, "-")}`}>
                    {category}
                  </h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {docs.map(doc => (
                      <Card key={doc.key} className="border-[#A2BEC2]" data-testid={`card-doc-${doc.key}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#314143] flex-shrink-0" />
                              <h3 className="font-heading font-semibold text-[#243032] text-sm">
                                {doc.subtypeLabel || doc.title}
                              </h3>
                            </div>
                            {doc.subtypeOf && (
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                Subtype
                              </Badge>
                            )}
                          </div>
                          
                          <p className="font-sans text-xs text-[#243032]/70 mb-3 line-clamp-2">
                            {doc.description}
                          </p>
                          
                          <div className="mb-3">
                            <p className="font-sans text-xs font-medium text-[#243032]/80 mb-1">Commonly used:</p>
                            <ul className="space-y-0.5">
                              {doc.commonWhenUsed.slice(0, 2).map((item, idx) => (
                                <li key={idx} className="font-sans text-xs text-[#243032]/60 flex items-start gap-1.5">
                                  <span className="text-[#A2BEC2] mt-0.5">•</span>
                                  <span className="line-clamp-1">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleStartDraft(doc)}
                              disabled={creatingDocKey === doc.key}
                              data-testid={`button-start-draft-${doc.key}`}
                            >
                              {creatingDocKey === doc.key ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <ChevronRight className="w-3 h-3 mr-1" />
                              )}
                              Start Draft
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                window.dispatchEvent(new CustomEvent('openLexiHelp', { 
                                  detail: { docKey: doc.key } 
                                }));
                              }}
                              data-testid={`button-learn-more-${doc.key}`}
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {filteredDocs.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-neutral-darkest/20 mx-auto mb-4" />
                <p className="font-sans text-neutral-darkest/60">No documents match your search.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
