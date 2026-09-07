import { protectedProcedure, t } from "../init";
import { videosInputSchemas } from "../inputs/videos";

export const videosRouter = t.router({
  list: protectedProcedure
    .input(videosInputSchemas["videos.list"])
    .query(({ ctx, input }) => ctx.call("videos.list", input)),
  statusCounts: protectedProcedure.query(({ ctx }) =>
    ctx.call("videos.statusCounts", undefined),
  ),
  get: protectedProcedure.input(videosInputSchemas["videos.get"]).query(({ ctx, input }) =>
    ctx.call("videos.get", input),
  ),
  requestUpload: protectedProcedure
    .input(videosInputSchemas["videos.requestUpload"])
    .mutation(({ ctx, input }) => ctx.call("videos.requestUpload", input)),
  confirmUpload: protectedProcedure.input(videosInputSchemas["videos.confirmUpload"]).mutation(({ ctx, input }) =>
    ctx.call("videos.confirmUpload", input),
  ),
  createYoutube: protectedProcedure
    .input(videosInputSchemas["videos.createYoutube"])
    .mutation(({ ctx, input }) => ctx.call("videos.createYoutube", input)),
  update: protectedProcedure
    .input(videosInputSchemas["videos.update"])
    .mutation(({ ctx, input }) => ctx.call("videos.update", input)),
  replace: protectedProcedure
    .input(videosInputSchemas["videos.replace"])
    .mutation(({ ctx, input }) => ctx.call("videos.replace", input)),
  delete: protectedProcedure.input(videosInputSchemas["videos.delete"]).mutation(({ ctx, input }) =>
    ctx.call("videos.delete", input),
  ),
});
