export interface Page<T> {
  data: T[];
  meta: { total: number; limit: number; offset: number };
}

export interface User {
  id: string;
  username: string;
  email: string;
  is_superuser?: boolean;
  video_count: number;
  max_video_upload_size_mb: number;
  used_storage_bytes?: number;
  storage_limit_bytes?: number | null;
  used_processing_seconds?: number;
  processing_limit_seconds?: number | null;
  used_ai_answers?: number;
  ai_answers_limit?: number | null;
  is_over_quota?: boolean;
  plan_code?: "free" | "basic" | "pro";
  subscription_status?: string | null;
  quota_source?: "plan" | "admin";
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  max_video_upload_size_mb: number;
  storage_limit_gb: number | null;
  processing_limit_minutes: number | null;
  ai_answers_limit: number | null;
  used_storage_bytes: number;
  used_processing_seconds: number;
  used_ai_answers: number;
  usage_period_start: string | null;
  is_over_quota: boolean;
  plan_code?: string;
  quota_source?: "plan" | "admin";
}

export interface BillingPlan {
  code: "free" | "basic" | "pro";
  interval: "month" | "year" | null;
  lookup_key: string | null;
  amount_yen: number;
  currency: "jpy";
  entitlements: {
    max_video_upload_size_mb: number;
    storage_limit_gb: number;
    processing_limit_minutes: number;
    ai_answers_limit: number;
  };
}

export interface Citation {
  id: number;
  video_id: number;
  title: string;
  start_time: string | null;
  end_time: string | null;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  chat_log_id?: number;
  feedback?: "good" | "bad" | null;
}

export interface ChatHistoryItem {
  id: number;
  course: number;
  asked_by: { user_id: string; username: string; email: string } | null;
  question: string;
  answer: string;
  citations?: Citation[];
  is_shared_origin: boolean;
  feedback?: "good" | "bad" | null;
  created_at: string;
  evaluation?: ChatLogEvaluation;
}

export interface ChatAnalytics {
  summary: {
    total_questions: number;
    date_range: { first?: string | null; last?: string | null };
  };
  time_series: { date: string; count: number }[];
  feedback: { good: number; bad: number; none: number };
}

export interface EvaluationSummary {
  course_id: number;
  evaluated_count: number;
  avg_faithfulness: number | null;
  avg_answer_relevancy: number | null;
  avg_context_precision: number | null;
}

export interface ChatLogEvaluation {
  chat_log_id: number;
  status: "pending" | "completed" | "failed";
  faithfulness: number | null;
  answer_relevancy: number | null;
  context_precision: number | null;
  error_message: string | null;
  evaluated_at: string | null;
}

export type VideoStatus = z.infer<typeof videoStatusSchema>;
export type VideoSourceType = z.infer<typeof videoSourceTypeSchema>;
export type VideoTag = z.infer<typeof videoTagSchema>;
export type VideoListItem = z.infer<typeof videoListItemSchema>;
export type Video = z.infer<typeof videoSchema>;

export interface VideoStatusCounts {
  total: number;
  completed: number;
  pending: number;
  processing: number;
  indexing: number;
  error: number;
  uploading: number;
}

export interface UploadRequestResponse {
  video: Video;
  upload_url: string;
}

export type VideoInCourse = Omit<VideoListItem, "tags"> & { order: number };

export interface CourseListItem {
  id: number;
  name: string;
  description: string;
  display_order: number;
  created_at: string;
  video_count: number;
  access_role: "owner" | "member";
}

export interface Course extends Omit<CourseListItem, "access_role"> {
  updated_at?: string;
  videos?: VideoInCourse[];
  share_slug?: string | null;
  access_role?: "owner" | "member" | "public";
}

export type CourseInvitationStatus = "pending" | "accepted" | "declined" | "expired" | "revoked";
export type CourseInvitationDeliveryStatus = "queued" | "sent" | "failed";

export interface CourseInviteRecipientResult {
  email: string;
  status: "queued" | "already_member" | "already_invited" | "invalid" | "duplicate";
  invitation_id?: number;
}

export interface CourseInvitationListItem {
  id: number;
  email: string;
  status: CourseInvitationStatus;
  delivery_status: CourseInvitationDeliveryStatus;
  expires_at: string;
  created_at: string;
  last_sent_at: string | null;
  send_attempts: number;
}

export interface CourseUserMember {
  user_id: string;
  username: string;
  email: string;
  joined_at: string;
}

export interface CourseParticipants {
  invitations: CourseInvitationListItem[];
  members: CourseUserMember[];
}

export interface CourseInvitationPreview {
  course_id: number;
  course_name: string;
  inviter_name: string;
  email_hint: string;
  status: CourseInvitationStatus;
  expires_at: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
  video_count: number;
}

export interface TagDetail extends Tag {
  videos?: VideoListItem[];
}

export interface PlogWaypoint {
  start_sec?: number;
  end_sec?: number;
  start_time?: string;
  end_time?: string;
  label?: string;
}

export interface PlogConcept {
  id: number;
  label: string;
  node_type: string;
  intro_sec: number;
  source_quote: string;
  opening_question: string;
  hint_ladder: string[];
  misconceptions: string[];
  canonical_order: string[];
  worked_examples: string[];
  waypoints: PlogWaypoint[];
  hint_count: number;
  waypoint_count: number;
}

export interface PlogEdge {
  id: number;
  source_id: number;
  source_label: string;
  target_id: number;
  target_label: string;
  edge_type: string;
  quote: string;
}

export interface PlogGraph {
  video_id: number;
  build_status: string;
  input_tokens: number;
  output_tokens: number;
  error_message: string;
  summary_node_count: number;
  concepts: PlogConcept[];
  edges: PlogEdge[];
}

export interface PlogLearnerState {
  concept_id: number;
  label: string;
  reached: boolean;
  hint_index: number;
  last_grade: string;
  active: boolean;
}

export type TagPage = Page<Tag>;
export type CoursePage = Page<CourseListItem>;
import type { z } from "zod";
import type {
  videoListItemSchema,
  videoSchema,
  videoSourceTypeSchema,
  videoStatusSchema,
  videoTagSchema,
} from "./schema";
