import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, ScrollText, Users } from "lucide-react";

export default function AppAdminPolicy() {
  return (
    <AppLayout>
      <section className="w-full px-4 sm:px-6 md:px-10 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h1 className="font-heading font-bold text-xl md:text-2xl text-[#243032] flex items-center gap-2" data-testid="heading-admin-policy">
              <Shield className="w-5 h-5" />
              Admin Access Policy
            </h1>
            <p className="text-sm text-[#243032]/70 mt-1">
              Privacy and data access policies for administrative functions.
            </p>
          </div>

          <Card className="border border-[hsl(var(--module-tile-border))]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4" />
                What Is Tracked
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#243032]/80 space-y-2">
              <p>The following aggregated metrics are collected for product improvement and grant reporting:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>User counts (total, active in 7/30 days)</li>
                <li>Case counts by state (aggregated, bucketed for small counts)</li>
                <li>Module usage patterns (which features are used most)</li>
                <li>Conversion funnel events (onboarding → case creation → exports)</li>
                <li>AI reliability metrics (error codes and counts, no content)</li>
                <li>Export and document generation counts</li>
                <li>Performance metrics (response times, percentiles)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-[hsl(var(--module-tile-border))]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4" />
                What Is Never Accessible
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#243032]/80 space-y-2">
              <p>Admin and grant dashboards are designed with strict privacy controls. The following data is never exposed:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>User-uploaded evidence files or documents</li>
                <li>Document content, drafts, or compiled outputs</li>
                <li>Chat messages or Lexi conversation history</li>
                <li>Extracted text from OCR or AI analysis</li>
                <li>AI prompts or responses</li>
                <li>Personal information (names, emails, addresses, phone numbers)</li>
                <li>Case notes, claims text, or evidence descriptions</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-[hsl(var(--module-tile-border))]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4" />
                Role-Based Access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#243032]/80 space-y-2">
              <p>Access to dashboards is controlled by user roles:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Admin</strong>: Full access to admin dashboard, system health, user management, and audit logs</li>
                <li><strong>Grant Viewer</strong>: Access to grant-specific metrics dashboard only (aggregated data)</li>
                <li><strong>Regular User</strong>: No access to admin or grant dashboards</li>
              </ul>
              <p className="mt-2">Role changes are recorded in the immutable audit log.</p>
            </CardContent>
          </Card>

          <Card className="border border-[hsl(var(--module-tile-border))]">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Audit Logging
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#243032]/80 space-y-2">
              <p>All administrative actions are logged immutably:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Role assignments and changes</li>
                <li>Dashboard access events</li>
                <li>User search queries (query terms only, no results content)</li>
              </ul>
              <p className="mt-2">Audit logs cannot be modified or deleted. They include timestamps, actor IDs, and action details.</p>
            </CardContent>
          </Card>

          <Card className="border border-[hsl(var(--module-tile-border))]">
            <CardHeader>
              <CardTitle className="text-base">Small-Count Bucketing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#243032]/80 space-y-2">
              <p>
                To prevent re-identification of individuals from aggregate data, any category with fewer than 5 entries 
                is grouped into "Other / &lt;5" in all distribution reports.
              </p>
              <p>
                This includes state distributions, module usage, error codes, and all other categorical metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="border border-[hsl(var(--module-tile-border))]">
            <CardHeader>
              <CardTitle className="text-base">Purpose of Data Collection</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[#243032]/80 space-y-2">
              <p>Aggregated analytics are collected for:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Product improvement and feature prioritization</li>
                <li>Grant reporting requirements (anonymized impact metrics)</li>
                <li>System reliability monitoring</li>
                <li>Performance optimization</li>
              </ul>
              <p className="mt-2">
                No user content is ever accessed by staff for these purposes. 
                Any future support access features will require explicit user consent, time-limited access, and full logging.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
}
