import { z } from "zod";
import { adminProcedure, t } from "../init";

const userId = z.object({ id: z.string().min(1) });

export const adminRouter = t.router({
  listUsers: adminProcedure
    .input(z.object({
      q: z.string().optional(),
      limit: z.number().int().positive().max(100).default(100),
      offset: z.number().int().nonnegative().default(0),
    }).default({ limit: 100, offset: 0 }))
    .query(({ ctx, input }) => ctx.call("admin.listUsers", input)),
  getUser: adminProcedure.input(userId).query(({ ctx, input }) =>
    ctx.call("admin.getUser", input),
  ),
  patchQuota: adminProcedure
    .input(userId.extend({
      max_video_upload_size_mb: z.number().int().positive().optional(),
      storage_limit_gb: z.number().nullable().optional(),
      processing_limit_minutes: z.number().nullable().optional(),
      ai_answers_limit: z.number().nullable().optional(),
      quota_source: z.enum(["plan", "admin"]).optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("admin.patchQuota", input)),
  patchUsage: adminProcedure
    .input(userId.extend({
      used_storage_bytes: z.number().int().nonnegative().optional(),
      used_processing_seconds: z.number().int().nonnegative().optional(),
      used_ai_answers: z.number().int().nonnegative().optional(),
      usage_period_start: z.string().nullable().optional(),
      is_over_quota: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("admin.patchUsage", input)),
  patchFlags: adminProcedure
    .input(userId.extend({
      is_active: z.boolean().optional(),
      is_staff: z.boolean().optional(),
      is_superuser: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("admin.patchFlags", input)),
  deleteUser: adminProcedure.input(userId).mutation(({ ctx, input }) =>
    ctx.call("admin.deleteUser", input),
  ),
  reindexAll: adminProcedure.mutation(({ ctx }) =>
    ctx.call("admin.reindexAll", undefined),
  ),
});
