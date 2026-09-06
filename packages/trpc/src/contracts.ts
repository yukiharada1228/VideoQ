import type {
  AdminUser,
  BillingPlan,
  ChatAnalytics,
  ChatHistoryItem,
  ChatLogEvaluation,
  ChatMessage,
  Course,
  CourseListItem,
  CourseInvitationDeliveryStatus,
  CourseInvitationPreview,
  CourseInviteRecipientResult,
  CoursePage,
  CourseParticipants,
  EvaluationSummary,
  Page,
  PlogConcept,
  PlogEdge,
  PlogGraph,
  PlogLearnerState,
  PlogWaypoint,
  Tag,
  TagDetail,
  TagPage,
  UploadRequestResponse,
  User,
  Video,
  VideoListItem,
  VideoStatusCounts,
} from "./models";

export type EmptyInput = undefined;
export type Success = { success: true };

export interface RpcInputMap {
  "account.me": EmptyInput;
  "account.searchApiKeyStatus": EmptyInput;
  "account.saveSearchApiKey": { apiKey: string };
  "account.deleteSearchApiKey": EmptyInput;

  "admin.listUsers": { q?: string; limit: number; offset: number };
  "admin.getUser": { id: string };
  "admin.patchQuota": {
    id: string;
    max_video_upload_size_mb?: number;
    storage_limit_gb?: number | null;
    processing_limit_minutes?: number | null;
    ai_answers_limit?: number | null;
    quota_source?: "plan" | "admin";
  };
  "admin.patchUsage": {
    id: string;
    used_storage_bytes?: number;
    used_processing_seconds?: number;
    used_ai_answers?: number;
    usage_period_start?: string | null;
    is_over_quota?: boolean;
  };
  "admin.patchFlags": {
    id: string;
    is_active?: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
  };
  "admin.deleteUser": { id: string };
  "admin.reindexAll": EmptyInput;

  "billing.plans": EmptyInput;
  "billing.checkout": { lookupKey: string; locale?: "en" | "ja" };
  "billing.portal": { locale?: "en" | "ja" };

  "chat.send": {
    messages: { role: "user" | "assistant" | "system"; content: string }[];
    courseId?: number | null;
    shareSlug?: string;
    mode?: "qa" | "study";
    studySessionId?: string | null;
  };
  "chat.feedback": {
    chatLogId: number;
    feedback: "good" | "bad" | null;
    shareSlug?: string;
  };
  "chat.history": { courseId: number; limit: number; offset: number };
  "chat.resetHistory": { courseId: number };
  "chat.analytics": { courseId: number };

  "evaluation.summary": { courseId: number };
  "evaluation.logs": { courseId: number; limit: number; offset: number };

  "videos.list": {
    q?: string;
    status?: string;
    ordering?: "uploaded_at_desc" | "uploaded_at_asc" | "title_asc" | "title_desc";
    tags?: number[];
    limit: number;
    cursor?: number;
  };
  "videos.statusCounts": EmptyInput;
  "videos.get": { id: number };
  "videos.requestUpload": {
    filename: string;
    contentType: string;
    fileSize: number;
    title: string;
    description?: string;
  };
  "videos.confirmUpload": { id: number };
  "videos.createYoutube": { youtubeUrl: string; title: string; description?: string };
  "videos.update": { id: number; title?: string; description?: string; transcript?: string };
  "videos.replace": { id: number; title: string; description?: string };
  "videos.delete": { id: number };

  "courses.list": { limit: number; cursor?: number };
  "courses.get": { id: number };
  "courses.shared": { slug: string };
  "courses.create": { name: string; description: string };
  "courses.update": { id: number; name?: string; description?: string };
  "courses.replace": { id: number; name: string; description: string };
  "courses.delete": { id: number };
  "courses.reorder": { courseIds: number[] };
  "courses.createShare": { id: number; shareSlug: string };
  "courses.deleteShare": { id: number };

  "courseMemberships.invite": { courseId: number; emails: string[] };
  "courseMemberships.participants": { courseId: number };
  "courseMemberships.preview": { token: string };
  "courseMemberships.accept": { token: string };
  "courseMemberships.decline": { token: string };
  "courseMemberships.resend": { courseId: number; invitationId: number };
  "courseMemberships.revoke": { courseId: number; invitationId: number };
  "courseMemberships.removeMember": { courseId: number; userId: string };
  "courseMemberships.leave": { courseId: number };

  "memberships.addTags": { videoId: number; tagIds: number[] };
  "memberships.removeTag": { videoId: number; tagId: number };
  "memberships.reorderVideos": { courseId: number; videoIds: number[] };
  "memberships.addVideos": { courseId: number; videoIds: number[] };
  "memberships.addVideo": { courseId: number; videoId: number };
  "memberships.removeVideo": { courseId: number; videoId: number };

  "tags.list": { limit: number; offset: number };
  "tags.get": { id: number };
  "tags.create": { name: string; color: string };
  "tags.update": { id: number; name?: string; color?: string };
  "tags.replace": { id: number; name: string; color: string };
  "tags.delete": { id: number };

