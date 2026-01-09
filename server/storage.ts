import { eq, and, desc, asc, inArray, lt, sql, isNull } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  cases,
  authIdentities,
  timelineEvents,
  timelineCategories,
  evidenceFiles,
  documents,
  userProfiles,
  generatedDocuments,
  caseChildren,
  tasks,
  deadlines,
  calendarCategories,
  caseCalendarItems,
  caseContacts,
  caseCommunications,
  exhibitLists,
  exhibits,
  exhibitEvidence,
  lexiThreads,
  lexiMessages,
  caseRuleTerms,
  trialBinderSections,
  trialBinderItems,
  exhibitPackets,
  exhibitPacketItems,
  exhibitPacketEvidence,
  generatedExhibitPackets,
  caseEvidenceNotes,
  caseExhibitNoteLinks,
  type User,
  type InsertUser,
  type Case,
  type InsertCase,
  type AuthIdentity,
  type InsertAuthIdentity,
  type TimelineEvent,
  type InsertTimelineEvent,
  type EvidenceFile,
  type InsertEvidenceFile,
  type Document,
  type InsertDocument,
  type UpdateDocument,
  type UserProfile,
  type UpsertUserProfile,
  type GeneratedDocument,
  type GenerateDocumentPayload,
  type CaseChild,
  type InsertCaseChild,
  type UpdateCaseChild,
  type Task,
  type InsertTask,
  type UpdateTask,
  type Deadline,
  type InsertDeadline,
  type UpdateDeadline,
  type CalendarCategory,
  type InsertCalendarCategory,
  type CaseCalendarItem,
  type InsertCaseCalendarItem,
  type UpdateCaseCalendarItem,
  type CaseContact,
  type InsertContact,
  type UpdateContact,
  type CaseCommunication,
  type InsertCommunication,
  type UpdateCommunication,
  type ExhibitList,
  type InsertExhibitList,
  type UpdateExhibitList,
  type Exhibit,
  type InsertExhibit,
  type UpdateExhibit,
  type ExhibitEvidence,
  type LexiThread,
  type LexiMessage,
  type LexiMessageRole,
  type CaseRuleTerm,
  type UpsertCaseRuleTerm,
  type TrialBinderSection,
  type TrialBinderItem,
  type UpsertTrialBinderItem,
  type UpdateTrialBinderItem,
  type ExhibitPacket,
  type InsertExhibitPacket,
  type UpdateExhibitPacket,
  type ExhibitPacketItem,
  type InsertExhibitPacketItem,
  type UpdateExhibitPacketItem,
  type ExhibitPacketEvidence,
  type GeneratedExhibitPacket,
  type EvidenceNote,
  type InsertEvidenceNote,
  type UpdateEvidenceNote,
  type ExhibitNoteLink,
  type InsertExhibitNoteLink,
  type TimelineCategory,
  type InsertTimelineCategory,
  type UpdateTimelineCategory,
  parentingPlans,
  parentingPlanSections,
  evidenceProcessingJobs,
  evidenceOcrPages,
  evidenceAnchors,
  evidenceExtractions,
  evidenceNotes,
  evidenceAiAnalyses,
  trialPrepShortlist,
  type ParentingPlan,
  type InsertParentingPlan,
  type UpdateParentingPlan,
  type ParentingPlanSection,
  type InsertParentingPlanSection,
  type UpdateParentingPlanSection,
  type EvidenceProcessingJob,
  type UpdateEvidenceProcessingJob,
  type EvidenceOcrPage,
  type UpsertEvidenceOcrPage,
  type EvidenceAnchor,
  type InsertEvidenceAnchor,
  type UpdateEvidenceAnchor,
  type EvidenceExtraction,
  type InsertEvidenceExtraction,
  type UpdateEvidenceExtraction,
  type EvidenceNoteFull,
  type InsertEvidenceNoteFull,
  type UpdateEvidenceNoteFull,
  type EvidenceAiAnalysis,
  type InsertEvidenceAiAnalysis,
  type TrialPrepShortlist,
  type InsertTrialPrepShortlist,
  type UpdateTrialPrepShortlist,
  exhibitSnippets,
  type ExhibitSnippet,
  type InsertExhibitSnippet,
  type UpdateExhibitSnippet,
  type UpdateEvidenceAiAnalysis,
  citationPointers,
  caseClaims,
  claimCitations,
  issueGroupings,
  issueClaims,
  lexiUserPrefs,
  lexiCaseMemory,
  lexiFeedbackEvents,
  activityLogs,
  type CitationPointer,
  type InsertCitationPointer,
  type CaseClaim,
  type InsertCaseClaim,
  type UpdateCaseClaim,
  type ClaimStatus,
  type IssueGrouping,
  type InsertIssueGrouping,
  type UpdateIssueGrouping,
  type DraftReadinessStats,
  type LexiUserPrefs,
  type UpsertLexiUserPrefs,
  type LexiCaseMemory,
  type UpsertLexiCaseMemory,
  type LexiFeedbackEvent,
  type CreateLexiFeedbackEvent,
  type ActivityLog,
  caseFacts,
  factCitations,
  timelineEventLinks,
  claimLinks,
  type CaseFact,
  type InsertCaseFact,
  type UpdateCaseFact,
  type ListCaseFactsFilters,
  type FactCitation,
  type TimelineEventLink,
  type InsertTimelineEventLink,
  type ClaimLink,
  type InsertClaimLink,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getCasesByUserId(userId: string): Promise<Case[]>;
  getCaseCountByUserId(userId: string): Promise<number>;
  getCase(caseId: string, userId: string): Promise<Case | undefined>;
  createCase(userId: string, caseData: InsertCase): Promise<Case>;
  updateCase(caseId: string, userId: string, caseData: Partial<InsertCase>): Promise<Case | undefined>;

  getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined>;
  createAuthIdentity(identity: InsertAuthIdentity): Promise<AuthIdentity>;
  getAuthIdentitiesByUserId(userId: string): Promise<AuthIdentity[]>;

  listTimelineEvents(caseId: string, userId: string): Promise<TimelineEvent[]>;
  getTimelineEvent(eventId: string, userId: string): Promise<TimelineEvent | undefined>;
  createTimelineEvent(caseId: string, userId: string, data: InsertTimelineEvent): Promise<TimelineEvent>;
  updateTimelineEvent(eventId: string, userId: string, data: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined>;
  deleteTimelineEvent(eventId: string, userId: string): Promise<boolean>;

  listEvidenceFiles(caseId: string, userId: string): Promise<EvidenceFile[]>;
  getEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined>;
  createEvidenceFile(caseId: string, userId: string, data: InsertEvidenceFile): Promise<EvidenceFile>;
  deleteEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined>;

  listDocuments(caseId: string, userId: string): Promise<Document[]>;
  getDocument(docId: string, userId: string): Promise<Document | undefined>;
  createDocument(caseId: string, userId: string, data: InsertDocument): Promise<Document>;
  updateDocument(docId: string, userId: string, data: UpdateDocument): Promise<Document | undefined>;
  duplicateDocument(docId: string, userId: string): Promise<Document | undefined>;
  deleteDocument(docId: string, userId: string): Promise<boolean>;

  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  upsertUserProfile(userId: string, data: UpsertUserProfile): Promise<UserProfile>;

  listGeneratedDocuments(userId: string, caseId: string): Promise<GeneratedDocument[]>;
  createGeneratedDocument(userId: string, caseId: string, templateType: string, title: string, payloadJson: GenerateDocumentPayload): Promise<GeneratedDocument>;
  getGeneratedDocument(userId: string, docId: string): Promise<GeneratedDocument | undefined>;

  listCaseChildren(caseId: string, userId: string): Promise<CaseChild[]>;
  getCaseChild(childId: string, userId: string): Promise<CaseChild | undefined>;
  createCaseChild(caseId: string, userId: string, data: InsertCaseChild): Promise<CaseChild>;
  updateCaseChild(childId: string, userId: string, data: UpdateCaseChild): Promise<CaseChild | undefined>;
  deleteCaseChild(childId: string, userId: string): Promise<boolean>;
  deleteAllCaseChildren(caseId: string, userId: string): Promise<number>;

  listTasks(userId: string, caseId: string): Promise<Task[]>;
  createTask(userId: string, caseId: string, data: InsertTask): Promise<Task>;
  updateTask(userId: string, taskId: string, data: UpdateTask): Promise<Task | undefined>;
  deleteTask(userId: string, taskId: string): Promise<boolean>;

  listDeadlines(userId: string, caseId: string): Promise<Deadline[]>;
  createDeadline(userId: string, caseId: string, data: InsertDeadline): Promise<Deadline>;
  updateDeadline(userId: string, deadlineId: string, data: UpdateDeadline): Promise<Deadline | undefined>;
  deleteDeadline(userId: string, deadlineId: string): Promise<boolean>;

  listCalendarCategories(userId: string, caseId: string): Promise<CalendarCategory[]>;
  createCalendarCategory(userId: string, caseId: string, data: InsertCalendarCategory): Promise<CalendarCategory>;

  listCaseCalendarItems(userId: string, caseId: string): Promise<CaseCalendarItem[]>;
  createCaseCalendarItem(userId: string, caseId: string, data: InsertCaseCalendarItem): Promise<CaseCalendarItem>;
  updateCaseCalendarItem(userId: string, itemId: string, data: UpdateCaseCalendarItem): Promise<CaseCalendarItem | undefined>;
  deleteCaseCalendarItem(userId: string, itemId: string): Promise<boolean>;

  listContacts(userId: string, caseId: string): Promise<CaseContact[]>;
  createContact(userId: string, caseId: string, data: InsertContact): Promise<CaseContact>;
  updateContact(userId: string, contactId: string, data: UpdateContact): Promise<CaseContact | undefined>;
  deleteContact(userId: string, contactId: string): Promise<boolean>;
  getContact(userId: string, contactId: string): Promise<CaseContact | undefined>;

  listCommunications(userId: string, caseId: string): Promise<CaseCommunication[]>;
  createCommunication(userId: string, caseId: string, data: InsertCommunication): Promise<CaseCommunication>;
  updateCommunication(userId: string, commId: string, data: UpdateCommunication): Promise<CaseCommunication | undefined>;
  deleteCommunication(userId: string, commId: string): Promise<boolean>;
  getCommunication(userId: string, commId: string): Promise<CaseCommunication | undefined>;

  listExhibitLists(userId: string, caseId: string): Promise<ExhibitList[]>;
  getExhibitList(userId: string, listId: string): Promise<ExhibitList | undefined>;
  createExhibitList(userId: string, caseId: string, data: InsertExhibitList): Promise<ExhibitList>;
  updateExhibitList(userId: string, listId: string, data: UpdateExhibitList): Promise<ExhibitList | undefined>;
  deleteExhibitList(userId: string, listId: string): Promise<boolean>;

  listExhibits(userId: string, exhibitListId: string): Promise<Exhibit[]>;
  getExhibit(userId: string, exhibitId: string): Promise<Exhibit | undefined>;
  createExhibit(userId: string, caseId: string, exhibitListId: string, data: InsertExhibit): Promise<Exhibit>;
  updateExhibit(userId: string, exhibitId: string, data: UpdateExhibit): Promise<Exhibit | undefined>;
  deleteExhibit(userId: string, exhibitId: string): Promise<boolean>;
  reorderExhibits(userId: string, exhibitListId: string, orderedIds: string[]): Promise<boolean>;

  listExhibitEvidence(userId: string, exhibitId: string): Promise<EvidenceFile[]>;
  attachEvidence(userId: string, caseId: string, exhibitId: string, evidenceId: string): Promise<ExhibitEvidence | null>;
  detachEvidence(userId: string, exhibitId: string, evidenceId: string): Promise<boolean>;
  getExhibitsForEvidence(userId: string, evidenceId: string): Promise<Exhibit[]>;

  listLexiThreads(userId: string, caseId: string | null): Promise<LexiThread[]>;
  createLexiThread(userId: string, caseId: string | null, title: string): Promise<LexiThread>;
  renameLexiThread(userId: string, threadId: string, title: string): Promise<LexiThread | undefined>;
  deleteLexiThread(userId: string, threadId: string): Promise<boolean>;
  getLexiThread(userId: string, threadId: string): Promise<LexiThread | undefined>;
  markLexiThreadDisclaimerShown(userId: string, threadId: string): Promise<boolean>;
  listLexiMessages(userId: string, threadId: string): Promise<LexiMessage[]>;
  createLexiMessage(userId: string, caseId: string, threadId: string, role: LexiMessageRole, content: string, safetyFlags?: Record<string, boolean> | null, model?: string | null, metadata?: Record<string, unknown> | null): Promise<LexiMessage>;

  getCaseRuleTerms(userId: string, caseId: string, moduleKey?: string): Promise<CaseRuleTerm[]>;
  upsertCaseRuleTerm(userId: string, caseId: string, input: UpsertCaseRuleTerm): Promise<CaseRuleTerm>;

  listTrialBinderSections(userId: string, caseId: string): Promise<TrialBinderSection[]>;
  seedDefaultTrialBinderSectionsIfMissing(userId: string, caseId: string): Promise<TrialBinderSection[]>;
  listTrialBinderItems(userId: string, caseId: string): Promise<TrialBinderItem[]>;
  getTrialBinderItem(userId: string, itemId: string): Promise<TrialBinderItem | undefined>;
  upsertTrialBinderItem(userId: string, caseId: string, input: UpsertTrialBinderItem): Promise<TrialBinderItem>;
  updateTrialBinderItem(userId: string, itemId: string, input: UpdateTrialBinderItem): Promise<TrialBinderItem | undefined>;
  deleteTrialBinderItem(userId: string, itemId: string): Promise<boolean>;

  listExhibitPackets(userId: string, caseId: string): Promise<ExhibitPacket[]>;
  getExhibitPacket(userId: string, packetId: string): Promise<ExhibitPacket | undefined>;
  createExhibitPacket(userId: string, caseId: string, data: InsertExhibitPacket): Promise<ExhibitPacket>;
  updateExhibitPacket(userId: string, packetId: string, data: UpdateExhibitPacket): Promise<ExhibitPacket | undefined>;
  deleteExhibitPacket(userId: string, packetId: string): Promise<boolean>;

  listPacketItems(userId: string, packetId: string): Promise<ExhibitPacketItem[]>;
  getPacketItem(userId: string, itemId: string): Promise<ExhibitPacketItem | undefined>;
  createPacketItem(userId: string, packetId: string, caseId: string, data: InsertExhibitPacketItem): Promise<ExhibitPacketItem>;
  updatePacketItem(userId: string, itemId: string, data: UpdateExhibitPacketItem): Promise<ExhibitPacketItem | undefined>;
  deletePacketItem(userId: string, itemId: string): Promise<boolean>;
  reorderPacketItems(userId: string, packetId: string, orderedIds: string[]): Promise<boolean>;

  listPacketItemEvidence(userId: string, packetItemId: string): Promise<EvidenceFile[]>;
  addEvidenceToPacketItem(userId: string, caseId: string, packetItemId: string, evidenceId: string): Promise<ExhibitPacketEvidence | null>;
  removeEvidenceFromPacketItem(userId: string, packetItemId: string, evidenceId: string): Promise<boolean>;
  reorderPacketItemEvidence(userId: string, packetItemId: string, orderedEvidenceIds: string[]): Promise<boolean>;

  listGeneratedExhibitPackets(userId: string, caseId: string): Promise<GeneratedExhibitPacket[]>;
  getGeneratedExhibitPacket(userId: string, genId: string): Promise<GeneratedExhibitPacket | undefined>;
  createGeneratedExhibitPacket(userId: string, caseId: string, packetId: string, title: string, fileKey: string, fileName: string, metaJson: Record<string, unknown>): Promise<GeneratedExhibitPacket>;

  listEvidenceNotes(userId: string, caseId: string, evidenceFileId: string): Promise<EvidenceNote[]>;
  listAllCaseEvidenceNotes(userId: string, caseId: string): Promise<EvidenceNote[]>;
  getEvidenceNote(userId: string, noteId: string): Promise<EvidenceNote | undefined>;
  createEvidenceNote(userId: string, caseId: string, evidenceFileId: string, data: InsertEvidenceNote): Promise<EvidenceNote>;
  updateEvidenceNote(userId: string, noteId: string, data: UpdateEvidenceNote): Promise<EvidenceNote | undefined>;
  deleteEvidenceNote(userId: string, noteId: string): Promise<boolean>;

  linkEvidenceNoteToExhibitList(userId: string, caseId: string, evidenceNoteId: string, exhibitListId: string, data?: InsertExhibitNoteLink): Promise<ExhibitNoteLink>;
  unlinkEvidenceNoteFromExhibitList(userId: string, exhibitListId: string, evidenceNoteId: string): Promise<boolean>;
  listExhibitNoteLinks(userId: string, exhibitListId: string): Promise<ExhibitNoteLink[]>;
  reorderExhibitNoteLinks(userId: string, exhibitListId: string, ordered: { id: string; sortOrder: number }[]): Promise<boolean>;

  addEvidenceToExhibitList(userId: string, caseId: string, exhibitListId: string, evidenceFileId: string, data?: { label?: string; notes?: string }): Promise<ExhibitEvidence>;
  removeEvidenceFromExhibitList(userId: string, exhibitListId: string, evidenceFileId: string): Promise<boolean>;
  listExhibitListEvidence(userId: string, exhibitListId: string): Promise<ExhibitEvidence[]>;
  reorderExhibitListEvidence(userId: string, exhibitListId: string, ordered: { id: string; sortOrder: number }[]): Promise<boolean>;

  listTimelineCategories(userId: string, caseId: string): Promise<TimelineCategory[]>;
  createTimelineCategory(userId: string, caseId: string, data: InsertTimelineCategory): Promise<TimelineCategory>;
  updateTimelineCategory(userId: string, caseId: string, categoryId: string, data: UpdateTimelineCategory): Promise<TimelineCategory | undefined>;
  deleteTimelineCategory(userId: string, caseId: string, categoryId: string): Promise<{ success: boolean; error?: string }>;
  seedSystemTimelineCategories(userId: string, caseId: string): Promise<TimelineCategory[]>;
  getTimelineCategory(userId: string, caseId: string, categoryId: string): Promise<TimelineCategory | undefined>;
  getEventCountByCategory(userId: string, caseId: string, categoryId: string): Promise<number>;

  getParentingPlanByCase(userId: string, caseId: string): Promise<ParentingPlan | undefined>;
  createParentingPlan(userId: string, caseId: string, data?: InsertParentingPlan): Promise<ParentingPlan>;
  updateParentingPlan(userId: string, planId: string, data: UpdateParentingPlan): Promise<ParentingPlan | undefined>;
  getOrCreateParentingPlan(userId: string, caseId: string): Promise<ParentingPlan>;
  deleteParentingPlan(userId: string, planId: string): Promise<boolean>;
  getParentingPlan(userId: string, planId: string): Promise<ParentingPlan | undefined>;

  listParentingPlanSections(userId: string, planId: string): Promise<ParentingPlanSection[]>;
  getParentingPlanSection(userId: string, planId: string, sectionKey: string): Promise<ParentingPlanSection | undefined>;
  upsertParentingPlanSection(userId: string, planId: string, sectionKey: string, data: Record<string, unknown>): Promise<ParentingPlanSection>;

  createEvidenceProcessingJob(userId: string, caseId: string, evidenceId: string): Promise<EvidenceProcessingJob>;
  updateEvidenceProcessingJob(userId: string, jobId: string, patch: UpdateEvidenceProcessingJob): Promise<EvidenceProcessingJob | undefined>;
  getEvidenceProcessingJob(userId: string, jobId: string): Promise<EvidenceProcessingJob | undefined>;
  getEvidenceProcessingJobsForCase(userId: string, caseId: string): Promise<EvidenceProcessingJob[]>;
  getEvidenceProcessingJobByEvidence(userId: string, evidenceId: string): Promise<EvidenceProcessingJob | undefined>;

  upsertEvidenceOcrPage(userId: string, caseId: string, evidenceId: string, pageNumber: number | null, payload: UpsertEvidenceOcrPage): Promise<EvidenceOcrPage>;
  listEvidenceOcrPages(userId: string, caseId: string, evidenceId: string): Promise<EvidenceOcrPage[]>;
  markOcrPageReviewed(userId: string, ocrPageId: string, needsReview?: boolean): Promise<EvidenceOcrPage | undefined>;

  createEvidenceAnchor(userId: string, caseId: string, payload: InsertEvidenceAnchor): Promise<EvidenceAnchor>;
  updateEvidenceAnchor(userId: string, anchorId: string, payload: UpdateEvidenceAnchor): Promise<EvidenceAnchor | undefined>;
  deleteEvidenceAnchor(userId: string, anchorId: string): Promise<boolean>;
  listEvidenceAnchors(userId: string, caseId: string, evidenceId?: string): Promise<EvidenceAnchor[]>;
  getEvidenceAnchor(userId: string, anchorId: string): Promise<EvidenceAnchor | undefined>;

  getEvidenceExtraction(userId: string, caseId: string, evidenceId: string): Promise<EvidenceExtraction | undefined>;
  createEvidenceExtraction(userId: string, caseId: string, payload: InsertEvidenceExtraction): Promise<EvidenceExtraction>;
  updateEvidenceExtraction(userId: string, extractionId: string, payload: UpdateEvidenceExtraction): Promise<EvidenceExtraction | undefined>;
  findStaleProcessingExtractions(staleMinutes?: number): Promise<EvidenceExtraction[]>;
  resetExtractionToQueued(extractionId: string): Promise<EvidenceExtraction | undefined>;
  getExtractionById(extractionId: string): Promise<EvidenceExtraction | undefined>;

  listEvidenceNotesFull(userId: string, caseId: string, evidenceId?: string): Promise<EvidenceNoteFull[]>;
  createEvidenceNoteFull(userId: string, caseId: string, payload: InsertEvidenceNoteFull): Promise<EvidenceNoteFull>;
  updateEvidenceNoteFull(userId: string, noteId: string, payload: UpdateEvidenceNoteFull): Promise<EvidenceNoteFull | undefined>;
  deleteEvidenceNoteFull(userId: string, noteId: string): Promise<boolean>;

  listEvidenceAiAnalyses(userId: string, caseId: string, evidenceId?: string): Promise<EvidenceAiAnalysis[]>;
  createEvidenceAiAnalysis(userId: string, caseId: string, payload: InsertEvidenceAiAnalysis): Promise<EvidenceAiAnalysis>;
  updateEvidenceAiAnalysis(userId: string, analysisId: string, payload: UpdateEvidenceAiAnalysis): Promise<EvidenceAiAnalysis | undefined>;
  deleteEvidenceAiAnalysis(userId: string, analysisId: string): Promise<boolean>;

  listExhibitSnippets(userId: string, caseId: string, exhibitListId?: string): Promise<ExhibitSnippet[]>;
  createExhibitSnippet(userId: string, caseId: string, payload: InsertExhibitSnippet): Promise<ExhibitSnippet>;
  updateExhibitSnippet(userId: string, snippetId: string, payload: UpdateExhibitSnippet): Promise<ExhibitSnippet | undefined>;
  deleteExhibitSnippet(userId: string, snippetId: string): Promise<boolean>;

  listTrialPrepShortlist(userId: string, caseId: string): Promise<TrialPrepShortlist[]>;
  getTrialPrepShortlistItem(userId: string, itemId: string): Promise<TrialPrepShortlist | undefined>;
  createTrialPrepShortlistItem(userId: string, caseId: string, payload: InsertTrialPrepShortlist): Promise<TrialPrepShortlist>;
  updateTrialPrepShortlistItem(userId: string, itemId: string, payload: UpdateTrialPrepShortlist): Promise<TrialPrepShortlist | undefined>;
  deleteTrialPrepShortlistItem(userId: string, itemId: string): Promise<boolean>;

  searchCase(userId: string, caseId: string, q: string, limit: number): Promise<Array<{
    type: string;
    id: string;
    title: string;
    snippet: string | null;
    href: string;
    updatedAt: string | null;
    rank: number;
  }>>;

  createCitationPointer(userId: string, caseId: string, data: InsertCitationPointer): Promise<CitationPointer>;
  listCitationPointersByEvidence(userId: string, caseId: string, evidenceFileId: string): Promise<CitationPointer[]>;

  createCaseClaim(userId: string, caseId: string, data: InsertCaseClaim): Promise<CaseClaim>;
  listCaseClaims(userId: string, caseId: string, filters?: { status?: ClaimStatus; evidenceFileId?: string }): Promise<CaseClaim[]>;
  getCaseClaim(userId: string, claimId: string): Promise<CaseClaim | undefined>;
  updateCaseClaim(userId: string, claimId: string, patch: UpdateCaseClaim): Promise<CaseClaim | undefined>;
  deleteCaseClaim(userId: string, claimId: string): Promise<boolean>;
  attachClaimCitation(userId: string, claimId: string, citationId: string): Promise<boolean>;
  detachClaimCitation(userId: string, claimId: string, citationId: string): Promise<boolean>;
  listClaimCitations(userId: string, claimId: string): Promise<CitationPointer[]>;

  createIssueGrouping(userId: string, caseId: string, data: InsertIssueGrouping): Promise<IssueGrouping>;
  listIssueGroupings(userId: string, caseId: string): Promise<IssueGrouping[]>;
  getIssueGrouping(userId: string, issueId: string): Promise<IssueGrouping | undefined>;
  updateIssueGrouping(userId: string, issueId: string, patch: UpdateIssueGrouping): Promise<IssueGrouping | undefined>;
  deleteIssueGrouping(userId: string, issueId: string): Promise<boolean>;
  addClaimToIssue(userId: string, issueId: string, claimId: string): Promise<boolean>;
  removeClaimFromIssue(userId: string, issueId: string, claimId: string): Promise<boolean>;
  listIssueClaims(userId: string, issueId: string): Promise<CaseClaim[]>;

  getCaseDraftReadiness(userId: string, caseId: string): Promise<DraftReadinessStats>;

  getClaimsCompilePreflight(caseId: string, userId: string): Promise<{
    acceptedClaims: { id: string; missingInfoFlag: boolean }[];
    claimCitationCounts: Record<string, number>;
  }>;

  autoAttachClaimCitation(userId: string, claimId: string, options?: { maxAttach?: number; preferEvidenceId?: string }): Promise<{ attached: number; citationIds: string[] }>;
  
  listCitationPointersForCase(userId: string, caseId: string): Promise<CitationPointer[]>;

  getLexiUserPrefs(userId: string): Promise<LexiUserPrefs | undefined>;
  upsertLexiUserPrefs(userId: string, data: UpsertLexiUserPrefs): Promise<LexiUserPrefs>;

  getLexiCaseMemory(userId: string, caseId: string): Promise<LexiCaseMemory | undefined>;
  upsertLexiCaseMemory(userId: string, caseId: string, data: Partial<UpsertLexiCaseMemory>): Promise<LexiCaseMemory>;
  updateLexiCaseMemoryMarkdown(userId: string, caseId: string, memoryMarkdown: string): Promise<void>;
  createActivityLog(userId: string, caseId: string | null, type: string, summary: string, metadata?: Record<string, unknown>): Promise<ActivityLog>;
  listActivityLogs(userId: string, limit?: number, offset?: number): Promise<ActivityLog[]>;

  createLexiFeedbackEvent(userId: string, caseId: string | null, eventType: string, payload: Record<string, unknown>): Promise<LexiFeedbackEvent>;
  listLexiFeedbackEvents(userId: string, caseId: string | null, limit?: number): Promise<LexiFeedbackEvent[]>;

  // Phase 2F: Case Facts
  createCaseFact(userId: string, caseId: string, data: InsertCaseFact): Promise<CaseFact>;
  listCaseFacts(userId: string, caseId: string, filters?: ListCaseFactsFilters): Promise<CaseFact[]>;
  getCaseFact(userId: string, factId: string): Promise<CaseFact | undefined>;
  updateCaseFact(userId: string, factId: string, patch: UpdateCaseFact): Promise<CaseFact | undefined>;
  deleteCaseFact(userId: string, factId: string): Promise<boolean>;
  
  // Phase 2F: Fact Citations
  attachFactCitation(userId: string, caseId: string, factId: string, citationId: string): Promise<FactCitation>;
  detachFactCitation(userId: string, factId: string, citationId: string): Promise<boolean>;
  listFactCitations(userId: string, factId: string): Promise<FactCitation[]>;

  // Phase 3A: Cross-Module Links
  createTimelineEventLink(userId: string, caseId: string, eventId: string, payload: InsertTimelineEventLink): Promise<TimelineEventLink>;
  listTimelineEventLinks(userId: string, caseId: string, eventId: string): Promise<TimelineEventLink[]>;
  deleteTimelineEventLink(userId: string, linkId: string): Promise<boolean>;
  
  createClaimLink(userId: string, caseId: string, claimId: string, payload: InsertClaimLink): Promise<ClaimLink>;
  listClaimLinks(userId: string, caseId: string, claimId: string): Promise<ClaimLink[]>;
  deleteClaimLink(userId: string, linkId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: insertUser.email.toLowerCase(),
        passwordHash: insertUser.passwordHash,
      })
      .returning();
    return user;
  }

  async getCasesByUserId(userId: string): Promise<Case[]> {
    return db.select().from(cases).where(eq(cases.userId, userId));
  }

  async getCaseCountByUserId(userId: string): Promise<number> {
    const userCases = await db.select().from(cases).where(eq(cases.userId, userId));
    return userCases.length;
  }

  async getCase(caseId: string, userId: string): Promise<Case | undefined> {
    const [caseRecord] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.userId, userId)));
    return caseRecord;
  }

  async createCase(userId: string, caseData: InsertCase): Promise<Case> {
    const [newCase] = await db
      .insert(cases)
      .values({
        userId,
        title: caseData.title,
        nickname: caseData.nickname,
        state: caseData.state,
        county: caseData.county,
        caseNumber: caseData.caseNumber,
        caseType: caseData.caseType,
        hasChildren: caseData.hasChildren ?? false,
      })
      .returning();
    return newCase;
  }

  async updateCase(caseId: string, userId: string, caseData: Partial<InsertCase>): Promise<Case | undefined> {
    const existingCase = await this.getCase(caseId, userId);
    if (!existingCase) {
      return undefined;
    }
    const [updatedCase] = await db
      .update(cases)
      .set({
        title: caseData.title ?? existingCase.title,
        nickname: caseData.nickname !== undefined ? caseData.nickname : existingCase.nickname,
        state: caseData.state ?? existingCase.state,
        county: caseData.county ?? existingCase.county,
        caseNumber: caseData.caseNumber !== undefined ? caseData.caseNumber : existingCase.caseNumber,
        caseType: caseData.caseType ?? existingCase.caseType,
        hasChildren: caseData.hasChildren ?? existingCase.hasChildren,
        updatedAt: new Date(),
      })
      .where(and(eq(cases.id, caseId), eq(cases.userId, userId)))
      .returning();
    return updatedCase;
  }

  async getAuthIdentity(provider: string, providerUserId: string): Promise<AuthIdentity | undefined> {
    const [identity] = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, provider),
          eq(authIdentities.providerUserId, providerUserId)
        )
      );
    return identity;
  }

  async createAuthIdentity(identity: InsertAuthIdentity): Promise<AuthIdentity> {
    const [authIdentity] = await db
      .insert(authIdentities)
      .values(identity)
      .returning();
    return authIdentity;
  }

  async getAuthIdentitiesByUserId(userId: string): Promise<AuthIdentity[]> {
    return db
      .select()
      .from(authIdentities)
      .where(eq(authIdentities.userId, userId));
  }

  async listTimelineEvents(caseId: string, userId: string): Promise<TimelineEvent[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.caseId, caseId), eq(timelineEvents.userId, userId)))
      .orderBy(desc(timelineEvents.eventDate));
  }

  async getTimelineEvent(eventId: string, userId: string): Promise<TimelineEvent | undefined> {
    const [event] = await db
      .select()
      .from(timelineEvents)
      .where(and(eq(timelineEvents.id, eventId), eq(timelineEvents.userId, userId)));
    return event;
  }

  async createTimelineEvent(caseId: string, userId: string, data: InsertTimelineEvent): Promise<TimelineEvent> {
    const [event] = await db
      .insert(timelineEvents)
      .values({
        userId,
        caseId,
        eventDate: data.eventDate,
        title: data.title,
        category: data.category,
        notes: data.notes,
        source: "user_manual",
      })
      .returning();
    return event;
  }

  async updateTimelineEvent(eventId: string, userId: string, data: Partial<InsertTimelineEvent>): Promise<TimelineEvent | undefined> {
    const existingEvent = await this.getTimelineEvent(eventId, userId);
    if (!existingEvent) {
      return undefined;
    }
    const caseRecord = await this.getCase(existingEvent.caseId, userId);
    if (!caseRecord) {
      return undefined;
    }
    const [updatedEvent] = await db
      .update(timelineEvents)
      .set({
        eventDate: data.eventDate ?? existingEvent.eventDate,
        title: data.title ?? existingEvent.title,
        category: data.category ?? existingEvent.category,
        notes: data.notes !== undefined ? data.notes : existingEvent.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(timelineEvents.id, eventId), eq(timelineEvents.userId, userId)))
      .returning();
    return updatedEvent;
  }

  async deleteTimelineEvent(eventId: string, userId: string): Promise<boolean> {
    const existingEvent = await this.getTimelineEvent(eventId, userId);
    if (!existingEvent) {
      return false;
    }
    const caseRecord = await this.getCase(existingEvent.caseId, userId);
    if (!caseRecord) {
      return false;
    }
    await db
      .delete(timelineEvents)
      .where(and(eq(timelineEvents.id, eventId), eq(timelineEvents.userId, userId)));
    return true;
  }

  async listEvidenceFiles(caseId: string, userId: string): Promise<EvidenceFile[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(evidenceFiles)
      .where(and(eq(evidenceFiles.caseId, caseId), eq(evidenceFiles.userId, userId)))
      .orderBy(desc(evidenceFiles.createdAt));
  }

  async getEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined> {
    const [file] = await db
      .select()
      .from(evidenceFiles)
      .where(and(eq(evidenceFiles.id, evidenceId), eq(evidenceFiles.userId, userId)));
    return file;
  }

  async createEvidenceFile(caseId: string, userId: string, data: InsertEvidenceFile): Promise<EvidenceFile> {
    const [file] = await db
      .insert(evidenceFiles)
      .values({
        userId,
        caseId,
        originalName: data.originalName,
        storageKey: data.storageKey,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        sha256: data.sha256,
        notes: data.notes,
      })
      .returning();
    return file;
  }

  async deleteEvidenceFile(evidenceId: string, userId: string): Promise<EvidenceFile | undefined> {
    const file = await this.getEvidenceFile(evidenceId, userId);
    if (!file) {
      return undefined;
    }
    await db
      .delete(evidenceFiles)
      .where(and(eq(evidenceFiles.id, evidenceId), eq(evidenceFiles.userId, userId)));
    return file;
  }

  async updateEvidenceMetadata(
    evidenceId: string,
    userId: string,
    data: { category?: string; description?: string; tags?: string }
  ): Promise<EvidenceFile | undefined> {
    const file = await this.getEvidenceFile(evidenceId, userId);
    if (!file) {
      return undefined;
    }
    const [updated] = await db
      .update(evidenceFiles)
      .set({
        category: data.category,
        description: data.description,
        tags: data.tags,
      })
      .where(and(eq(evidenceFiles.id, evidenceId), eq(evidenceFiles.userId, userId)))
      .returning();
    return updated;
  }

  async listDocuments(caseId: string, userId: string): Promise<Document[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(documents)
      .where(and(eq(documents.caseId, caseId), eq(documents.userId, userId)))
      .orderBy(desc(documents.updatedAt));
  }

  async getDocument(docId: string, userId: string): Promise<Document | undefined> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, docId), eq(documents.userId, userId)));
    return doc;
  }

  async createDocument(caseId: string, userId: string, data: InsertDocument): Promise<Document> {
    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        caseId,
        title: data.title,
        templateKey: data.templateKey,
        content: data.content || "",
      })
      .returning();
    return doc;
  }

  async updateDocument(docId: string, userId: string, data: UpdateDocument): Promise<Document | undefined> {
    const existingDoc = await this.getDocument(docId, userId);
    if (!existingDoc) {
      return undefined;
    }
    const [updated] = await db
      .update(documents)
      .set({
        title: data.title ?? existingDoc.title,
        content: data.content !== undefined ? data.content : existingDoc.content,
        updatedAt: new Date(),
      })
      .where(and(eq(documents.id, docId), eq(documents.userId, userId)))
      .returning();
    return updated;
  }

  async duplicateDocument(docId: string, userId: string): Promise<Document | undefined> {
    const existingDoc = await this.getDocument(docId, userId);
    if (!existingDoc) {
      return undefined;
    }
    const [dup] = await db
      .insert(documents)
      .values({
        userId,
        caseId: existingDoc.caseId,
        title: `${existingDoc.title} (Copy)`,
        templateKey: existingDoc.templateKey,
        content: existingDoc.content,
      })
      .returning();
    return dup;
  }

  async deleteDocument(docId: string, userId: string): Promise<boolean> {
    const existingDoc = await this.getDocument(docId, userId);
    if (!existingDoc) {
      return false;
    }
    await db
      .delete(documents)
      .where(and(eq(documents.id, docId), eq(documents.userId, userId)));
    return true;
  }

  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return profile;
  }

  async upsertUserProfile(userId: string, data: UpsertUserProfile): Promise<UserProfile> {
    const existing = await this.getUserProfile(userId);
    if (existing) {
      const [updated] = await db
        .update(userProfiles)
        .set({
          fullName: data.fullName !== undefined ? data.fullName : existing.fullName,
          email: data.email !== undefined ? data.email : existing.email,
          addressLine1: data.addressLine1 !== undefined ? data.addressLine1 : existing.addressLine1,
          addressLine2: data.addressLine2 !== undefined ? data.addressLine2 : existing.addressLine2,
          city: data.city !== undefined ? data.city : existing.city,
          state: data.state !== undefined ? data.state : existing.state,
          zip: data.zip !== undefined ? data.zip : existing.zip,
          phone: data.phone !== undefined ? data.phone : existing.phone,
          partyRole: data.partyRole !== undefined ? data.partyRole : existing.partyRole,
          isSelfRepresented: data.isSelfRepresented !== undefined ? data.isSelfRepresented : existing.isSelfRepresented,
          autoFillEnabled: data.autoFillEnabled !== undefined ? data.autoFillEnabled : existing.autoFillEnabled,
          petitionerName: data.petitionerName !== undefined ? data.petitionerName : existing.petitionerName,
          respondentName: data.respondentName !== undefined ? data.respondentName : existing.respondentName,
          onboardingCompleted: data.onboardingCompleted !== undefined ? data.onboardingCompleted : existing.onboardingCompleted,
          onboardingCompletedAt: data.onboardingCompletedAt !== undefined ? data.onboardingCompletedAt : existing.onboardingCompletedAt,
          onboardingDeferred: data.onboardingDeferred !== undefined ? data.onboardingDeferred : existing.onboardingDeferred,
          onboardingStatus: data.onboardingStatus !== undefined ? data.onboardingStatus : existing.onboardingStatus,
          tosAcceptedAt: data.tosAcceptedAt !== undefined ? data.tosAcceptedAt : existing.tosAcceptedAt,
          privacyAcceptedAt: data.privacyAcceptedAt !== undefined ? data.privacyAcceptedAt : existing.privacyAcceptedAt,
          disclaimersAcceptedAt: data.disclaimersAcceptedAt !== undefined ? data.disclaimersAcceptedAt : existing.disclaimersAcceptedAt,
          tosVersion: data.tosVersion !== undefined ? data.tosVersion : existing.tosVersion,
          privacyVersion: data.privacyVersion !== undefined ? data.privacyVersion : existing.privacyVersion,
          disclaimersVersion: data.disclaimersVersion !== undefined ? data.disclaimersVersion : existing.disclaimersVersion,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userProfiles)
        .values({
          userId,
          fullName: data.fullName ?? null,
          email: data.email ?? null,
          addressLine1: data.addressLine1 ?? null,
          addressLine2: data.addressLine2 ?? null,
          city: data.city ?? null,
          state: data.state ?? null,
          zip: data.zip ?? null,
          phone: data.phone ?? null,
          partyRole: data.partyRole ?? null,
          isSelfRepresented: data.isSelfRepresented ?? true,
          autoFillEnabled: data.autoFillEnabled ?? true,
          petitionerName: data.petitionerName ?? null,
          respondentName: data.respondentName ?? null,
          onboardingCompleted: data.onboardingCompleted ?? false,
          onboardingCompletedAt: data.onboardingCompletedAt ?? null,
          onboardingDeferred: data.onboardingDeferred ?? {},
          onboardingStatus: data.onboardingStatus ?? "incomplete",
          tosAcceptedAt: data.tosAcceptedAt ?? null,
          privacyAcceptedAt: data.privacyAcceptedAt ?? null,
          disclaimersAcceptedAt: data.disclaimersAcceptedAt ?? null,
          tosVersion: data.tosVersion ?? "v1",
          privacyVersion: data.privacyVersion ?? "v1",
          disclaimersVersion: data.disclaimersVersion ?? "v1",
        })
        .returning();
      return created;
    }
  }

  async listGeneratedDocuments(userId: string, caseId: string): Promise<GeneratedDocument[]> {
    const docs = await db
      .select()
      .from(generatedDocuments)
      .where(and(eq(generatedDocuments.userId, userId), eq(generatedDocuments.caseId, caseId)))
      .orderBy(desc(generatedDocuments.createdAt));
    return docs;
  }

  async createGeneratedDocument(
    userId: string,
    caseId: string,
    templateType: string,
    title: string,
    payloadJson: GenerateDocumentPayload
  ): Promise<GeneratedDocument> {
    const [doc] = await db
      .insert(generatedDocuments)
      .values({
        userId,
        caseId,
        templateType,
        title,
        payloadJson,
      })
      .returning();
    return doc;
  }

  async getGeneratedDocument(userId: string, docId: string): Promise<GeneratedDocument | undefined> {
    const [doc] = await db
      .select()
      .from(generatedDocuments)
      .where(and(eq(generatedDocuments.id, docId), eq(generatedDocuments.userId, userId)));
    return doc;
  }

  async listCaseChildren(caseId: string, userId: string): Promise<CaseChild[]> {
    const caseRecord = await this.getCase(caseId, userId);
    if (!caseRecord) {
      return [];
    }
    return db
      .select()
      .from(caseChildren)
      .where(and(eq(caseChildren.caseId, caseId), eq(caseChildren.userId, userId)))
      .orderBy(desc(caseChildren.createdAt));
  }

  async getCaseChild(childId: string, userId: string): Promise<CaseChild | undefined> {
    const [child] = await db
      .select()
      .from(caseChildren)
      .where(and(eq(caseChildren.id, childId), eq(caseChildren.userId, userId)));
    return child;
  }

  async createCaseChild(caseId: string, userId: string, data: InsertCaseChild): Promise<CaseChild> {
    const [child] = await db
      .insert(caseChildren)
      .values({
        userId,
        caseId,
        firstName: data.firstName,
        lastName: data.lastName ?? null,
        dateOfBirth: data.dateOfBirth,
        notes: data.notes ?? null,
      })
      .returning();
    return child;
  }

  async updateCaseChild(childId: string, userId: string, data: UpdateCaseChild): Promise<CaseChild | undefined> {
    const existing = await this.getCaseChild(childId, userId);
    if (!existing) {
      return undefined;
    }
    const [updated] = await db
      .update(caseChildren)
      .set({
        firstName: data.firstName ?? existing.firstName,
        lastName: data.lastName !== undefined ? data.lastName : existing.lastName,
        dateOfBirth: data.dateOfBirth ?? existing.dateOfBirth,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      })
      .where(and(eq(caseChildren.id, childId), eq(caseChildren.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCaseChild(childId: string, userId: string): Promise<boolean> {
    const existing = await this.getCaseChild(childId, userId);
    if (!existing) {
      return false;
    }
    await db
      .delete(caseChildren)
      .where(and(eq(caseChildren.id, childId), eq(caseChildren.userId, userId)));
    return true;
  }

  async deleteAllCaseChildren(caseId: string, userId: string): Promise<number> {
    const existing = await this.listCaseChildren(caseId, userId);
    if (existing.length === 0) return 0;
    await db
      .delete(caseChildren)
      .where(and(eq(caseChildren.caseId, caseId), eq(caseChildren.userId, userId)));
    return existing.length;
  }

  async listTasks(userId: string, caseId: string): Promise<Task[]> {
    const rows = await db.select().from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.caseId, caseId)))
      .orderBy(desc(tasks.createdAt));
    return rows;
  }

  async createTask(userId: string, caseId: string, data: InsertTask): Promise<Task> {
    const [row] = await db.insert(tasks)
      .values({
        userId,
        caseId,
        title: data.title,
        description: data.description ?? null,
        status: data.status ?? "open",
        dueDate: data.dueDate ?? null,
        priority: data.priority ?? 2,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateTask(userId: string, taskId: string, data: UpdateTask): Promise<Task | undefined> {
    const [row] = await db.update(tasks)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("description" in data ? { description: data.description ?? null } : {}),
        ...("status" in data ? { status: data.status } : {}),
        ...("dueDate" in data ? { dueDate: data.dueDate ?? null } : {}),
        ...("priority" in data ? { priority: data.priority } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    return row;
  }

  async deleteTask(userId: string, taskId: string): Promise<boolean> {
    const res = await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).returning();
    return res.length > 0;
  }

  async listDeadlines(userId: string, caseId: string): Promise<Deadline[]> {
    const rows = await db.select().from(deadlines)
      .where(and(eq(deadlines.userId, userId), eq(deadlines.caseId, caseId)))
      .orderBy(asc(deadlines.dueDate));
    return rows;
  }

  async createDeadline(userId: string, caseId: string, data: InsertDeadline): Promise<Deadline> {
    const [row] = await db.insert(deadlines)
      .values({
        userId,
        caseId,
        title: data.title,
        notes: data.notes ?? null,
        status: data.status ?? "upcoming",
        dueDate: data.dueDate,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateDeadline(userId: string, deadlineId: string, data: UpdateDeadline): Promise<Deadline | undefined> {
    const [row] = await db.update(deadlines)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
        ...("status" in data ? { status: data.status } : {}),
        ...("dueDate" in data ? { dueDate: data.dueDate } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, userId)))
      .returning();
    return row;
  }

  async deleteDeadline(userId: string, deadlineId: string): Promise<boolean> {
    const res = await db.delete(deadlines).where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, userId))).returning();
    return res.length > 0;
  }

  async listCalendarCategories(userId: string, caseId: string): Promise<CalendarCategory[]> {
    const rows = await db.select().from(calendarCategories)
      .where(and(eq(calendarCategories.userId, userId), eq(calendarCategories.caseId, caseId)))
      .orderBy(asc(calendarCategories.name));
    return rows;
  }

  async createCalendarCategory(userId: string, caseId: string, data: InsertCalendarCategory): Promise<CalendarCategory> {
    const [row] = await db.insert(calendarCategories)
      .values({
        userId,
        caseId,
        name: data.name,
        color: data.color ?? "#7BA3A8",
      })
      .returning();
    return row;
  }

  async listCaseCalendarItems(userId: string, caseId: string): Promise<CaseCalendarItem[]> {
    const rows = await db.select().from(caseCalendarItems)
      .where(and(eq(caseCalendarItems.userId, userId), eq(caseCalendarItems.caseId, caseId)))
      .orderBy(asc(caseCalendarItems.startDate));
    return rows;
  }

  async createCaseCalendarItem(userId: string, caseId: string, data: InsertCaseCalendarItem): Promise<CaseCalendarItem> {
    const [row] = await db.insert(caseCalendarItems)
      .values({
        userId,
        caseId,
        title: data.title,
        startDate: data.startDate,
        categoryId: data.categoryId ?? null,
        colorOverride: data.colorOverride ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateCaseCalendarItem(userId: string, itemId: string, data: UpdateCaseCalendarItem): Promise<CaseCalendarItem | undefined> {
    const [row] = await db.update(caseCalendarItems)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("startDate" in data ? { startDate: data.startDate } : {}),
        ...("isDone" in data ? { isDone: data.isDone } : {}),
        ...("categoryId" in data ? { categoryId: data.categoryId ?? null } : {}),
        ...("colorOverride" in data ? { colorOverride: data.colorOverride ?? null } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(caseCalendarItems.id, itemId), eq(caseCalendarItems.userId, userId)))
      .returning();
    return row;
  }

  async deleteCaseCalendarItem(userId: string, itemId: string): Promise<boolean> {
    const res = await db.delete(caseCalendarItems).where(and(eq(caseCalendarItems.id, itemId), eq(caseCalendarItems.userId, userId))).returning();
    return res.length > 0;
  }

  async listContacts(userId: string, caseId: string): Promise<CaseContact[]> {
    const rows = await db.select().from(caseContacts)
      .where(and(eq(caseContacts.userId, userId), eq(caseContacts.caseId, caseId)))
      .orderBy(asc(caseContacts.name));
    return rows;
  }

  async getContact(userId: string, contactId: string): Promise<CaseContact | undefined> {
    const [row] = await db.select().from(caseContacts)
      .where(and(eq(caseContacts.id, contactId), eq(caseContacts.userId, userId)));
    return row;
  }

  async createContact(userId: string, caseId: string, data: InsertContact): Promise<CaseContact> {
    const [row] = await db.insert(caseContacts)
      .values({
        userId,
        caseId,
        name: data.name,
        role: data.role ?? "other",
        organizationOrFirm: data.organizationOrFirm ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        notes: data.notes ?? null,
      })
      .returning();
    return row;
  }

  async updateContact(userId: string, contactId: string, data: UpdateContact): Promise<CaseContact | undefined> {
    const [row] = await db.update(caseContacts)
      .set({
        ...("name" in data ? { name: data.name } : {}),
        ...("role" in data ? { role: data.role } : {}),
        ...("organizationOrFirm" in data ? { organizationOrFirm: data.organizationOrFirm ?? null } : {}),
        ...("email" in data ? { email: data.email ?? null } : {}),
        ...("phone" in data ? { phone: data.phone ?? null } : {}),
        ...("address" in data ? { address: data.address ?? null } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
      })
      .where(and(eq(caseContacts.id, contactId), eq(caseContacts.userId, userId)))
      .returning();
    return row;
  }

  async deleteContact(userId: string, contactId: string): Promise<boolean> {
    const res = await db.delete(caseContacts).where(and(eq(caseContacts.id, contactId), eq(caseContacts.userId, userId))).returning();
    return res.length > 0;
  }

  async listCommunications(userId: string, caseId: string): Promise<CaseCommunication[]> {
    const rows = await db.select().from(caseCommunications)
      .where(and(eq(caseCommunications.userId, userId), eq(caseCommunications.caseId, caseId)))
      .orderBy(desc(caseCommunications.occurredAt));
    return rows;
  }

  async getCommunication(userId: string, commId: string): Promise<CaseCommunication | undefined> {
    const [row] = await db.select().from(caseCommunications)
      .where(and(eq(caseCommunications.id, commId), eq(caseCommunications.userId, userId)));
    return row;
  }

  async createCommunication(userId: string, caseId: string, data: InsertCommunication): Promise<CaseCommunication> {
    const [row] = await db.insert(caseCommunications)
      .values({
        userId,
        caseId,
        contactId: data.contactId ?? null,
        direction: data.direction ?? "outgoing",
        channel: data.channel ?? "email",
        status: data.status ?? "draft",
        occurredAt: data.occurredAt ?? new Date(),
        subject: data.subject ?? null,
        summary: data.summary,
        followUpAt: data.followUpAt ?? null,
        needsFollowUp: data.needsFollowUp ?? false,
        pinned: data.pinned ?? false,
        evidenceIds: data.evidenceIds ?? null,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateCommunication(userId: string, commId: string, data: UpdateCommunication): Promise<CaseCommunication | undefined> {
    const [row] = await db.update(caseCommunications)
      .set({
        ...("contactId" in data ? { contactId: data.contactId ?? null } : {}),
        ...("direction" in data ? { direction: data.direction } : {}),
        ...("channel" in data ? { channel: data.channel } : {}),
        ...("status" in data ? { status: data.status } : {}),
        ...("occurredAt" in data ? { occurredAt: data.occurredAt } : {}),
        ...("subject" in data ? { subject: data.subject ?? null } : {}),
        ...("summary" in data ? { summary: data.summary } : {}),
        ...("followUpAt" in data ? { followUpAt: data.followUpAt ?? null } : {}),
        ...("needsFollowUp" in data ? { needsFollowUp: data.needsFollowUp } : {}),
        ...("pinned" in data ? { pinned: data.pinned } : {}),
        ...("evidenceIds" in data ? { evidenceIds: data.evidenceIds ?? null } : {}),
        ...("timelineEventId" in data ? { timelineEventId: data.timelineEventId ?? null } : {}),
        ...("calendarItemId" in data ? { calendarItemId: data.calendarItemId ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(caseCommunications.id, commId), eq(caseCommunications.userId, userId)))
      .returning();
    return row;
  }

  async deleteCommunication(userId: string, commId: string): Promise<boolean> {
    const res = await db.delete(caseCommunications).where(and(eq(caseCommunications.id, commId), eq(caseCommunications.userId, userId))).returning();
    return res.length > 0;
  }

  async listExhibitLists(userId: string, caseId: string): Promise<ExhibitList[]> {
    const rows = await db.select().from(exhibitLists)
      .where(and(eq(exhibitLists.userId, userId), eq(exhibitLists.caseId, caseId)))
      .orderBy(desc(exhibitLists.createdAt));
    return rows;
  }

  async getExhibitList(userId: string, listId: string): Promise<ExhibitList | undefined> {
    const [row] = await db.select().from(exhibitLists)
      .where(and(eq(exhibitLists.id, listId), eq(exhibitLists.userId, userId)));
    return row;
  }

  async createExhibitList(userId: string, caseId: string, data: InsertExhibitList): Promise<ExhibitList> {
    const [row] = await db.insert(exhibitLists)
      .values({
        userId,
        caseId,
        title: data.title,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateExhibitList(userId: string, listId: string, data: UpdateExhibitList): Promise<ExhibitList | undefined> {
    const [row] = await db.update(exhibitLists)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("notes" in data ? { notes: data.notes ?? null } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(exhibitLists.id, listId), eq(exhibitLists.userId, userId)))
      .returning();
    return row;
  }

  async deleteExhibitList(userId: string, listId: string): Promise<boolean> {
    const list = await this.getExhibitList(userId, listId);
    if (!list) return false;
    const exhibitRows = await db.select().from(exhibits)
      .where(and(eq(exhibits.exhibitListId, listId), eq(exhibits.userId, userId)));
    const exhibitIds = exhibitRows.map(e => e.id);
    if (exhibitIds.length > 0) {
      await db.delete(exhibitEvidence).where(and(eq(exhibitEvidence.userId, userId), inArray(exhibitEvidence.exhibitId, exhibitIds)));
    }
    await db.delete(exhibits).where(and(eq(exhibits.exhibitListId, listId), eq(exhibits.userId, userId)));
    const res = await db.delete(exhibitLists).where(and(eq(exhibitLists.id, listId), eq(exhibitLists.userId, userId))).returning();
    return res.length > 0;
  }

  private generateNextLabel(existingLabels: string[]): string {
    const usedLabels = new Set(existingLabels.map(l => l.toUpperCase()));
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (const letter of alphabet) {
      if (!usedLabels.has(letter)) return letter;
    }
    for (const first of alphabet) {
      for (const second of alphabet) {
        const combo = first + second;
        if (!usedLabels.has(combo)) return combo;
      }
    }
    return `EX${existingLabels.length + 1}`;
  }

  async listExhibits(userId: string, exhibitListId: string): Promise<Exhibit[]> {
    const rows = await db.select().from(exhibits)
      .where(and(eq(exhibits.userId, userId), eq(exhibits.exhibitListId, exhibitListId)))
      .orderBy(asc(exhibits.sortOrder));
    return rows;
  }

  async getExhibit(userId: string, exhibitId: string): Promise<Exhibit | undefined> {
    const [row] = await db.select().from(exhibits)
      .where(and(eq(exhibits.id, exhibitId), eq(exhibits.userId, userId)));
    return row;
  }

  async createExhibit(userId: string, caseId: string, exhibitListId: string, data: InsertExhibit): Promise<Exhibit> {
    const existing = await this.listExhibits(userId, exhibitListId);
    const existingLabels = existing.map(e => e.label);
    const label = this.generateNextLabel(existingLabels);
    const maxSort = existing.length > 0 ? Math.max(...existing.map(e => e.sortOrder)) : -1;
    const [row] = await db.insert(exhibits)
      .values({
        userId,
        caseId,
        exhibitListId,
        label,
        title: data.title,
        description: data.description ?? null,
        sortOrder: maxSort + 1,
        included: data.included ?? true,
        updatedAt: new Date(),
      })
      .returning();
    return row;
  }

  async updateExhibit(userId: string, exhibitId: string, data: UpdateExhibit): Promise<Exhibit | undefined> {
    const [row] = await db.update(exhibits)
      .set({
        ...("title" in data ? { title: data.title } : {}),
        ...("description" in data ? { description: data.description ?? null } : {}),
        ...("included" in data ? { included: data.included } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(exhibits.id, exhibitId), eq(exhibits.userId, userId)))
      .returning();
    return row;
  }

  async deleteExhibit(userId: string, exhibitId: string): Promise<boolean> {
    await db.delete(exhibitEvidence).where(and(eq(exhibitEvidence.exhibitId, exhibitId), eq(exhibitEvidence.userId, userId)));
    const res = await db.delete(exhibits).where(and(eq(exhibits.id, exhibitId), eq(exhibits.userId, userId))).returning();
    return res.length > 0;
  }

  async reorderExhibits(userId: string, exhibitListId: string, orderedIds: string[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(exhibits)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(eq(exhibits.id, orderedIds[i]), eq(exhibits.userId, userId), eq(exhibits.exhibitListId, exhibitListId)));
    }
    return true;
  }

  async listExhibitEvidence(userId: string, exhibitId: string): Promise<EvidenceFile[]> {
    const links = await db.select().from(exhibitEvidence)
      .where(and(eq(exhibitEvidence.exhibitId, exhibitId), eq(exhibitEvidence.userId, userId)));
    if (links.length === 0) return [];
    const evidenceIds = links.map(l => l.evidenceId);
    const files = await db.select().from(evidenceFiles)
      .where(and(eq(evidenceFiles.userId, userId), inArray(evidenceFiles.id, evidenceIds)));
    return files;
  }

  async attachEvidence(userId: string, caseId: string, exhibitId: string, evidenceId: string): Promise<ExhibitEvidence | null> {
    const existing = await db.select().from(exhibitEvidence)
      .where(and(eq(exhibitEvidence.exhibitId, exhibitId), eq(exhibitEvidence.evidenceId, evidenceId)));
    if (existing.length > 0) return null;
    const [row] = await db.insert(exhibitEvidence)
      .values({ userId, caseId, exhibitId, evidenceId })
      .returning();
    return row;
  }

  async detachEvidence(userId: string, exhibitId: string, evidenceId: string): Promise<boolean> {
    const res = await db.delete(exhibitEvidence)
      .where(and(eq(exhibitEvidence.exhibitId, exhibitId), eq(exhibitEvidence.evidenceId, evidenceId), eq(exhibitEvidence.userId, userId)))
      .returning();
    return res.length > 0;
  }

  async getExhibitsForEvidence(userId: string, evidenceId: string): Promise<Exhibit[]> {
    const links = await db.select().from(exhibitEvidence)
      .where(and(eq(exhibitEvidence.evidenceId, evidenceId), eq(exhibitEvidence.userId, userId)));
    if (links.length === 0) return [];
    const exhibitIds = links.map(l => l.exhibitId);
    const rows = await db.select().from(exhibits)
      .where(and(eq(exhibits.userId, userId), inArray(exhibits.id, exhibitIds)));
    return rows;
  }

  async listLexiThreads(userId: string, caseId: string | null): Promise<LexiThread[]> {
    const caseCondition = caseId === null 
      ? isNull(lexiThreads.caseId)
      : eq(lexiThreads.caseId, caseId);
    return db.select().from(lexiThreads)
      .where(and(eq(lexiThreads.userId, userId), caseCondition))
      .orderBy(desc(lexiThreads.updatedAt));
  }

  async createLexiThread(userId: string, caseId: string | null, title: string): Promise<LexiThread> {
    const [row] = await db.insert(lexiThreads)
      .values({ userId, caseId, title })
      .returning();
    return row;
  }

  async renameLexiThread(userId: string, threadId: string, title: string): Promise<LexiThread | undefined> {
    const [row] = await db.update(lexiThreads)
      .set({ title, updatedAt: new Date() })
      .where(and(eq(lexiThreads.id, threadId), eq(lexiThreads.userId, userId)))
      .returning();
    return row;
  }

  async deleteLexiThread(userId: string, threadId: string): Promise<boolean> {
    await db.delete(lexiMessages).where(and(eq(lexiMessages.threadId, threadId), eq(lexiMessages.userId, userId)));
    const res = await db.delete(lexiThreads).where(and(eq(lexiThreads.id, threadId), eq(lexiThreads.userId, userId))).returning();
    return res.length > 0;
  }

  async getLexiThread(userId: string, threadId: string): Promise<LexiThread | undefined> {
    const [row] = await db.select().from(lexiThreads)
      .where(and(eq(lexiThreads.id, threadId), eq(lexiThreads.userId, userId)));
    return row;
  }

  async markLexiThreadDisclaimerShown(userId: string, threadId: string): Promise<boolean> {
    const res = await db.update(lexiThreads)
      .set({ disclaimerShown: true })
      .where(and(eq(lexiThreads.id, threadId), eq(lexiThreads.userId, userId)))
      .returning();
    return res.length > 0;
  }

  async listLexiMessages(userId: string, threadId: string): Promise<LexiMessage[]> {
    return db.select().from(lexiMessages)
      .where(and(eq(lexiMessages.threadId, threadId), eq(lexiMessages.userId, userId)))
      .orderBy(asc(lexiMessages.createdAt));
  }

  async createLexiMessage(
    userId: string,
    caseId: string,
    threadId: string,
    role: LexiMessageRole,
    content: string,
    safetyFlags?: Record<string, boolean> | null,
    model?: string | null,
    metadata?: Record<string, unknown> | null
  ): Promise<LexiMessage> {
    const [row] = await db.insert(lexiMessages)
      .values({
        userId,
        caseId,
        threadId,
        role,
        content,
        safetyFlags: safetyFlags ?? null,
        metadata: metadata ?? null,
        model: model ?? null,
      })
      .returning();
    
    await db.update(lexiThreads)
      .set({ updatedAt: new Date() })
      .where(eq(lexiThreads.id, threadId));
    
    return row;
  }

  async getCaseRuleTerms(userId: string, caseId: string, moduleKey?: string): Promise<CaseRuleTerm[]> {
    const conditions = [eq(caseRuleTerms.userId, userId), eq(caseRuleTerms.caseId, caseId)];
    if (moduleKey) {
      conditions.push(eq(caseRuleTerms.moduleKey, moduleKey));
    }
    return db.select().from(caseRuleTerms)
      .where(and(...conditions))
      .orderBy(desc(caseRuleTerms.lastCheckedAt));
  }

  async upsertCaseRuleTerm(userId: string, caseId: string, input: UpsertCaseRuleTerm): Promise<CaseRuleTerm> {
    const [existing] = await db.select().from(caseRuleTerms)
      .where(and(
        eq(caseRuleTerms.caseId, caseId),
        eq(caseRuleTerms.moduleKey, input.moduleKey),
        eq(caseRuleTerms.termKey, input.termKey)
      ));

    if (existing) {
      const [updated] = await db.update(caseRuleTerms)
        .set({
          officialLabel: input.officialLabel,
          alsoKnownAs: input.alsoKnownAs ?? null,
          summary: input.summary,
          sourcesJson: input.sourcesJson,
          lastCheckedAt: new Date(),
        })
        .where(eq(caseRuleTerms.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(caseRuleTerms)
      .values({
        userId,
        caseId,
        moduleKey: input.moduleKey,
        jurisdictionState: input.jurisdictionState,
        jurisdictionCounty: input.jurisdictionCounty ?? null,
        termKey: input.termKey,
        officialLabel: input.officialLabel,
        alsoKnownAs: input.alsoKnownAs ?? null,
        summary: input.summary,
        sourcesJson: input.sourcesJson,
      })
      .returning();
    return created;
  }

  async listTrialBinderSections(userId: string, caseId: string): Promise<TrialBinderSection[]> {
    return db.select().from(trialBinderSections)
      .where(and(eq(trialBinderSections.userId, userId), eq(trialBinderSections.caseId, caseId)))
      .orderBy(asc(trialBinderSections.sortOrder));
  }

  async seedDefaultTrialBinderSectionsIfMissing(userId: string, caseId: string): Promise<TrialBinderSection[]> {
    const existing = await this.listTrialBinderSections(userId, caseId);
    if (existing.length > 0) {
      return existing;
    }

    const defaultSections = [
      { key: "evidence", title: "Evidence", sortOrder: 0 },
      { key: "timeline", title: "Timeline", sortOrder: 1 },
      { key: "communications", title: "Message and Call Log", sortOrder: 2 },
      { key: "deadlines", title: "Deadlines", sortOrder: 3 },
      { key: "tasks", title: "Case To-Do", sortOrder: 4 },
      { key: "documents", title: "Document Creator", sortOrder: 5 },
      { key: "disclosures", title: "Disclosures & Discovery", sortOrder: 6 },
      { key: "contacts", title: "Contacts", sortOrder: 7 },
      { key: "children", title: "Children", sortOrder: 8 },
      { key: "child-support", title: "Child Support Estimator", sortOrder: 9 },
      { key: "patterns", title: "Pattern Analysis", sortOrder: 10 },
    ];

    const rows = await db.insert(trialBinderSections)
      .values(defaultSections.map(s => ({ userId, caseId, ...s })))
      .returning();

    return rows;
  }

  async listTrialBinderItems(userId: string, caseId: string): Promise<TrialBinderItem[]> {
    return db.select().from(trialBinderItems)
      .where(and(eq(trialBinderItems.userId, userId), eq(trialBinderItems.caseId, caseId)))
      .orderBy(asc(trialBinderItems.sectionKey), asc(trialBinderItems.pinnedRank));
  }

  async getTrialBinderItem(userId: string, itemId: string): Promise<TrialBinderItem | undefined> {
    const [row] = await db.select().from(trialBinderItems)
      .where(and(eq(trialBinderItems.id, itemId), eq(trialBinderItems.userId, userId)));
    return row;
  }

  async upsertTrialBinderItem(userId: string, caseId: string, input: UpsertTrialBinderItem): Promise<TrialBinderItem> {
    const [existing] = await db.select().from(trialBinderItems)
      .where(and(
        eq(trialBinderItems.userId, userId),
        eq(trialBinderItems.caseId, caseId),
        eq(trialBinderItems.sectionKey, input.sectionKey),
        eq(trialBinderItems.sourceType, input.sourceType),
        eq(trialBinderItems.sourceId, input.sourceId)
      ));

    if (existing) {
      const [updated] = await db.update(trialBinderItems)
        .set({
          pinnedRank: input.pinnedRank ?? null,
          note: input.note ?? existing.note,
          updatedAt: new Date(),
        })
        .where(eq(trialBinderItems.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(trialBinderItems)
      .values({
        userId,
        caseId,
        sectionKey: input.sectionKey,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        pinnedRank: input.pinnedRank ?? null,
        note: input.note ?? null,
      })
      .returning();
    return created;
  }

  async updateTrialBinderItem(userId: string, itemId: string, input: UpdateTrialBinderItem): Promise<TrialBinderItem | undefined> {
    const [updated] = await db.update(trialBinderItems)
      .set({
        pinnedRank: input.pinnedRank !== undefined ? input.pinnedRank : undefined,
        note: input.note !== undefined ? input.note : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(trialBinderItems.id, itemId), eq(trialBinderItems.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTrialBinderItem(userId: string, itemId: string): Promise<boolean> {
    const res = await db.delete(trialBinderItems)
      .where(and(eq(trialBinderItems.id, itemId), eq(trialBinderItems.userId, userId)))
      .returning();
    return res.length > 0;
  }

  async listExhibitPackets(userId: string, caseId: string): Promise<ExhibitPacket[]> {
    return db.select().from(exhibitPackets)
      .where(and(eq(exhibitPackets.userId, userId), eq(exhibitPackets.caseId, caseId)))
      .orderBy(desc(exhibitPackets.createdAt));
  }

  async getExhibitPacket(userId: string, packetId: string): Promise<ExhibitPacket | undefined> {
    const [row] = await db.select().from(exhibitPackets)
      .where(and(eq(exhibitPackets.id, packetId), eq(exhibitPackets.userId, userId)));
    return row;
  }

  async createExhibitPacket(userId: string, caseId: string, data: InsertExhibitPacket): Promise<ExhibitPacket> {
    const [created] = await db.insert(exhibitPackets)
      .values({
        userId,
        caseId,
        title: data.title,
        filingType: data.filingType ?? null,
        filingDate: data.filingDate ?? null,
        coverPageText: data.coverPageText ?? null,
        status: data.status ?? "draft",
      })
      .returning();
    return created;
  }

  async updateExhibitPacket(userId: string, packetId: string, data: UpdateExhibitPacket): Promise<ExhibitPacket | undefined> {
    const existing = await this.getExhibitPacket(userId, packetId);
    if (!existing) return undefined;

    const [updated] = await db.update(exhibitPackets)
      .set({
        title: data.title ?? existing.title,
        filingType: data.filingType !== undefined ? data.filingType : existing.filingType,
        filingDate: data.filingDate !== undefined ? data.filingDate : existing.filingDate,
        coverPageText: data.coverPageText !== undefined ? data.coverPageText : existing.coverPageText,
        status: data.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(exhibitPackets.id, packetId), eq(exhibitPackets.userId, userId)))
      .returning();
    return updated;
  }

  async deleteExhibitPacket(userId: string, packetId: string): Promise<boolean> {
    const items = await this.listPacketItems(userId, packetId);
    for (const item of items) {
      await this.deletePacketItem(userId, item.id);
    }
    const res = await db.delete(exhibitPackets)
      .where(and(eq(exhibitPackets.id, packetId), eq(exhibitPackets.userId, userId)))
      .returning();
    return res.length > 0;
  }

  async listPacketItems(userId: string, packetId: string): Promise<ExhibitPacketItem[]> {
    return db.select().from(exhibitPacketItems)
      .where(and(eq(exhibitPacketItems.packetId, packetId), eq(exhibitPacketItems.userId, userId)))
      .orderBy(asc(exhibitPacketItems.sortOrder));
  }

  async getPacketItem(userId: string, itemId: string): Promise<ExhibitPacketItem | undefined> {
    const [row] = await db.select().from(exhibitPacketItems)
      .where(and(eq(exhibitPacketItems.id, itemId), eq(exhibitPacketItems.userId, userId)));
    return row;
  }

  async createPacketItem(userId: string, packetId: string, caseId: string, data: InsertExhibitPacketItem): Promise<ExhibitPacketItem> {
    const [created] = await db.insert(exhibitPacketItems)
      .values({
        userId,
        caseId,
        packetId,
        exhibitLabel: data.exhibitLabel,
        exhibitTitle: data.exhibitTitle,
        exhibitNotes: data.exhibitNotes ?? null,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();
    return created;
  }

  async updatePacketItem(userId: string, itemId: string, data: UpdateExhibitPacketItem): Promise<ExhibitPacketItem | undefined> {
    const existing = await this.getPacketItem(userId, itemId);
    if (!existing) return undefined;

    const [updated] = await db.update(exhibitPacketItems)
      .set({
        exhibitLabel: data.exhibitLabel ?? existing.exhibitLabel,
        exhibitTitle: data.exhibitTitle ?? existing.exhibitTitle,
        exhibitNotes: data.exhibitNotes !== undefined ? data.exhibitNotes : existing.exhibitNotes,
        sortOrder: data.sortOrder ?? existing.sortOrder,
        updatedAt: new Date(),
      })
      .where(and(eq(exhibitPacketItems.id, itemId), eq(exhibitPacketItems.userId, userId)))
      .returning();
    return updated;
  }

  async deletePacketItem(userId: string, itemId: string): Promise<boolean> {
    await db.delete(exhibitPacketEvidence)
      .where(and(eq(exhibitPacketEvidence.packetItemId, itemId), eq(exhibitPacketEvidence.userId, userId)));
    const res = await db.delete(exhibitPacketItems)
      .where(and(eq(exhibitPacketItems.id, itemId), eq(exhibitPacketItems.userId, userId)))
      .returning();
    return res.length > 0;
  }

  async reorderPacketItems(userId: string, packetId: string, orderedIds: string[]): Promise<boolean> {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.update(exhibitPacketItems)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(and(
          eq(exhibitPacketItems.id, orderedIds[i]),
          eq(exhibitPacketItems.userId, userId),
          eq(exhibitPacketItems.packetId, packetId)
        ));
    }
    return true;
  }

  async listPacketItemEvidence(userId: string, packetItemId: string): Promise<EvidenceFile[]> {
    const links = await db.select().from(exhibitPacketEvidence)
      .where(and(eq(exhibitPacketEvidence.packetItemId, packetItemId), eq(exhibitPacketEvidence.userId, userId)))
      .orderBy(asc(exhibitPacketEvidence.sortOrder));

    if (links.length === 0) return [];

    const evidenceIds = links.map(l => l.evidenceId);
    const files = await db.select().from(evidenceFiles)
      .where(and(inArray(evidenceFiles.id, evidenceIds), eq(evidenceFiles.userId, userId)));

    const fileMap = new Map(files.map(f => [f.id, f]));
    return links.map(l => fileMap.get(l.evidenceId)).filter(Boolean) as EvidenceFile[];
  }

  async addEvidenceToPacketItem(userId: string, caseId: string, packetItemId: string, evidenceId: string): Promise<ExhibitPacketEvidence | null> {
    const [existing] = await db.select().from(exhibitPacketEvidence)
      .where(and(
        eq(exhibitPacketEvidence.packetItemId, packetItemId),
        eq(exhibitPacketEvidence.evidenceId, evidenceId),
        eq(exhibitPacketEvidence.userId, userId)
      ));
    if (existing) return existing;

    const currentLinks = await db.select().from(exhibitPacketEvidence)
      .where(and(eq(exhibitPacketEvidence.packetItemId, packetItemId), eq(exhibitPacketEvidence.userId, userId)));
    const nextOrder = currentLinks.length;

    const [created] = await db.insert(exhibitPacketEvidence)
      .values({
        userId,
        caseId,
        packetItemId,
        evidenceId,
        sortOrder: nextOrder,
      })
      .returning();
    return created;
  }

  async removeEvidenceFromPacketItem(userId: string, packetItemId: string, evidenceId: string): Promise<boolean> {
    const res = await db.delete(exhibitPacketEvidence)
      .where(and(
        eq(exhibitPacketEvidence.packetItemId, packetItemId),
        eq(exhibitPacketEvidence.evidenceId, evidenceId),
        eq(exhibitPacketEvidence.userId, userId)
      ))
      .returning();
    return res.length > 0;
  }

  async reorderPacketItemEvidence(userId: string, packetItemId: string, orderedEvidenceIds: string[]): Promise<boolean> {
    for (let i = 0; i < orderedEvidenceIds.length; i++) {
      await db.update(exhibitPacketEvidence)
        .set({ sortOrder: i })
        .where(and(
          eq(exhibitPacketEvidence.packetItemId, packetItemId),
          eq(exhibitPacketEvidence.evidenceId, orderedEvidenceIds[i]),
          eq(exhibitPacketEvidence.userId, userId)
        ));
    }
    return true;
  }

  async listGeneratedExhibitPackets(userId: string, caseId: string): Promise<GeneratedExhibitPacket[]> {
    return db.select().from(generatedExhibitPackets)
      .where(and(eq(generatedExhibitPackets.userId, userId), eq(generatedExhibitPackets.caseId, caseId)))
      .orderBy(desc(generatedExhibitPackets.generatedAt));
  }

  async getGeneratedExhibitPacket(userId: string, genId: string): Promise<GeneratedExhibitPacket | undefined> {
    const [row] = await db.select().from(generatedExhibitPackets)
      .where(and(eq(generatedExhibitPackets.id, genId), eq(generatedExhibitPackets.userId, userId)));
    return row;
  }

  async createGeneratedExhibitPacket(userId: string, caseId: string, packetId: string, title: string, fileKey: string, fileName: string, metaJson: Record<string, unknown>): Promise<GeneratedExhibitPacket> {
    const [created] = await db.insert(generatedExhibitPackets)
      .values({
        userId,
        caseId,
        packetId,
        title,
        fileKey,
        fileName,
        metaJson,
      })
      .returning();
    return created;
  }

  async listEvidenceNotes(userId: string, caseId: string, evidenceFileId: string): Promise<EvidenceNote[]> {
    return db.select().from(caseEvidenceNotes)
      .where(and(
        eq(caseEvidenceNotes.userId, userId),
        eq(caseEvidenceNotes.caseId, caseId),
        eq(caseEvidenceNotes.evidenceFileId, evidenceFileId)
      ))
      .orderBy(desc(caseEvidenceNotes.createdAt));
  }

  async getEvidenceNote(userId: string, noteId: string): Promise<EvidenceNote | undefined> {
    const [row] = await db.select().from(caseEvidenceNotes)
      .where(and(eq(caseEvidenceNotes.id, noteId), eq(caseEvidenceNotes.userId, userId)));
    return row;
  }

  async createEvidenceNote(userId: string, caseId: string, evidenceFileId: string, data: InsertEvidenceNote): Promise<EvidenceNote> {
    const [created] = await db.insert(caseEvidenceNotes)
      .values({
        userId,
        caseId,
        evidenceFileId,
        pageNumber: data.pageNumber ?? null,
        timestampSeconds: data.timestampSeconds ?? null,
        label: data.label ?? null,
        note: data.note,
        isKey: data.isKey ?? false,
      })
      .returning();
    return created;
  }

  async updateEvidenceNote(userId: string, noteId: string, data: UpdateEvidenceNote): Promise<EvidenceNote | undefined> {
    const existing = await this.getEvidenceNote(userId, noteId);
    if (!existing) return undefined;

    const [updated] = await db.update(caseEvidenceNotes)
      .set({
        pageNumber: data.pageNumber !== undefined ? data.pageNumber : existing.pageNumber,
        timestampSeconds: data.timestampSeconds !== undefined ? data.timestampSeconds : existing.timestampSeconds,
        label: data.label !== undefined ? data.label : existing.label,
        note: data.note ?? existing.note,
        isKey: data.isKey !== undefined ? data.isKey : existing.isKey,
      })
      .where(and(eq(caseEvidenceNotes.id, noteId), eq(caseEvidenceNotes.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEvidenceNote(userId: string, noteId: string): Promise<boolean> {
    const res = await db.delete(caseEvidenceNotes)
      .where(and(eq(caseEvidenceNotes.id, noteId), eq(caseEvidenceNotes.userId, userId)))
      .returning();
    return res.length > 0;
  }

  async listAllCaseEvidenceNotes(userId: string, caseId: string): Promise<EvidenceNote[]> {
    return db.select().from(caseEvidenceNotes)
      .where(and(
        eq(caseEvidenceNotes.userId, userId),
        eq(caseEvidenceNotes.caseId, caseId)
      ))
      .orderBy(desc(caseEvidenceNotes.createdAt));
  }

  async linkEvidenceNoteToExhibitList(userId: string, caseId: string, evidenceNoteId: string, exhibitListId: string, data?: InsertExhibitNoteLink): Promise<ExhibitNoteLink> {
    const existing = await db.select().from(caseExhibitNoteLinks)
      .where(and(
        eq(caseExhibitNoteLinks.userId, userId),
        eq(caseExhibitNoteLinks.exhibitListId, exhibitListId),
        eq(caseExhibitNoteLinks.evidenceNoteId, evidenceNoteId)
      ));
    if (existing.length > 0) {
      return existing[0];
    }
    const maxSort = await db.select().from(caseExhibitNoteLinks)
      .where(and(eq(caseExhibitNoteLinks.userId, userId), eq(caseExhibitNoteLinks.exhibitListId, exhibitListId)))
      .orderBy(desc(caseExhibitNoteLinks.sortOrder));
    const nextSort = (maxSort[0]?.sortOrder ?? -1) + 1;

    const [created] = await db.insert(caseExhibitNoteLinks)
      .values({
        userId,
        caseId,
        exhibitListId,
        evidenceNoteId,
        sortOrder: nextSort,
        label: data?.label ?? null,
      })
      .returning();
    return created;
  }

  async unlinkEvidenceNoteFromExhibitList(userId: string, exhibitListId: string, evidenceNoteId: string): Promise<boolean> {
    const res = await db.delete(caseExhibitNoteLinks)
      .where(and(
        eq(caseExhibitNoteLinks.userId, userId),
        eq(caseExhibitNoteLinks.exhibitListId, exhibitListId),
        eq(caseExhibitNoteLinks.evidenceNoteId, evidenceNoteId)
      ))
      .returning();
    return res.length > 0;
  }

  async listExhibitNoteLinks(userId: string, exhibitListId: string): Promise<ExhibitNoteLink[]> {
    return db.select().from(caseExhibitNoteLinks)
      .where(and(
        eq(caseExhibitNoteLinks.userId, userId),
        eq(caseExhibitNoteLinks.exhibitListId, exhibitListId)
      ))
      .orderBy(asc(caseExhibitNoteLinks.sortOrder));
  }

  async reorderExhibitNoteLinks(userId: string, exhibitListId: string, ordered: { id: string; sortOrder: number }[]): Promise<boolean> {
    for (const item of ordered) {
      await db.update(caseExhibitNoteLinks)
        .set({ sortOrder: item.sortOrder })
        .where(and(
          eq(caseExhibitNoteLinks.id, item.id),
          eq(caseExhibitNoteLinks.userId, userId),
          eq(caseExhibitNoteLinks.exhibitListId, exhibitListId)
        ));
    }
    return true;
  }

  async addEvidenceToExhibitList(userId: string, caseId: string, exhibitListId: string, evidenceFileId: string, data?: { label?: string; notes?: string }): Promise<ExhibitEvidence> {
    const existing = await db.select().from(exhibitEvidence)
      .where(and(
        eq(exhibitEvidence.userId, userId),
        eq(exhibitEvidence.exhibitListId, exhibitListId),
        eq(exhibitEvidence.evidenceFileId, evidenceFileId)
      ));
    if (existing.length > 0) {
      return existing[0];
    }
    const maxSort = await db.select().from(exhibitEvidence)
      .where(and(eq(exhibitEvidence.userId, userId), eq(exhibitEvidence.exhibitListId, exhibitListId)))
      .orderBy(desc(exhibitEvidence.sortOrder));
    const nextSort = (maxSort[0]?.sortOrder ?? -1) + 1;

    const [created] = await db.insert(exhibitEvidence)
      .values({
        userId,
        caseId,
        exhibitListId,
        evidenceFileId,
        sortOrder: nextSort,
        label: data?.label ?? null,
        notes: data?.notes ?? null,
      })
      .returning();
    return created;
  }

  async removeEvidenceFromExhibitList(userId: string, exhibitListId: string, evidenceFileId: string): Promise<boolean> {
    const res = await db.delete(exhibitEvidence)
      .where(and(
        eq(exhibitEvidence.userId, userId),
        eq(exhibitEvidence.exhibitListId, exhibitListId),
        eq(exhibitEvidence.evidenceFileId, evidenceFileId)
      ))
      .returning();
    return res.length > 0;
  }

  async listExhibitListEvidence(userId: string, exhibitListId: string): Promise<ExhibitEvidence[]> {
    return db.select().from(exhibitEvidence)
      .where(and(
        eq(exhibitEvidence.userId, userId),
        eq(exhibitEvidence.exhibitListId, exhibitListId)
      ))
      .orderBy(asc(exhibitEvidence.sortOrder));
  }

  async reorderExhibitListEvidence(userId: string, exhibitListId: string, ordered: { id: string; sortOrder: number }[]): Promise<boolean> {
    for (const item of ordered) {
      await db.update(exhibitEvidence)
        .set({ sortOrder: item.sortOrder })
        .where(and(
          eq(exhibitEvidence.id, item.id),
          eq(exhibitEvidence.userId, userId),
          eq(exhibitEvidence.exhibitListId, exhibitListId)
        ));
    }
    return true;
  }

  async listTimelineCategories(userId: string, caseId: string): Promise<TimelineCategory[]> {
    return db.select().from(timelineCategories)
      .where(and(
        eq(timelineCategories.userId, userId),
        eq(timelineCategories.caseId, caseId)
      ))
      .orderBy(desc(timelineCategories.isSystem), asc(timelineCategories.name));
  }

  async getTimelineCategory(userId: string, caseId: string, categoryId: string): Promise<TimelineCategory | undefined> {
    const [row] = await db.select().from(timelineCategories)
      .where(and(
        eq(timelineCategories.id, categoryId),
        eq(timelineCategories.userId, userId),
        eq(timelineCategories.caseId, caseId)
      ));
    return row;
  }

  async getEventCountByCategory(userId: string, caseId: string, categoryId: string): Promise<number> {
    const events = await db.select().from(timelineEvents)
      .where(and(
        eq(timelineEvents.userId, userId),
        eq(timelineEvents.caseId, caseId),
        eq(timelineEvents.categoryId, categoryId)
      ));
    return events.length;
  }

  async createTimelineCategory(userId: string, caseId: string, data: InsertTimelineCategory): Promise<TimelineCategory> {
    const [created] = await db.insert(timelineCategories)
      .values({
        userId,
        caseId,
        name: data.name,
        color: data.color,
        isSystem: false,
      })
      .returning();
    return created;
  }

  async updateTimelineCategory(userId: string, caseId: string, categoryId: string, data: UpdateTimelineCategory): Promise<TimelineCategory | undefined> {
    const existing = await this.getTimelineCategory(userId, caseId, categoryId);
    if (!existing) return undefined;

    const [updated] = await db.update(timelineCategories)
      .set({
        name: data.name ?? existing.name,
        color: data.color ?? existing.color,
        updatedAt: new Date(),
      })
      .where(and(
        eq(timelineCategories.id, categoryId),
        eq(timelineCategories.userId, userId),
        eq(timelineCategories.caseId, caseId)
      ))
      .returning();
    return updated;
  }

  async deleteTimelineCategory(userId: string, caseId: string, categoryId: string): Promise<{ success: boolean; error?: string }> {
    const existing = await this.getTimelineCategory(userId, caseId, categoryId);
    if (!existing) return { success: false, error: "Category not found" };
    if (existing.isSystem) return { success: false, error: "Cannot delete system categories" };

    const eventsUsingCategory = await db.select().from(timelineEvents)
      .where(and(
        eq(timelineEvents.userId, userId),
        eq(timelineEvents.caseId, caseId),
        eq(timelineEvents.categoryId, categoryId)
      ));
    if (eventsUsingCategory.length > 0) {
      return { success: false, error: "Category is in use by timeline events" };
    }

    await db.delete(timelineCategories)
      .where(and(
        eq(timelineCategories.id, categoryId),
        eq(timelineCategories.userId, userId),
        eq(timelineCategories.caseId, caseId)
      ));
    return { success: true };
  }

  async seedSystemTimelineCategories(userId: string, caseId: string): Promise<TimelineCategory[]> {
    const existing = await this.listTimelineCategories(userId, caseId);
    if (existing.length > 0) {
      return existing;
    }

    const systemCategories = [
      { name: "Court / Hearings", color: "#1565C0" },
      { name: "Filings", color: "#2E7D32" },
      { name: "Service / Notice", color: "#F9A825" },
      { name: "Communication", color: "#6A1B9A" },
      { name: "Discovery / Disclosures", color: "#00838F" },
      { name: "Parenting Time", color: "#D84315" },
      { name: "School", color: "#5D4037" },
      { name: "Medical", color: "#C62828" },
      { name: "Financial", color: "#558B2F" },
      { name: "Incidents", color: "#AD1457" },
      { name: "Other", color: "#546E7A" },
    ];

    const created: TimelineCategory[] = [];
    for (const cat of systemCategories) {
      const [row] = await db.insert(timelineCategories)
        .values({
          userId,
          caseId,
          name: cat.name,
          color: cat.color,
          isSystem: true,
        })
        .returning();
      created.push(row);
    }
    return created;
  }

  async getParentingPlanByCase(userId: string, caseId: string): Promise<ParentingPlan | undefined> {
    const [row] = await db.select().from(parentingPlans)
      .where(and(eq(parentingPlans.userId, userId), eq(parentingPlans.caseId, caseId)));
    return row;
  }

  async createParentingPlan(userId: string, caseId: string, data?: InsertParentingPlan): Promise<ParentingPlan> {
    const [created] = await db.insert(parentingPlans)
      .values({
        userId,
        caseId,
        status: data?.status || "draft",
      })
      .returning();
    return created;
  }

  async updateParentingPlan(userId: string, planId: string, data: UpdateParentingPlan): Promise<ParentingPlan | undefined> {
    const [updated] = await db.update(parentingPlans)
      .set({
        status: data.status,
        lastUpdatedAt: new Date(),
      })
      .where(and(eq(parentingPlans.id, planId), eq(parentingPlans.userId, userId)))
      .returning();
    return updated;
  }

  async getOrCreateParentingPlan(userId: string, caseId: string): Promise<ParentingPlan> {
    const existing = await this.getParentingPlanByCase(userId, caseId);
    if (existing) return existing;
    return this.createParentingPlan(userId, caseId);
  }

  async deleteParentingPlan(userId: string, planId: string): Promise<boolean> {
    await db.delete(parentingPlanSections)
      .where(and(eq(parentingPlanSections.parentingPlanId, planId), eq(parentingPlanSections.userId, userId)));
    const result = await db.delete(parentingPlans)
      .where(and(eq(parentingPlans.id, planId), eq(parentingPlans.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getParentingPlan(userId: string, planId: string): Promise<ParentingPlan | undefined> {
    const [row] = await db.select().from(parentingPlans)
      .where(and(eq(parentingPlans.id, planId), eq(parentingPlans.userId, userId)));
    return row;
  }

  async listParentingPlanSections(userId: string, planId: string): Promise<ParentingPlanSection[]> {
    return db.select().from(parentingPlanSections)
      .where(and(eq(parentingPlanSections.parentingPlanId, planId), eq(parentingPlanSections.userId, userId)))
      .orderBy(asc(parentingPlanSections.sectionKey));
  }

  async getParentingPlanSection(userId: string, planId: string, sectionKey: string): Promise<ParentingPlanSection | undefined> {
    const [row] = await db.select().from(parentingPlanSections)
      .where(and(
        eq(parentingPlanSections.parentingPlanId, planId),
        eq(parentingPlanSections.userId, userId),
        eq(parentingPlanSections.sectionKey, sectionKey)
      ));
    return row;
  }

  async upsertParentingPlanSection(userId: string, planId: string, sectionKey: string, data: Record<string, unknown>): Promise<ParentingPlanSection> {
    const existing = await this.getParentingPlanSection(userId, planId, sectionKey);
    if (existing) {
      const [updated] = await db.update(parentingPlanSections)
        .set({ data, updatedAt: new Date() })
        .where(eq(parentingPlanSections.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(parentingPlanSections)
      .values({
        parentingPlanId: planId,
        userId,
        sectionKey,
        data,
      })
      .returning();
    return created;
  }

  async createEvidenceProcessingJob(userId: string, caseId: string, evidenceId: string): Promise<EvidenceProcessingJob> {
    const [created] = await db.insert(evidenceProcessingJobs)
      .values({ userId, caseId, evidenceId, status: "queued", progress: 0 })
      .returning();
    return created;
  }

  async updateEvidenceProcessingJob(userId: string, jobId: string, patch: UpdateEvidenceProcessingJob): Promise<EvidenceProcessingJob | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.progress !== undefined) updateData.progress = patch.progress;
    if (patch.error !== undefined) updateData.error = patch.error;
    const [updated] = await db.update(evidenceProcessingJobs)
      .set(updateData)
      .where(and(eq(evidenceProcessingJobs.id, jobId), eq(evidenceProcessingJobs.userId, userId)))
      .returning();
    return updated;
  }

  async getEvidenceProcessingJob(userId: string, jobId: string): Promise<EvidenceProcessingJob | undefined> {
    const [row] = await db.select().from(evidenceProcessingJobs)
      .where(and(eq(evidenceProcessingJobs.id, jobId), eq(evidenceProcessingJobs.userId, userId)));
    return row;
  }

  async getEvidenceProcessingJobsForCase(userId: string, caseId: string): Promise<EvidenceProcessingJob[]> {
    return db.select().from(evidenceProcessingJobs)
      .where(and(eq(evidenceProcessingJobs.userId, userId), eq(evidenceProcessingJobs.caseId, caseId)))
      .orderBy(desc(evidenceProcessingJobs.createdAt));
  }

  async getEvidenceProcessingJobByEvidence(userId: string, evidenceId: string): Promise<EvidenceProcessingJob | undefined> {
    const [row] = await db.select().from(evidenceProcessingJobs)
      .where(and(eq(evidenceProcessingJobs.userId, userId), eq(evidenceProcessingJobs.evidenceId, evidenceId)))
      .orderBy(desc(evidenceProcessingJobs.createdAt));
    return row;
  }

  async upsertEvidenceOcrPage(userId: string, caseId: string, evidenceId: string, pageNumber: number | null, payload: UpsertEvidenceOcrPage): Promise<EvidenceOcrPage> {
    const existing = await db.select().from(evidenceOcrPages)
      .where(and(
        eq(evidenceOcrPages.userId, userId),
        eq(evidenceOcrPages.evidenceId, evidenceId),
        pageNumber !== null ? eq(evidenceOcrPages.pageNumber, pageNumber) : eq(evidenceOcrPages.pageNumber, null as unknown as number)
      ))
      .limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(evidenceOcrPages)
        .set({
          providerPrimary: payload.providerPrimary,
          providerSecondary: payload.providerSecondary,
          textPrimary: payload.textPrimary,
          textSecondary: payload.textSecondary,
          confidencePrimary: payload.confidencePrimary,
          confidenceSecondary: payload.confidenceSecondary,
          diffScore: payload.diffScore,
          needsReview: payload.needsReview ?? true,
          updatedAt: new Date(),
        })
        .where(eq(evidenceOcrPages.id, existing[0].id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(evidenceOcrPages)
      .values({
        userId,
        caseId,
        evidenceId,
        pageNumber,
        providerPrimary: payload.providerPrimary,
        providerSecondary: payload.providerSecondary,
        textPrimary: payload.textPrimary,
        textSecondary: payload.textSecondary,
        confidencePrimary: payload.confidencePrimary,
        confidenceSecondary: payload.confidenceSecondary,
        diffScore: payload.diffScore,
        needsReview: payload.needsReview ?? true,
      })
      .returning();
    return created;
  }

  async listEvidenceOcrPages(userId: string, caseId: string, evidenceId: string): Promise<EvidenceOcrPage[]> {
    return db.select().from(evidenceOcrPages)
      .where(and(eq(evidenceOcrPages.userId, userId), eq(evidenceOcrPages.caseId, caseId), eq(evidenceOcrPages.evidenceId, evidenceId)))
      .orderBy(asc(evidenceOcrPages.pageNumber));
  }

  async markOcrPageReviewed(userId: string, ocrPageId: string, needsReview: boolean = false): Promise<EvidenceOcrPage | undefined> {
    const [updated] = await db.update(evidenceOcrPages)
      .set({ needsReview, updatedAt: new Date() })
      .where(and(eq(evidenceOcrPages.id, ocrPageId), eq(evidenceOcrPages.userId, userId)))
      .returning();
    return updated;
  }

  async createEvidenceAnchor(userId: string, caseId: string, payload: InsertEvidenceAnchor): Promise<EvidenceAnchor> {
    const [created] = await db.insert(evidenceAnchors)
      .values({
        userId,
        caseId,
        evidenceId: payload.evidenceId,
        pageNumber: payload.pageNumber,
        startChar: payload.startChar,
        endChar: payload.endChar,
        excerpt: payload.excerpt,
        note: payload.note,
        tags: payload.tags,
      })
      .returning();
    return created;
  }

  async updateEvidenceAnchor(userId: string, anchorId: string, payload: UpdateEvidenceAnchor): Promise<EvidenceAnchor | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.pageNumber !== undefined) updateData.pageNumber = payload.pageNumber;
    if (payload.startChar !== undefined) updateData.startChar = payload.startChar;
    if (payload.endChar !== undefined) updateData.endChar = payload.endChar;
    if (payload.excerpt !== undefined) updateData.excerpt = payload.excerpt;
    if (payload.note !== undefined) updateData.note = payload.note;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    const [updated] = await db.update(evidenceAnchors)
      .set(updateData)
      .where(and(eq(evidenceAnchors.id, anchorId), eq(evidenceAnchors.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEvidenceAnchor(userId: string, anchorId: string): Promise<boolean> {
    const result = await db.delete(evidenceAnchors)
      .where(and(eq(evidenceAnchors.id, anchorId), eq(evidenceAnchors.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async listEvidenceAnchors(userId: string, caseId: string, evidenceId?: string): Promise<EvidenceAnchor[]> {
    const conditions = [eq(evidenceAnchors.userId, userId), eq(evidenceAnchors.caseId, caseId)];
    if (evidenceId) conditions.push(eq(evidenceAnchors.evidenceId, evidenceId));
    return db.select().from(evidenceAnchors)
      .where(and(...conditions))
      .orderBy(desc(evidenceAnchors.createdAt));
  }

  async getEvidenceAnchor(userId: string, anchorId: string): Promise<EvidenceAnchor | undefined> {
    const [row] = await db.select().from(evidenceAnchors)
      .where(and(eq(evidenceAnchors.id, anchorId), eq(evidenceAnchors.userId, userId)));
    return row;
  }

  async getEvidenceExtraction(userId: string, caseId: string, evidenceId: string): Promise<EvidenceExtraction | undefined> {
    const [row] = await db.select().from(evidenceExtractions)
      .where(and(
        eq(evidenceExtractions.userId, userId),
        eq(evidenceExtractions.caseId, caseId),
        eq(evidenceExtractions.evidenceId, evidenceId)
      ));
    return row;
  }

  async createEvidenceExtraction(userId: string, caseId: string, payload: InsertEvidenceExtraction): Promise<EvidenceExtraction> {
    const [created] = await db.insert(evidenceExtractions)
      .values({
        userId,
        caseId,
        evidenceId: payload.evidenceId,
        provider: payload.provider || "internal",
        mimeType: payload.mimeType,
        status: "queued",
      })
      .returning();
    return created;
  }

  async updateEvidenceExtraction(userId: string, extractionId: string, payload: UpdateEvidenceExtraction): Promise<EvidenceExtraction | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.status !== undefined) updateData.status = payload.status;
    if (payload.pageCount !== undefined) updateData.pageCount = payload.pageCount;
    if (payload.extractedText !== undefined) updateData.extractedText = payload.extractedText;
    if (payload.metadata !== undefined) updateData.metadata = payload.metadata;
    if (payload.error !== undefined) updateData.error = payload.error;
    const [updated] = await db.update(evidenceExtractions)
      .set(updateData)
      .where(and(eq(evidenceExtractions.id, extractionId), eq(evidenceExtractions.userId, userId)))
      .returning();
    return updated;
  }

  async findStaleProcessingExtractions(staleMinutes: number = 15): Promise<EvidenceExtraction[]> {
    const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000);
    return db.select().from(evidenceExtractions)
      .where(and(
        eq(evidenceExtractions.status, "processing"),
        lt(evidenceExtractions.updatedAt, cutoff)
      ));
  }

  async resetExtractionToQueued(extractionId: string): Promise<EvidenceExtraction | undefined> {
    const [updated] = await db.update(evidenceExtractions)
      .set({
        status: "queued",
        error: null,
        metadata: sql`COALESCE(${evidenceExtractions.metadata}, '{}'::jsonb) || '{"requeued": true}'::jsonb`,
        updatedAt: new Date(),
      })
      .where(eq(evidenceExtractions.id, extractionId))
      .returning();
    return updated;
  }

  async getExtractionById(extractionId: string): Promise<EvidenceExtraction | undefined> {
    const [row] = await db.select().from(evidenceExtractions)
      .where(eq(evidenceExtractions.id, extractionId));
    return row;
  }

  async listEvidenceNotesFull(userId: string, caseId: string, evidenceId?: string): Promise<EvidenceNoteFull[]> {
    const conditions = [eq(evidenceNotes.userId, userId), eq(evidenceNotes.caseId, caseId)];
    if (evidenceId) conditions.push(eq(evidenceNotes.evidenceId, evidenceId));
    return db.select().from(evidenceNotes)
      .where(and(...conditions))
      .orderBy(desc(evidenceNotes.createdAt));
  }

  async createEvidenceNoteFull(userId: string, caseId: string, payload: InsertEvidenceNoteFull): Promise<EvidenceNoteFull> {
    const [created] = await db.insert(evidenceNotes)
      .values({
        userId,
        caseId,
        evidenceId: payload.evidenceId,
        noteTitle: payload.noteTitle,
        noteText: payload.noteText,
        anchorType: payload.anchorType || "page",
        pageNumber: payload.pageNumber,
        timestamp: payload.timestamp,
        selectionText: payload.selectionText,
        tags: payload.tags,
        color: payload.color,
      })
      .returning();
    return created;
  }

  async updateEvidenceNoteFull(userId: string, noteId: string, payload: UpdateEvidenceNoteFull): Promise<EvidenceNoteFull | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.noteTitle !== undefined) updateData.noteTitle = payload.noteTitle;
    if (payload.noteText !== undefined) updateData.noteText = payload.noteText;
    if (payload.anchorType !== undefined) updateData.anchorType = payload.anchorType;
    if (payload.pageNumber !== undefined) updateData.pageNumber = payload.pageNumber;
    if (payload.timestamp !== undefined) updateData.timestamp = payload.timestamp;
    if (payload.selectionText !== undefined) updateData.selectionText = payload.selectionText;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.color !== undefined) updateData.color = payload.color;
    const [updated] = await db.update(evidenceNotes)
      .set(updateData)
      .where(and(eq(evidenceNotes.id, noteId), eq(evidenceNotes.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEvidenceNoteFull(userId: string, noteId: string): Promise<boolean> {
    const result = await db.delete(evidenceNotes)
      .where(and(eq(evidenceNotes.id, noteId), eq(evidenceNotes.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async listEvidenceAiAnalyses(userId: string, caseId: string, evidenceId?: string): Promise<EvidenceAiAnalysis[]> {
    const conditions = [eq(evidenceAiAnalyses.userId, userId), eq(evidenceAiAnalyses.caseId, caseId)];
    if (evidenceId) conditions.push(eq(evidenceAiAnalyses.evidenceId, evidenceId));
    return db.select().from(evidenceAiAnalyses)
      .where(and(...conditions))
      .orderBy(desc(evidenceAiAnalyses.createdAt));
  }

  async createEvidenceAiAnalysis(userId: string, caseId: string, payload: InsertEvidenceAiAnalysis): Promise<EvidenceAiAnalysis> {
    const [created] = await db.insert(evidenceAiAnalyses)
      .values({
        userId,
        caseId,
        evidenceId: payload.evidenceId,
        analysisType: payload.analysisType,
        content: payload.content,
        metadata: payload.metadata,
        status: payload.status || "complete",
        model: payload.model,
        summary: payload.summary,
        findings: payload.findings,
        error: payload.error,
      })
      .returning();
    return created;
  }

  async updateEvidenceAiAnalysis(userId: string, analysisId: string, payload: UpdateEvidenceAiAnalysis): Promise<EvidenceAiAnalysis | undefined> {
    const [updated] = await db.update(evidenceAiAnalyses)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(and(eq(evidenceAiAnalyses.id, analysisId), eq(evidenceAiAnalyses.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEvidenceAiAnalysis(userId: string, analysisId: string): Promise<boolean> {
    const result = await db.delete(evidenceAiAnalyses)
      .where(and(eq(evidenceAiAnalyses.id, analysisId), eq(evidenceAiAnalyses.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async listExhibitSnippets(userId: string, caseId: string, exhibitListId?: string): Promise<ExhibitSnippet[]> {
    if (exhibitListId) {
      return db.select().from(exhibitSnippets)
        .where(and(
          eq(exhibitSnippets.userId, userId),
          eq(exhibitSnippets.caseId, caseId),
          eq(exhibitSnippets.exhibitListId, exhibitListId)
        ))
        .orderBy(asc(exhibitSnippets.sortOrder), asc(exhibitSnippets.createdAt));
    }
    return db.select().from(exhibitSnippets)
      .where(and(eq(exhibitSnippets.userId, userId), eq(exhibitSnippets.caseId, caseId)))
      .orderBy(asc(exhibitSnippets.sortOrder), asc(exhibitSnippets.createdAt));
  }

  async createExhibitSnippet(userId: string, caseId: string, payload: InsertExhibitSnippet): Promise<ExhibitSnippet> {
    const [created] = await db.insert(exhibitSnippets)
      .values({
        userId,
        caseId,
        exhibitListId: payload.exhibitListId,
        evidenceId: payload.evidenceId,
        noteId: payload.noteId,
        title: payload.title,
        snippetText: payload.snippetText,
        pageNumber: payload.pageNumber,
        timestampHint: payload.timestampHint,
        sortOrder: payload.sortOrder ?? 0,
      })
      .returning();
    return created;
  }

  async updateExhibitSnippet(userId: string, snippetId: string, payload: UpdateExhibitSnippet): Promise<ExhibitSnippet | undefined> {
    const [updated] = await db.update(exhibitSnippets)
      .set(payload)
      .where(and(eq(exhibitSnippets.id, snippetId), eq(exhibitSnippets.userId, userId)))
      .returning();
    return updated;
  }

  async deleteExhibitSnippet(userId: string, snippetId: string): Promise<boolean> {
    const result = await db.delete(exhibitSnippets)
      .where(and(eq(exhibitSnippets.id, snippetId), eq(exhibitSnippets.userId, userId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async listTrialPrepShortlist(userId: string, caseId: string): Promise<TrialPrepShortlist[]> {
    return db.select().from(trialPrepShortlist)
      .where(and(eq(trialPrepShortlist.userId, userId), eq(trialPrepShortlist.caseId, caseId)))
      .orderBy(asc(trialPrepShortlist.importance), desc(trialPrepShortlist.createdAt));
  }

  async getTrialPrepShortlistItem(userId: string, itemId: string): Promise<TrialPrepShortlist | undefined> {
    const [item] = await db.select().from(trialPrepShortlist)
      .where(and(eq(trialPrepShortlist.id, itemId), eq(trialPrepShortlist.userId, userId)));
    return item;
  }

  async createTrialPrepShortlistItem(userId: string, caseId: string, payload: InsertTrialPrepShortlist): Promise<TrialPrepShortlist> {
    const [created] = await db.insert(trialPrepShortlist)
      .values({
        userId,
        caseId,
        sourceType: payload.sourceType,
        sourceId: payload.sourceId,
        title: payload.title,
        summary: payload.summary,
        binderSection: payload.binderSection ?? "General",
        importance: payload.importance ?? 3,
        tags: payload.tags ?? [],
        color: payload.color,
        isPinned: payload.isPinned ?? false,
      })
      .returning();
    return created;
  }

  async updateTrialPrepShortlistItem(userId: string, itemId: string, payload: UpdateTrialPrepShortlist): Promise<TrialPrepShortlist | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (payload.title !== undefined) updateData.title = payload.title;
    if (payload.summary !== undefined) updateData.summary = payload.summary;
    if (payload.binderSection !== undefined) updateData.binderSection = payload.binderSection;
    if (payload.importance !== undefined) updateData.importance = payload.importance;
    if (payload.tags !== undefined) updateData.tags = payload.tags;
    if (payload.color !== undefined) updateData.color = payload.color;
    if (payload.isPinned !== undefined) updateData.isPinned = payload.isPinned;
    const [updated] = await db.update(trialPrepShortlist)
      .set(updateData)
      .where(and(eq(trialPrepShortlist.id, itemId), eq(trialPrepShortlist.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTrialPrepShortlistItem(userId: string, itemId: string): Promise<boolean> {
    const result = await db.delete(trialPrepShortlist)
      .where(and(eq(trialPrepShortlist.id, itemId), eq(trialPrepShortlist.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async searchCase(userId: string, caseId: string, q: string, limit: number): Promise<Array<{
    type: string;
    id: string;
    title: string;
    snippet: string | null;
    href: string;
    updatedAt: string | null;
    rank: number;
  }>> {
    const query = q.trim();
    if (!query) return [];

    const headlineOpts = `'MaxFragments=2, MinWords=6, MaxWords=18, StartSel=[[H]], StopSel=[[/H]]'`;

    const result = await db.execute(sql`
      WITH q AS (
        SELECT plainto_tsquery('english', ${query}) AS tsq
      )
      SELECT * FROM (
        /* Evidence files: filename */
        SELECT
          'evidence'::text AS type,
          ef.id::text AS id,
          ef.original_name::text AS title,
          ts_headline('english', COALESCE(ef.original_name,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/evidence/' || ef.case_id)::text AS href,
          ef.created_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(ef.original_name,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM evidence_files ef
        WHERE ef.user_id = ${userId} AND ef.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(ef.original_name,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Evidence extracted text */
        SELECT
          'evidence_text'::text AS type,
          ex.evidence_id::text AS id,
          ef.original_name::text AS title,
          ts_headline('english', COALESCE(ex.extracted_text,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/evidence/' || ef.case_id)::text AS href,
          ex.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(ex.extracted_text,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM evidence_extractions ex
        JOIN evidence_files ef ON ef.id = ex.evidence_id
        WHERE ef.user_id = ${userId} AND ef.case_id = ${caseId}
          AND ex.status = 'complete'
          AND to_tsvector('english', COALESCE(ex.extracted_text,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Evidence notes */
        SELECT
          'evidence_note'::text AS type,
          en.id::text AS id,
          COALESCE(en.note_title, ef.original_name)::text AS title,
          ts_headline('english', COALESCE(en.note_text,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/evidence/' || ef.case_id)::text AS href,
          en.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(en.note_title,'') || ' ' || COALESCE(en.note_text,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM evidence_notes en
        JOIN evidence_files ef ON ef.id = en.evidence_id
        WHERE en.user_id = ${userId} AND en.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(en.note_title,'') || ' ' || COALESCE(en.note_text,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Timeline events */
        SELECT
          'timeline'::text AS type,
          te.id::text AS id,
          te.title::text AS title,
          ts_headline('english', COALESCE(te.notes,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/timeline/' || te.case_id)::text AS href,
          te.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(te.title,'') || ' ' || COALESCE(te.notes,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM timeline_events te
        WHERE te.user_id = ${userId} AND te.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(te.title,'') || ' ' || COALESCE(te.notes,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Deadlines */
        SELECT
          'deadline'::text AS type,
          d.id::text AS id,
          d.title::text AS title,
          ts_headline('english', COALESCE(d.notes,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/deadlines/' || d.case_id)::text AS href,
          d.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(d.title,'') || ' ' || COALESCE(d.notes,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM deadlines d
        WHERE d.user_id = ${userId} AND d.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(d.title,'') || ' ' || COALESCE(d.notes,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Tasks */
        SELECT
          'task'::text AS type,
          t.id::text AS id,
          t.title::text AS title,
          ts_headline('english', COALESCE(t.description,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/tasks/' || t.case_id)::text AS href,
          t.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(t.title,'') || ' ' || COALESCE(t.description,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM tasks t
        WHERE t.user_id = ${userId} AND t.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(t.title,'') || ' ' || COALESCE(t.description,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Contacts */
        SELECT
          'contact'::text AS type,
          cc.id::text AS id,
          cc.name::text AS title,
          ts_headline('english',
            COALESCE(cc.role,'') || ' ' || COALESCE(cc.organization_or_firm,'') || ' ' || COALESCE(cc.email,'') || ' ' || COALESCE(cc.phone,''),
            (SELECT tsq FROM q),
            ${sql.raw(headlineOpts)}
          ) AS snippet,
          ('/app/contacts/' || cc.case_id)::text AS href,
          cc.created_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english',
            COALESCE(cc.name,'') || ' ' || COALESCE(cc.role,'') || ' ' || COALESCE(cc.organization_or_firm,'') || ' ' || COALESCE(cc.email,'') || ' ' || COALESCE(cc.phone,'')
          ), (SELECT tsq FROM q))::float8 AS rank
        FROM case_contacts cc
        WHERE cc.user_id = ${userId} AND cc.case_id = ${caseId}
          AND to_tsvector('english',
            COALESCE(cc.name,'') || ' ' || COALESCE(cc.role,'') || ' ' || COALESCE(cc.organization_or_firm,'') || ' ' || COALESCE(cc.email,'') || ' ' || COALESCE(cc.phone,'')
          ) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Communications */
        SELECT
          'communication'::text AS type,
          cm.id::text AS id,
          COALESCE(cm.subject, 'Communication')::text AS title,
          ts_headline('english', COALESCE(cm.summary,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/communications/' || cm.case_id)::text AS href,
          cm.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(cm.subject,'') || ' ' || COALESCE(cm.summary,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM case_communications cm
        WHERE cm.user_id = ${userId} AND cm.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(cm.subject,'') || ' ' || COALESCE(cm.summary,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Trial prep shortlist */
        SELECT
          'trial_prep'::text AS type,
          tp.id::text AS id,
          tp.title::text AS title,
          ts_headline('english', COALESCE(tp.summary,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/trial-prep/' || tp.case_id)::text AS href,
          tp.updated_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(tp.title,'') || ' ' || COALESCE(tp.summary,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM trial_prep_shortlist tp
        WHERE tp.user_id = ${userId} AND tp.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(tp.title,'') || ' ' || COALESCE(tp.summary,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Exhibit snippets */
        SELECT
          'exhibit_snippet'::text AS type,
          es.id::text AS id,
          es.title::text AS title,
          ts_headline('english', COALESCE(es.snippet_text,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/exhibits/' || es.case_id)::text AS href,
          es.created_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(es.title,'') || ' ' || COALESCE(es.snippet_text,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM exhibit_snippets es
        WHERE es.user_id = ${userId} AND es.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(es.title,'') || ' ' || COALESCE(es.snippet_text,'')) @@ (SELECT tsq FROM q)

        UNION ALL

        /* Children */
        SELECT
          'child'::text AS type,
          ch.id::text AS id,
          (COALESCE(ch.first_name,'') || ' ' || COALESCE(ch.last_name,''))::text AS title,
          ts_headline('english', COALESCE(ch.notes,''), (SELECT tsq FROM q), ${sql.raw(headlineOpts)}) AS snippet,
          ('/app/children/' || ch.case_id)::text AS href,
          ch.created_at::text AS "updatedAt",
          ts_rank_cd(to_tsvector('english', COALESCE(ch.first_name,'') || ' ' || COALESCE(ch.last_name,'') || ' ' || COALESCE(ch.notes,'')), (SELECT tsq FROM q))::float8 AS rank
        FROM case_children ch
        WHERE ch.user_id = ${userId} AND ch.case_id = ${caseId}
          AND to_tsvector('english', COALESCE(ch.first_name,'') || ' ' || COALESCE(ch.last_name,'') || ' ' || COALESCE(ch.notes,'')) @@ (SELECT tsq FROM q)
      ) s
      ORDER BY s.rank DESC, s."updatedAt" DESC NULLS LAST
      LIMIT ${limit}
    `);

    return (result.rows ?? result) as any;
  }

  async createCitationPointer(userId: string, caseId: string, data: InsertCitationPointer): Promise<CitationPointer> {
    const [citation] = await db
      .insert(citationPointers)
      .values({
        userId,
        caseId,
        evidenceFileId: data.evidenceFileId,
        quote: data.quote,
        pageNumber: data.pageNumber ?? null,
        timestampSeconds: data.timestampSeconds ?? null,
        messageRange: data.messageRange ?? null,
        excerpt: data.excerpt ?? null,
        startOffset: data.startOffset ?? null,
        endOffset: data.endOffset ?? null,
        confidence: data.confidence ?? null,
      })
      .returning();
    return citation;
  }

  async listCitationPointersByEvidence(userId: string, caseId: string, evidenceFileId: string): Promise<CitationPointer[]> {
    return db
      .select()
      .from(citationPointers)
      .where(
        and(
          eq(citationPointers.userId, userId),
          eq(citationPointers.caseId, caseId),
          eq(citationPointers.evidenceFileId, evidenceFileId)
        )
      )
      .orderBy(desc(citationPointers.createdAt));
  }

  async createCaseClaim(userId: string, caseId: string, data: InsertCaseClaim): Promise<CaseClaim> {
    const [claim] = await db
      .insert(caseClaims)
      .values({
        userId,
        caseId,
        claimText: data.claimText,
        claimType: data.claimType ?? "fact",
        tags: data.tags ?? [],
        color: data.color ?? null,
        missingInfoFlag: data.missingInfoFlag ?? false,
        createdFrom: data.createdFrom ?? "manual",
        status: data.status ?? "suggested",
        sourceNoteId: data.sourceNoteId ?? null,
      })
      .returning();
    return claim;
  }

  async listCaseClaims(userId: string, caseId: string, filters?: { status?: ClaimStatus; evidenceFileId?: string }): Promise<CaseClaim[]> {
    const conditions = [eq(caseClaims.userId, userId), eq(caseClaims.caseId, caseId)];
    if (filters?.status) {
      conditions.push(eq(caseClaims.status, filters.status));
    }
    let claims = await db
      .select()
      .from(caseClaims)
      .where(and(...conditions))
      .orderBy(desc(caseClaims.createdAt));

    if (filters?.evidenceFileId) {
      const citationIds = await db
        .select({ citationId: claimCitations.citationId })
        .from(claimCitations)
        .innerJoin(citationPointers, eq(claimCitations.citationId, citationPointers.id))
        .where(eq(citationPointers.evidenceFileId, filters.evidenceFileId));
      const cidSet = new Set(citationIds.map((r) => r.citationId));

      const claimLinks = await db.select().from(claimCitations);
      const claimIdSet = new Set(
        claimLinks.filter((l) => cidSet.has(l.citationId)).map((l) => l.claimId)
      );
      claims = claims.filter((c) => claimIdSet.has(c.id));
    }
    return claims;
  }

  async getCaseClaim(userId: string, claimId: string): Promise<CaseClaim | undefined> {
    const [claim] = await db
      .select()
      .from(caseClaims)
      .where(and(eq(caseClaims.id, claimId), eq(caseClaims.userId, userId)));
    return claim;
  }

  async updateCaseClaim(userId: string, claimId: string, patch: UpdateCaseClaim): Promise<CaseClaim | undefined> {
    const existing = await this.getCaseClaim(userId, claimId);
    if (!existing) return undefined;
    const [updated] = await db
      .update(caseClaims)
      .set({
        claimText: patch.claimText ?? existing.claimText,
        claimType: patch.claimType ?? existing.claimType,
        tags: patch.tags ?? existing.tags,
        color: patch.color !== undefined ? patch.color : existing.color,
        missingInfoFlag: patch.missingInfoFlag ?? existing.missingInfoFlag,
        status: patch.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(and(eq(caseClaims.id, claimId), eq(caseClaims.userId, userId)))
      .returning();
    return updated;
  }

  async deleteCaseClaim(userId: string, claimId: string): Promise<boolean> {
    const result = await db
      .delete(caseClaims)
      .where(and(eq(caseClaims.id, claimId), eq(caseClaims.userId, userId)));
    return (result as any).rowCount > 0;
  }

  async attachClaimCitation(userId: string, claimId: string, citationId: string): Promise<boolean> {
    const claim = await this.getCaseClaim(userId, claimId);
    if (!claim) return false;
    try {
      await db.insert(claimCitations).values({ claimId, citationId });
      return true;
    } catch (err) {
      return false;
    }
  }

  async detachClaimCitation(userId: string, claimId: string, citationId: string): Promise<boolean> {
    const claim = await this.getCaseClaim(userId, claimId);
    if (!claim) return false;
    const result = await db
      .delete(claimCitations)
      .where(and(eq(claimCitations.claimId, claimId), eq(claimCitations.citationId, citationId)));
    return (result as any).rowCount > 0;
  }

  async listClaimCitations(userId: string, claimId: string): Promise<CitationPointer[]> {
    const claim = await this.getCaseClaim(userId, claimId);
    if (!claim) return [];
    const links = await db
      .select({ citationId: claimCitations.citationId })
      .from(claimCitations)
      .where(eq(claimCitations.claimId, claimId));
    if (links.length === 0) return [];
    const cIds = links.map((l) => l.citationId);
    return db.select().from(citationPointers).where(inArray(citationPointers.id, cIds));
  }

  async createIssueGrouping(userId: string, caseId: string, data: InsertIssueGrouping): Promise<IssueGrouping> {
    const [issue] = await db
      .insert(issueGroupings)
      .values({
        userId,
        caseId,
        title: data.title,
        description: data.description ?? null,
        tags: data.tags ?? [],
      })
      .returning();
    return issue;
  }

  async listIssueGroupings(userId: string, caseId: string): Promise<IssueGrouping[]> {
    return db
      .select()
      .from(issueGroupings)
      .where(and(eq(issueGroupings.userId, userId), eq(issueGroupings.caseId, caseId)))
      .orderBy(desc(issueGroupings.createdAt));
  }

  async getIssueGrouping(userId: string, issueId: string): Promise<IssueGrouping | undefined> {
    const [issue] = await db
      .select()
      .from(issueGroupings)
      .where(and(eq(issueGroupings.id, issueId), eq(issueGroupings.userId, userId)));
    return issue;
  }

  async updateIssueGrouping(userId: string, issueId: string, patch: UpdateIssueGrouping): Promise<IssueGrouping | undefined> {
    const existing = await this.getIssueGrouping(userId, issueId);
    if (!existing) return undefined;
    const [updated] = await db
      .update(issueGroupings)
      .set({
        title: patch.title ?? existing.title,
        description: patch.description !== undefined ? patch.description : existing.description,
        tags: patch.tags ?? existing.tags,
        updatedAt: new Date(),
      })
      .where(and(eq(issueGroupings.id, issueId), eq(issueGroupings.userId, userId)))
      .returning();
    return updated;
  }

  async deleteIssueGrouping(userId: string, issueId: string): Promise<boolean> {
    const result = await db
      .delete(issueGroupings)
      .where(and(eq(issueGroupings.id, issueId), eq(issueGroupings.userId, userId)));
    return (result as any).rowCount > 0;
  }

  async addClaimToIssue(userId: string, issueId: string, claimId: string): Promise<boolean> {
    const issue = await this.getIssueGrouping(userId, issueId);
    const claim = await this.getCaseClaim(userId, claimId);
    if (!issue || !claim) return false;
    try {
      await db.insert(issueClaims).values({ issueId, claimId });
      return true;
    } catch (err) {
      return false;
    }
  }

  async removeClaimFromIssue(userId: string, issueId: string, claimId: string): Promise<boolean> {
    const issue = await this.getIssueGrouping(userId, issueId);
    if (!issue) return false;
    const result = await db
      .delete(issueClaims)
      .where(and(eq(issueClaims.issueId, issueId), eq(issueClaims.claimId, claimId)));
    return (result as any).rowCount > 0;
  }

  async listIssueClaims(userId: string, issueId: string): Promise<CaseClaim[]> {
    const issue = await this.getIssueGrouping(userId, issueId);
    if (!issue) return [];
    const links = await db
      .select({ claimId: issueClaims.claimId })
      .from(issueClaims)
      .where(eq(issueClaims.issueId, issueId));
    if (links.length === 0) return [];
    const claimIds = links.map((l) => l.claimId);
    return db
      .select()
      .from(caseClaims)
      .where(and(eq(caseClaims.userId, userId), inArray(caseClaims.id, claimIds)));
  }

  async getCaseDraftReadiness(userId: string, caseId: string): Promise<DraftReadinessStats> {
    const acceptedClaims = await db
      .select()
      .from(caseClaims)
      .where(
        and(eq(caseClaims.userId, userId), eq(caseClaims.caseId, caseId), eq(caseClaims.status, "accepted"))
      );
    const suggestedClaims = await db
      .select()
      .from(caseClaims)
      .where(
        and(eq(caseClaims.userId, userId), eq(caseClaims.caseId, caseId), eq(caseClaims.status, "suggested"))
      );
    const acceptedIds = acceptedClaims.map((c) => c.id);
    let acceptedWithCitationsCount = 0;
    if (acceptedIds.length > 0) {
      const citationLinks = await db
        .select({ claimId: claimCitations.claimId })
        .from(claimCitations)
        .where(inArray(claimCitations.claimId, acceptedIds));
      const claimsWithCitations = new Set(citationLinks.map((l) => l.claimId));
      acceptedWithCitationsCount = claimsWithCitations.size;
    }
    const acceptedMissingInfo = acceptedClaims.filter((c) => c.missingInfoFlag).length;
    const lastUpdated = acceptedClaims.length > 0
      ? acceptedClaims.reduce((latest, c) => (c.updatedAt > latest ? c.updatedAt : latest), acceptedClaims[0].updatedAt)
      : null;

    return {
      acceptedClaimsCount: acceptedClaims.length,
      acceptedClaimsWithCitationsCount: acceptedWithCitationsCount,
      acceptedClaimsMissingInfoCount: acceptedMissingInfo,
      suggestedClaimsCount: suggestedClaims.length,
      timelineEventsWithCitationsCount: 0,
      lastUpdatedAt: lastUpdated ? lastUpdated.toISOString() : null,
    };
  }

  async getClaimsCompilePreflight(caseId: string, userId: string): Promise<{
    acceptedClaims: { id: string; missingInfoFlag: boolean }[];
    claimCitationCounts: Record<string, number>;
  }> {
    const accepted = await db
      .select({ id: caseClaims.id, missingInfoFlag: caseClaims.missingInfoFlag })
      .from(caseClaims)
      .where(
        and(
          eq(caseClaims.userId, userId),
          eq(caseClaims.caseId, caseId),
          eq(caseClaims.status, "accepted")
        )
      );

    const claimCitationCounts: Record<string, number> = {};
    if (accepted.length > 0) {
      const claimIds = accepted.map((c) => c.id);
      const citationLinks = await db
        .select({ claimId: claimCitations.claimId })
        .from(claimCitations)
        .where(inArray(claimCitations.claimId, claimIds));

      for (const link of citationLinks) {
        claimCitationCounts[link.claimId] = (claimCitationCounts[link.claimId] || 0) + 1;
      }
    }

    return {
      acceptedClaims: accepted.map((c) => ({ id: c.id, missingInfoFlag: c.missingInfoFlag ?? false })),
      claimCitationCounts,
    };
  }

  async listCitationPointersForCase(userId: string, caseId: string): Promise<CitationPointer[]> {
    return db
      .select()
      .from(citationPointers)
      .where(and(eq(citationPointers.userId, userId), eq(citationPointers.caseId, caseId)));
  }

  async autoAttachClaimCitation(
    userId: string,
    claimId: string,
    options?: { maxAttach?: number; preferEvidenceId?: string }
  ): Promise<{ attached: number; citationIds: string[] }> {
    const maxAttach = options?.maxAttach ?? 1;
    const preferEvidenceId = options?.preferEvidenceId;

    const claim = await this.getCaseClaim(userId, claimId);
    if (!claim) return { attached: 0, citationIds: [] };

    const existingCitations = await this.listClaimCitations(userId, claimId);
    if (existingCitations.length >= maxAttach) {
      return { attached: 0, citationIds: [] };
    }

    const needed = maxAttach - existingCitations.length;
    const existingCitationIds = new Set(existingCitations.map((c) => c.id));

    let candidates = await this.listCitationPointersForCase(userId, claim.caseId);
    candidates = candidates.filter((c) => !existingCitationIds.has(c.id));

    if (candidates.length === 0) {
      return { attached: 0, citationIds: [] };
    }

    const claimWords = new Set(
      claim.claimText
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

    const scored = candidates.map((cit) => {
      let score = 0;
      const citText = (cit.quote || "").toLowerCase();

      if (preferEvidenceId && cit.evidenceFileId === preferEvidenceId) {
        score += 50;
      }

      for (const word of claimWords) {
        if (citText.includes(word)) score += 5;
      }

      if (cit.pageNumber !== null || cit.timestampSeconds !== null) {
        score += 3;
      }

      const len = (cit.quote || "").length;
      if (len >= 20 && len <= 350) {
        score += 2;
      }

      return { cit, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const toAttach = scored.slice(0, needed);
    const attachedIds: string[] = [];

    for (const { cit } of toAttach) {
      const success = await this.attachClaimCitation(userId, claimId, cit.id);
      if (success) {
        attachedIds.push(cit.id);
      }
    }

    return { attached: attachedIds.length, citationIds: attachedIds };
  }

  async getLexiUserPrefs(userId: string): Promise<LexiUserPrefs | undefined> {
    const [prefs] = await db.select().from(lexiUserPrefs).where(eq(lexiUserPrefs.userId, userId));
    return prefs;
  }

  async upsertLexiUserPrefs(userId: string, data: UpsertLexiUserPrefs): Promise<LexiUserPrefs> {
    const existing = await this.getLexiUserPrefs(userId);
    if (existing) {
      const [updated] = await db
        .update(lexiUserPrefs)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(lexiUserPrefs.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(lexiUserPrefs)
        .values({ userId, ...data })
        .returning();
      return created;
    }
  }

  async getLexiCaseMemory(userId: string, caseId: string): Promise<LexiCaseMemory | undefined> {
    const [memory] = await db
      .select()
      .from(lexiCaseMemory)
      .where(and(eq(lexiCaseMemory.userId, userId), eq(lexiCaseMemory.caseId, caseId)));
    return memory;
  }

  async upsertLexiCaseMemory(userId: string, caseId: string, data: Partial<UpsertLexiCaseMemory>): Promise<LexiCaseMemory> {
    const existing = await this.getLexiCaseMemory(userId, caseId);
    if (existing) {
      const [updated] = await db
        .update(lexiCaseMemory)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(lexiCaseMemory.userId, userId), eq(lexiCaseMemory.caseId, caseId)))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(lexiCaseMemory)
        .values({ userId, caseId, ...data })
        .returning();
      return created;
    }
  }

  async updateLexiCaseMemoryMarkdown(userId: string, caseId: string, memoryMarkdown: string): Promise<void> {
    const existing = await this.getLexiCaseMemory(userId, caseId);
    if (existing) {
      await db
        .update(lexiCaseMemory)
        .set({ memoryMarkdown, updatedAt: new Date() })
        .where(and(eq(lexiCaseMemory.userId, userId), eq(lexiCaseMemory.caseId, caseId)));
    } else {
      await db.insert(lexiCaseMemory).values({ userId, caseId, memoryMarkdown });
    }
  }

  async createLexiFeedbackEvent(userId: string, caseId: string | null, eventType: string, payload: Record<string, unknown>): Promise<LexiFeedbackEvent> {
    const [event] = await db
      .insert(lexiFeedbackEvents)
      .values({ userId, caseId, eventType, payloadJson: payload })
      .returning();
    return event;
  }

  async listLexiFeedbackEvents(userId: string, caseId: string | null, limit: number = 50): Promise<LexiFeedbackEvent[]> {
    if (caseId) {
      return db
        .select()
        .from(lexiFeedbackEvents)
        .where(and(eq(lexiFeedbackEvents.userId, userId), eq(lexiFeedbackEvents.caseId, caseId)))
        .orderBy(desc(lexiFeedbackEvents.createdAt))
        .limit(limit);
    } else {
      return db
        .select()
        .from(lexiFeedbackEvents)
        .where(eq(lexiFeedbackEvents.userId, userId))
        .orderBy(desc(lexiFeedbackEvents.createdAt))
        .limit(limit);
    }
  }

  async createActivityLog(userId: string, caseId: string | null, type: string, summary: string, metadata: Record<string, unknown> = {}): Promise<ActivityLog> {
    const [log] = await db
      .insert(activityLogs)
      .values({ userId, caseId, type, summary, metadataJson: metadata })
      .returning();
    return log;
  }

  async listActivityLogs(userId: string, limit: number = 50, offset: number = 0): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Phase 2F: Case Facts
  async createCaseFact(userId: string, caseId: string, data: InsertCaseFact): Promise<CaseFact> {
    const [fact] = await db
      .insert(caseFacts)
      .values({ userId, caseId, ...data })
      .returning();
    return fact;
  }

  async listCaseFacts(userId: string, caseId: string, filters?: ListCaseFactsFilters): Promise<CaseFact[]> {
    const conditions = [eq(caseFacts.userId, userId), eq(caseFacts.caseId, caseId)];
    if (filters?.status) {
      conditions.push(eq(caseFacts.status, filters.status));
    }
    let query = db.select().from(caseFacts).where(and(...conditions));
    const results = await query.orderBy(caseFacts.key);
    if (filters?.prefix) {
      return results.filter(f => f.key.startsWith(filters.prefix!));
    }
    return results;
  }

  async getCaseFact(userId: string, factId: string): Promise<CaseFact | undefined> {
    const [fact] = await db
      .select()
      .from(caseFacts)
      .where(and(eq(caseFacts.userId, userId), eq(caseFacts.id, factId)));
    return fact;
  }

  async updateCaseFact(userId: string, factId: string, patch: UpdateCaseFact): Promise<CaseFact | undefined> {
    const [updated] = await db
      .update(caseFacts)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(eq(caseFacts.userId, userId), eq(caseFacts.id, factId)))
      .returning();
    return updated;
  }

  async deleteCaseFact(userId: string, factId: string): Promise<boolean> {
    const result = await db
      .delete(caseFacts)
      .where(and(eq(caseFacts.userId, userId), eq(caseFacts.id, factId)))
      .returning();
    return result.length > 0;
  }

  // Phase 2F: Fact Citations
  async attachFactCitation(userId: string, caseId: string, factId: string, citationId: string): Promise<FactCitation> {
    const [citation] = await db
      .insert(factCitations)
      .values({ userId, caseId, factId, citationId })
      .onConflictDoNothing()
      .returning();
    if (!citation) {
      const [existing] = await db
        .select()
        .from(factCitations)
        .where(and(eq(factCitations.factId, factId), eq(factCitations.citationId, citationId)));
      return existing;
    }
    return citation;
  }

  async detachFactCitation(userId: string, factId: string, citationId: string): Promise<boolean> {
    const result = await db
      .delete(factCitations)
      .where(and(
        eq(factCitations.userId, userId),
        eq(factCitations.factId, factId),
        eq(factCitations.citationId, citationId)
      ))
      .returning();
    return result.length > 0;
  }

  async listFactCitations(userId: string, factId: string): Promise<FactCitation[]> {
    return db
      .select()
      .from(factCitations)
      .where(and(eq(factCitations.userId, userId), eq(factCitations.factId, factId)));
  }

  // Phase 3A: Cross-Module Links - Timeline Event Links
  async createTimelineEventLink(userId: string, caseId: string, eventId: string, payload: InsertTimelineEventLink): Promise<TimelineEventLink> {
    const event = await this.getTimelineEvent(eventId, userId);
    if (!event || event.caseId !== caseId) {
      throw new Error("Timeline event not found or doesn't belong to this case");
    }
    
    if (payload.evidenceId) {
      const evidence = await this.getEvidenceFile(payload.evidenceId, userId);
      if (!evidence || evidence.caseId !== caseId) {
        throw new Error("Evidence file not found or doesn't belong to this case");
      }
    }
    if (payload.claimId) {
      const claim = await this.getCaseClaim(userId, payload.claimId);
      if (!claim || claim.caseId !== caseId) {
        throw new Error("Claim not found or doesn't belong to this case");
      }
    }
    if (payload.snippetId) {
      const snippet = await this.getExhibitSnippet(userId, payload.snippetId);
      if (!snippet || snippet.caseId !== caseId) {
        throw new Error("Snippet not found or doesn't belong to this case");
      }
    }
    
    const [link] = await db
      .insert(timelineEventLinks)
      .values({
        userId,
        caseId,
        eventId,
        linkType: payload.linkType,
        evidenceId: payload.evidenceId || null,
        claimId: payload.claimId || null,
        snippetId: payload.snippetId || null,
        note: payload.note || null,
      })
      .onConflictDoNothing()
      .returning();
    
    if (!link) {
      const [existing] = await db
        .select()
        .from(timelineEventLinks)
        .where(and(
          eq(timelineEventLinks.eventId, eventId),
          eq(timelineEventLinks.linkType, payload.linkType)
        ));
      return existing;
    }
    return link;
  }

  async listTimelineEventLinks(userId: string, caseId: string, eventId: string): Promise<TimelineEventLink[]> {
    return db
      .select()
      .from(timelineEventLinks)
      .where(and(
        eq(timelineEventLinks.userId, userId),
        eq(timelineEventLinks.caseId, caseId),
        eq(timelineEventLinks.eventId, eventId)
      ))
      .orderBy(desc(timelineEventLinks.createdAt));
  }

  async deleteTimelineEventLink(userId: string, linkId: string): Promise<boolean> {
    const result = await db
      .delete(timelineEventLinks)
      .where(and(eq(timelineEventLinks.userId, userId), eq(timelineEventLinks.id, linkId)))
      .returning();
    return result.length > 0;
  }

  // Phase 3A: Cross-Module Links - Claim Links
  async createClaimLink(userId: string, caseId: string, claimId: string, payload: InsertClaimLink): Promise<ClaimLink> {
    const claim = await this.getCaseClaim(userId, claimId);
    if (!claim || claim.caseId !== caseId) {
      throw new Error("Claim not found or doesn't belong to this case");
    }
    
    if (payload.eventId) {
      const event = await this.getTimelineEvent(payload.eventId, userId);
      if (!event || event.caseId !== caseId) {
        throw new Error("Timeline event not found or doesn't belong to this case");
      }
    }
    if (payload.trialPrepId) {
      const item = await this.getTrialPrepShortlistItem(userId, payload.trialPrepId);
      if (!item || item.caseId !== caseId) {
        throw new Error("Trial prep item not found or doesn't belong to this case");
      }
    }
    if (payload.snippetId) {
      const snippet = await this.getExhibitSnippet(userId, payload.snippetId);
      if (!snippet || snippet.caseId !== caseId) {
        throw new Error("Snippet not found or doesn't belong to this case");
      }
    }
    
    const [link] = await db
      .insert(claimLinks)
      .values({
        userId,
        caseId,
        claimId,
        linkType: payload.linkType,
        eventId: payload.eventId || null,
        trialPrepId: payload.trialPrepId || null,
        snippetId: payload.snippetId || null,
      })
      .onConflictDoNothing()
      .returning();
    
    if (!link) {
      const [existing] = await db
        .select()
        .from(claimLinks)
        .where(and(
          eq(claimLinks.claimId, claimId),
          eq(claimLinks.linkType, payload.linkType)
        ));
      return existing;
    }
    return link;
  }

  async listClaimLinks(userId: string, caseId: string, claimId: string): Promise<ClaimLink[]> {
    return db
      .select()
      .from(claimLinks)
      .where(and(
        eq(claimLinks.userId, userId),
        eq(claimLinks.caseId, caseId),
        eq(claimLinks.claimId, claimId)
      ))
      .orderBy(desc(claimLinks.createdAt));
  }

  async deleteClaimLink(userId: string, linkId: string): Promise<boolean> {
    const result = await db
      .delete(claimLinks)
      .where(and(eq(claimLinks.userId, userId), eq(claimLinks.id, linkId)))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
