import { z } from "zod";
import { protectedProcedure, t } from "../init";

const id = z.number().int().positive();
const title = z.string().trim().min(1).max(255);

export const videosRouter = t.router({
  list: protectedProcedure
    .input(z.object({
      q: z.string().optional(),
      status: z.string().optional(),
      ordering: z.enum(["uploaded_at_desc", "uploaded_at_asc", "title_asc", "title_desc"]).optional(),
      tags: z.array(id).optional(),
      limit: z.number().int().positive().max(100).default(100),
      cursor: z.number().int().nonnegative().optional(),
    }).default({ limit: 100 }))
    .query(({ ctx, input }) => ctx.call("videos.list", input)),
  statusCounts: protectedProcedure.query(({ ctx }) =>
    ctx.call("videos.statusCounts", undefined),
  ),
  get: protectedProcedure.input(z.object({ id })).query(({ ctx, input }) =>
    ctx.call("videos.get", input),
  ),
  requestUpload: protectedProcedure
    .input(z.object({
      filename: z.string().trim().min(1).max(255),
      contentType: z.string().trim().min(1).max(100),
      fileSize: z.number().int().positive(),
      title,
      description: z.string().default(""),
    }))
    .mutation(({ ctx, input }) => ctx.call("videos.requestUpload", input)),
  confirmUpload: protectedProcedure.input(z.object({ id })).mutation(({ ctx, input }) =>
    ctx.call("videos.confirmUpload", input),
  ),
  createYoutube: protectedProcedure
    .input(z.object({ youtubeUrl: z.string().trim().min(1), title, description: z.string().default("") }))
    .mutation(({ ctx, input }) => ctx.call("videos.createYoutube", input)),
  update: protectedProcedure
    .input(z.object({
      id,
      title: title.optional(),
      description: z.string().optional(),
      transcript: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("videos.update", input)),
  replace: protectedProcedure
    .input(z.object({ id, title, description: z.string().default("") }))
    .mutation(({ ctx, input }) => ctx.call("videos.replace", input)),
  delete: protectedProcedure.input(z.object({ id })).mutation(({ ctx, input }) =>
    ctx.call("videos.delete", input),
  ),
});