  "plog.graph": { videoId: number };
  "plog.learnerState": { videoId: number };
  "plog.resetLearnerState": { videoId: number };
  "plog.rebuild": { videoId: number };
  "plog.createConcept": {
    videoId: number;
    label: string;
    nodeType?: string;
    introSec?: number;
    sourceQuote?: string;
  };
  "plog.updateConcept": {
    videoId: number;
    conceptId: number;
    label?: string;
    nodeType?: string;
    introSec?: number;
    sourceQuote?: string;
  };
  "plog.deleteConcept": { videoId: number; conceptId: number };
  "plog.mergeConcepts": { videoId: number; survivorId: number; absorbId: number };
  "plog.updateLearningObject": {
    videoId: number;
    conceptId: number;
    openingQuestion?: string;
    hintLadder?: string[];
    misconceptions?: string[];
    canonicalOrder?: string[];
    workedExamples?: string[];
    waypoints?: PlogWaypoint[];
  };
  "plog.createEdge": {
    videoId: number;
    sourceId: number;
    targetId: number;
    edgeType: string;
    quote?: string;
  };
  "plog.updateEdge": {
    videoId: number;
    edgeId: number;
    sourceId?: number;
    targetId?: number;
    edgeType?: string;
    quote?: string;
  };
  "plog.deleteEdge": { videoId: number; edgeId: number };
}

export interface RpcOutputMap {
  "account.me": User;
  "account.searchApiKeyStatus": { has_api_key: boolean };
  "account.saveSearchApiKey": Success;
  "account.deleteSearchApiKey": Success;

  "admin.listUsers": Page<AdminUser>;
  "admin.getUser": AdminUser;
  "admin.patchQuota": AdminUser;
  "admin.patchUsage": AdminUser;
  "admin.patchFlags": AdminUser;
  "admin.deleteUser": { job_id: string };
  "admin.reindexAll": { job_id: string };

  "billing.plans": BillingPlan[];
  "billing.checkout": { url: string };
  "billing.portal": { url: string };

  "chat.send": ChatMessage;
  "chat.feedback": { chat_log_id: number; feedback: "good" | "bad" | null };
  "chat.history": Page<ChatHistoryItem>;
  "chat.resetHistory": Success;
  "chat.analytics": ChatAnalytics;

  "evaluation.summary": EvaluationSummary;
  "evaluation.logs": Page<ChatLogEvaluation>;

  "videos.list": Page<VideoListItem>;
  "videos.statusCounts": VideoStatusCounts;
  "videos.get": Video;
  "videos.requestUpload": UploadRequestResponse;
  "videos.confirmUpload": Video;
  "videos.createYoutube": Video;
  "videos.update": Video;
  "videos.replace": Video;
  "videos.delete": Success;

  "courses.list": CoursePage;
  "courses.get": Course;
  "courses.shared": Course;
  "courses.create": CourseListItem;
  "courses.update": Course;
  "courses.replace": Course;
  "courses.delete": Success;
  "courses.reorder": { courseIds: number[] };
  "courses.createShare": { message: string; share_slug: string };
  "courses.deleteShare": Success;

  "courseMemberships.invite": { results: CourseInviteRecipientResult[] };
  "courseMemberships.participants": CourseParticipants;
  "courseMemberships.preview": CourseInvitationPreview;
  "courseMemberships.accept": { course_id: number; status: "accepted" };
  "courseMemberships.decline": { status: "declined" };
  "courseMemberships.resend": { delivery_status: CourseInvitationDeliveryStatus };
  "courseMemberships.revoke": Success;
  "courseMemberships.removeMember": Success;
  "courseMemberships.leave": Success;

  "memberships.addTags": { message: string; added_count: number; skipped_count: number };
  "memberships.removeTag": { message: string };
  "memberships.reorderVideos": { message: string };
  "memberships.addVideos": { message: string; added_count: number; skipped_count: number };
  "memberships.addVideo": { message: string; id: number; reused: boolean };
  "memberships.removeVideo": Success;

  "tags.list": TagPage;
  "tags.get": TagDetail;
  "tags.create": Tag;
  "tags.update": Tag;
  "tags.replace": Tag;
  "tags.delete": Success;

  "plog.graph": PlogGraph;
  "plog.learnerState": { states: PlogLearnerState[] };
  "plog.resetLearnerState": { deleted: number };
  "plog.rebuild": { video_id: number; status: string; job_id: number };
  "plog.createConcept": PlogConcept;
  "plog.updateConcept": PlogConcept;
  "plog.deleteConcept": { deleted: true; id: number };
  "plog.mergeConcepts": PlogConcept;
  "plog.updateLearningObject": PlogConcept;
  "plog.createEdge": PlogEdge;
  "plog.updateEdge": PlogEdge;
  "plog.deleteEdge": { deleted: true; id: number };
}

export type ProcedureName = keyof RpcInputMap & keyof RpcOutputMap;

export type RpcCaller = <Name extends ProcedureName>(
  name: Name,
  input: RpcInputMap[Name],
) => Promise<RpcOutputMap[Name]>;

export type ProcedureHandlers = {
  [Name in ProcedureName]: (
    input: RpcInputMap[Name],
  ) => Promise<RpcOutputMap[Name]>;
};
