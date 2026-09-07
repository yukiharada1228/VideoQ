import { protectedProcedure, publicProcedure, t } from "../init";
import { coursesInputSchemas } from "../inputs/courses";

export const coursesRouter = t.router({
  list: protectedProcedure
    .input(coursesInputSchemas["courses.list"])
    .query(({ ctx, input }) => ctx.call("courses.list", input)),
  get: protectedProcedure.input(coursesInputSchemas["courses.get"]).query(({ ctx, input }) =>
    ctx.call("courses.get", input),
  ),
  shared: publicProcedure
    .input(coursesInputSchemas["courses.shared"])
    .query(({ ctx, input }) => ctx.call("courses.shared", input)),
  create: protectedProcedure
    .input(coursesInputSchemas["courses.create"])
    .mutation(({ ctx, input }) => ctx.call("courses.create", input)),
  update: protectedProcedure
    .input(coursesInputSchemas["courses.update"])
    .mutation(({ ctx, input }) => ctx.call("courses.update", input)),
  replace: protectedProcedure
    .input(coursesInputSchemas["courses.replace"])
    .mutation(({ ctx, input }) => ctx.call("courses.replace", input)),
  delete: protectedProcedure.input(coursesInputSchemas["courses.delete"]).mutation(({ ctx, input }) =>
    ctx.call("courses.delete", input),
  ),
  reorder: protectedProcedure
    .input(coursesInputSchemas["courses.reorder"])
    .mutation(({ ctx, input }) => ctx.call("courses.reorder", input)),
  createShare: protectedProcedure
    .input(coursesInputSchemas["courses.createShare"])
    .mutation(({ ctx, input }) => ctx.call("courses.createShare", input)),
  deleteShare: protectedProcedure.input(coursesInputSchemas["courses.deleteShare"]).mutation(({ ctx, input }) =>
    ctx.call("courses.deleteShare", input),
  ),
});

export const courseMembershipsRouter = t.router({
  invite: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.invite"])
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.invite", input)),
  participants: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.participants"])
    .query(({ ctx, input }) => ctx.call("courseMemberships.participants", input)),
  preview: publicProcedure
    .input(coursesInputSchemas["courseMemberships.preview"])
    .query(({ ctx, input }) => ctx.call("courseMemberships.preview", input)),
  accept: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.accept"])
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.accept", input)),
  decline: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.decline"])
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.decline", input)),
  resend: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.resend"])
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.resend", input)),
  revoke: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.revoke"])
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.revoke", input)),
  removeMember: protectedProcedure
    .input(coursesInputSchemas["courseMemberships.removeMember"])
    .mutation(({ ctx, input }) => ctx.call("courseMemberships.removeMember", input)),
  leave: protectedProcedure.input(coursesInputSchemas["courseMemberships.leave"]).mutation(({ ctx, input }) =>
    ctx.call("courseMemberships.leave", input),
  ),
});

export const membershipsRouter = t.router({
  addTags: protectedProcedure
    .input(coursesInputSchemas["memberships.addTags"])
    .mutation(({ ctx, input }) => ctx.call("memberships.addTags", input)),
  removeTag: protectedProcedure
    .input(coursesInputSchemas["memberships.removeTag"])
    .mutation(({ ctx, input }) => ctx.call("memberships.removeTag", input)),
  reorderVideos: protectedProcedure
    .input(coursesInputSchemas["memberships.reorderVideos"])
    .mutation(({ ctx, input }) => ctx.call("memberships.reorderVideos", input)),
  addVideos: protectedProcedure
    .input(coursesInputSchemas["memberships.addVideos"])
    .mutation(({ ctx, input }) => ctx.call("memberships.addVideos", input)),
  addVideo: protectedProcedure
    .input(coursesInputSchemas["memberships.addVideo"])
    .mutation(({ ctx, input }) => ctx.call("memberships.addVideo", input)),
  removeVideo: protectedProcedure
    .input(coursesInputSchemas["memberships.removeVideo"])
    .mutation(({ ctx, input }) => ctx.call("memberships.removeVideo", input)),
});
