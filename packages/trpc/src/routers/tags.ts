import { z } from "zod";
import { protectedProcedure, t } from "../init";

const id = z.number().int().positive();

export const tagsRouter = t.router({
  list: protectedProcedure
    .input(z.object({
      limit: z.number().int().positive().max(100).default(100),
      offset: z.number().int().nonnegative().default(0),
    }).default({ limit: 100, offset: 0 }))
    .query(({ ctx, input }) => ctx.call("tags.list", input)),
  get: protectedProcedure.input(z.object({ id })).query(({ ctx, input }) =>
    ctx.call("tags.get", input),
  ),
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50), color: z.string().min(1).default("gray") }))
    .mutation(({ ctx, input }) => ctx.call("tags.create", input)),
  update: protectedProcedure
    .input(z.object({
      id,
      name: z.string().min(1).max(50).optional(),
      color: z.string().min(1).optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("tags.update", input)),
  replace: protectedProcedure
    .input(z.object({ id, name: z.string().min(1).max(50), color: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.call("tags.replace", input)),
  delete: protectedProcedure.input(z.object({ id })).mutation(({ ctx, input }) =>
    ctx.call("tags.delete", input),
  ),
});
