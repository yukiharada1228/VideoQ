import { z } from "zod";

const userId = z.object({ id: z.string().min(1) });

export const adminInputSchemas = {
  "admin.listUsers": z.object({
    q: z.string().optional(),
    limit: z.number().int().positive().max(100).default(100),
    offset: z.number().int().nonnegative().default(0),
  }).default({ limit: 100, offset: 0 }),
  "admin.getUser": userId,
  "admin.patchQuota": userId.extend({
    max_video_upload_size_mb: z.number().int().positive().optional(),
    storage_limit_gb: z.number().nullable().optional(),
    processing_limit_minutes: z.number().nullable().optional(),
    ai_answers_limit: z.number().nullable().optional(),
    quota_source: z.enum(["plan", "admin"]).optional(),
  }),
  "admin.patchUsage": userId.extend({
    used_storage_bytes: z.number().int().nonnegative().optional(),
    used_processing_seconds: z.number().int().nonnegative().optional(),
    used_ai_answers: z.number().int().nonnegative().optional(),
    usage_period_start: z.string().nullable().optional(),
    is_over_quota: z.boolean().optional(),
  }),
  "admin.patchFlags": userId.extend({
    is_active: z.boolean().optional(),
    is_staff: z.boolean().optional(),
    is_superuser: z.boolean().optional(),
  }),
  "admin.deleteUser": userId,
  "admin.reindexAll": z.undefined(),
};
