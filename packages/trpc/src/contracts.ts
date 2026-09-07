import type { z } from "zod";
import type { inputSchemas } from "./inputs";
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
  Tag,
  TagDetail,
  TagPage,
  UploadRequestResponse,
  User,
  Video,
  VideoListItem,
  VideoStatusCounts,
} from "./models";

export type Success = { success: true };

/** Handlers receive validated inputs, including Zod defaults and transforms. */
export type RpcInputMap = {
  [Name in keyof typeof inputSchemas]: z.output<(typeof inputSchemas)[Name]>;
};

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

export type ProcedureName = keyof RpcInputMap;

export type RpcCaller = <Name extends ProcedureName>(
  name: Name,
  input: RpcInputMap[Name],
) => Promise<RpcOutputMap[Name]>;

export type ProcedureHandlers = {
  [Name in ProcedureName]: (
    input: RpcInputMap[Name],
  ) => Promise<RpcOutputMap[Name]>;
};
