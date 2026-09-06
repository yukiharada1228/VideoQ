import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from "../init";
import { chatMessagesSchema } from "../schema";

const page = {
  limit: z.number().int().positive().max(500).default(100),
  offset: z.number().int().nonnegative().default(0),
};

export const chatRouter = t.router({
  send: publicProcedure
    .input(z.object({
      messages: chatMessagesSchema,
      courseId: z.number().int().positive().nullable().optional(),
      shareSlug: z.string().min(1).optional(),
      mode: z.enum(["qa", "study"]).default("qa"),
      studySessionId: z.string().max(128).nullable().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("chat.send", input)),
  feedback: publicProcedure
    .input(z.object({
      chatLogId: z.number().int().positive(),
      feedback: z.enum(["good", "bad"]).nullable(),
      shareSlug: z.string().min(1).optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("chat.feedback", input)),
  history: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive(), ...page }))
    .query(({ ctx, input }) => ctx.call("chat.history", input)),
  resetHistory: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => ctx.call("chat.resetHistory", input)),
  analytics: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .query(({ ctx, input }) => ctx.call("chat.analytics", input)),
});

export const evaluationRouter = t.router({
  summary: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive() }))
    .query(({ ctx, input }) => ctx.call("evaluation.summary", input)),
  logs: protectedProcedure
    .input(z.object({ courseId: z.number().int().positive(), ...page }))
    .query(({ ctx, input }) => ctx.call("evaluation.logs", input)),
});
