import { protectedProcedure, t } from "../init";
import { tagsInputSchemas } from "../inputs/tags";

export const tagsRouter = t.router({
  list: protectedProcedure
    .input(tagsInputSchemas["tags.list"])
    .query(({ ctx, input }) => ctx.call("tags.list", input)),
  get: protectedProcedure.input(tagsInputSchemas["tags.get"]).query(({ ctx, input }) =>
    ctx.call("tags.get", input),
  ),
  create: protectedProcedure
    .input(tagsInputSchemas["tags.create"])
    .mutation(({ ctx, input }) => ctx.call("tags.create", input)),
  update: protectedProcedure
    .input(tagsInputSchemas["tags.update"])
    .mutation(({ ctx, input }) => ctx.call("tags.update", input)),
  replace: protectedProcedure
    .input(tagsInputSchemas["tags.replace"])
    .mutation(({ ctx, input }) => ctx.call("tags.replace", input)),
  delete: protectedProcedure.input(tagsInputSchemas["tags.delete"]).mutation(({ ctx, input }) =>
    ctx.call("tags.delete", input),
  ),
});
