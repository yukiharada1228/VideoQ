import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from "../init";

const id = z.number().int().positive();

export const coursesRouter = t.router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().max(100).default(24),
      cursor: z.number().int().nonnegative().optional(),
    }))
    .query(({ ctx, input }) => ctx.call("courses.list", input)),
  get: protectedProcedure.input(z.object({ id })).query(({ ctx, input }) =>
    ctx.call("courses.get", input),
  ),
  shared: publicProcedure
    .input(z.object({ slug: z.string().min(1).max(255) }))
    .query(({ ctx, input }) => ctx.call("courses.shared", input)),
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().default(""),
    }))
    .mutation(({ ctx, input }) => ctx.call("courses.create", input)),
  update: protectedProcedure
    .input(z.object({
      id,
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("courses.update", input)),
  replace: protectedProcedure
    .input(z.object({ id, name: z.string().min(1).max(255), description: z.string().default("") }))
    .mutation(({ ctx, input }) => ctx.call("courses.replace", input)),
  delete: protectedProcedure.input(z.object({ id })).mutation(({ ctx, input }) =>
    ctx.call("courses.delete", input),
  ),
  reorder: protectedProcedure
    .input(z.object({ courseIds: z.array(id).min(1) }))
    .mutation(({ ctx, input }) => ctx.call("courses.reorder", input)),
  createShare: protectedProcedure
    .input(z.object({ id, shareSlug: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.call("courses.createShare", input)),
  deleteShare: protectedProcedure.input(z.object({ id })).mutation(({ ctx, input }) =>
    ctx.call("courses.deleteShare", input),
  ),
});

export const courseMembershipsRouter = t.router({
  invite: protectedProcedure
    .input(z.object({
      courseId: id,
      emails: z.array(z.string().max(1024)).min(1).max(100),
    }))
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.invite", input)),
  participants: protectedProcedure
    .input(z.object({ courseId: id }))
    .query(({ ctx, input }) => ctx.call("courseMemberships.participants", input)),
  preview: publicProcedure
    .input(z.object({ token: z.string().min(1).max(256) }))
    .query(({ ctx, input }) => ctx.call("courseMemberships.preview", input)),
  accept: protectedProcedure
    .input(z.object({ token: z.string().min(1).max(256) }))
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.accept", input)),
  decline: protectedProcedure
    .input(z.object({ token: z.string().min(1).max(256) }))
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.decline", input)),
  resend: protectedProcedure
    .input(z.object({ courseId: id, invitationId: id }))
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.resend", input)),
  revoke: protectedProcedure
    .input(z.object({ courseId: id, invitationId: id }))
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.revoke", input)),
  removeMember: protectedProcedure
    .input(z.object({ courseId: id, userId: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.removeMember", input)),
  leave: protectedProcedure.input(z.object({ courseId: id })).mutation(({ ctx, input }) =>
    ctx.call("courseMemberships.leave", input),
  ),
});

export const membershipsRouter = t.router({
  addTags: protectedProcedure
    .input(z.object({ videoId: id, tagIds: z.array(id).min(1) }))
    .mutation(({ ctx, input }) => ctx.call("memberships.addTags", input)),
  removeTag: protectedProcedure
    .input(z.object({ videoId: id, tagId: id }))
    .mutation(({ ctx, input }) => ctx.call("memberships.removeTag", input)),
  reorderVideos: protectedProcedure
    .input(z.object({ courseId: id, videoIds: z.array(id) }))
    .mutation(({ ctx, input }) => ctx.call("memberships.reorderVideos", input)),
  addVideos: protectedProcedure
    .input(z.object({ courseId: id, videoIds: z.array(id).min(1) }))
    .mutation(({ ctx, input }) => ctx.call("memberships.addVideos", input)),
  addVideo: protectedProcedure
    .input(z.object({ courseId: id, videoId: id }))
    .mutation(({ ctx, input }) => ctx.call("memberships.addVideo", input)),
  removeVideo: protectedProcedure
    .input(z.object({ courseId: id, videoId: id }))
    .mutation(({ ctx, input }) => ctx.call("memberships.removeVideo", input)),
});
