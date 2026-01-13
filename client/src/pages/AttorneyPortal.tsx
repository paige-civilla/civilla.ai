import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Files, Calendar, Briefcase, BarChart3, ArrowLeft, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CaseAccess {
  role: string | null;
  canDownload: boolean;
  readOnly: boolean;
}

interface Case {
  id: string;
  title: string;
  nickname: string | null;
  state: string | null;
  county: string | null;
  caseNumber: string | null;
}

interface Evidence {
  id: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  templateKey: string;
  updatedAt: string;
}

interface Exhibit {
  id: string;
  exhibitNumber: string;
  title: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  eventDate: string;
  category: string;
}

export default function AttorneyPortal() {
  const { caseId } = useParams<{ caseId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("evidence");

  const { data: accessData, isLoading: accessLoading } = useQuery<CaseAccess>({
    queryKey: ["/api/cases", caseId, "attorney/access"],
    enabled: !!caseId,
  });

  const { data: caseData, isLoading: caseLoading } = useQuery<Case>({
    queryKey: ["/api/cases", caseId],
    enabled: !!caseId && accessData?.role !== null,
  });

  const { data: evidenceData } = useQuery<Evidence[]>({
    queryKey: ["/api/cases", caseId, "evidence"],
    enabled: !!caseId && accessData?.role !== null && activeTab === "evidence",
  });

  const { data: documentsData } = useQuery<Document[]>({
    queryKey: ["/api/cases", caseId, "documents"],
    enabled: !!caseId && accessData?.role !== null && activeTab === "documents",
  });

  const { data: exhibitsData } = useQuery<{ exhibits: Exhibit[] }>({
    queryKey: ["/api/cases", caseId, "exhibits/list"],
    enabled: !!caseId && accessData?.role !== null && activeTab === "exhibits",
  });

  const { data: timelineData } = useQuery<TimelineEvent[]>({
    queryKey: ["/api/cases", caseId, "timeline"],
    enabled: !!caseId && accessData?.role !== null && activeTab === "timeline",
  });

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await apiRequest("GET", `/api/cases/${caseId}/evidence/${fileId}/download`);
      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Download failed", description: String(error) });
    }
  };

  if (accessLoading || caseLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f4f6f5] to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-sans text-neutral-darkest/60">Loading case...</p>
        </div>
      </div>
    );
  }

  if (!accessData?.role) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f4f6f5] to-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-heading font-bold text-neutral-darkest mb-2">Access Denied</h2>
            <p className="font-sans text-neutral-darkest/60 mb-4">
              You do not have access to this case. The case owner may have revoked your access.
            </p>
            <Button variant="outline" onClick={() => navigate("/app")} data-testid="button-go-home">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f4f6f5] to-white">
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading font-bold text-lg text-neutral-darkest">
                {caseData?.title || "Case"}
              </h1>
              {caseData?.caseNumber && (
                <p className="font-sans text-sm text-neutral-darkest/60">#{caseData.caseNumber}</p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Eye className="w-3 h-3 mr-1" />
            Read-Only Attorney Access
          </Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="w-5 h-5 text-primary" />
              Case Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full max-w-xl">
                <TabsTrigger value="evidence" data-testid="tab-evidence">
                  <Files className="w-4 h-4 mr-1.5" />
                  Evidence
                </TabsTrigger>
                <TabsTrigger value="documents" data-testid="tab-documents">
                  <FileText className="w-4 h-4 mr-1.5" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="exhibits" data-testid="tab-exhibits">
                  <Briefcase className="w-4 h-4 mr-1.5" />
                  Exhibits
                </TabsTrigger>
                <TabsTrigger value="timeline" data-testid="tab-timeline">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="evidence" className="mt-4">
                {evidenceData && evidenceData.length > 0 ? (
                  <div className="space-y-2">
                    {evidenceData.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-4 py-3"
                        data-testid={`evidence-${file.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Files className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-sans text-sm font-medium text-neutral-darkest">{file.fileName}</p>
                            <p className="font-sans text-xs text-neutral-darkest/60">
                              {new Date(file.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(file.id, file.fileName)}
                          data-testid={`download-${file.id}`}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Files className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-3" />
                    <p className="font-sans text-neutral-darkest/60">No evidence files in this case</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                {documentsData && documentsData.length > 0 ? (
                  <div className="space-y-2">
                    {documentsData.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-4 py-3"
                        data-testid={`document-${doc.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-sans text-sm font-medium text-neutral-darkest">{doc.title}</p>
                            <p className="font-sans text-xs text-neutral-darkest/60">
                              {new Date(doc.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-3" />
                    <p className="font-sans text-neutral-darkest/60">No documents in this case</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="exhibits" className="mt-4">
                {exhibitsData?.exhibits && exhibitsData.exhibits.length > 0 ? (
                  <div className="space-y-2">
                    {exhibitsData.exhibits.map((exhibit) => (
                      <div
                        key={exhibit.id}
                        className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-4 py-3"
                        data-testid={`exhibit-${exhibit.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-sans text-sm font-medium text-neutral-darkest">
                              Exhibit {exhibit.exhibitNumber}: {exhibit.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-3" />
                    <p className="font-sans text-neutral-darkest/60">No exhibits in this case</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="mt-4">
                {timelineData && timelineData.length > 0 ? (
                  <div className="space-y-2">
                    {timelineData.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between bg-[#f4f6f5] rounded-lg px-4 py-3"
                        data-testid={`timeline-${event.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-sans text-sm font-medium text-neutral-darkest">{event.title}</p>
                            <p className="font-sans text-xs text-neutral-darkest/60">
                              {new Date(event.eventDate).toLocaleDateString()} - {event.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-neutral-darkest/30 mx-auto mb-3" />
                    <p className="font-sans text-neutral-darkest/60">No timeline events in this case</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
