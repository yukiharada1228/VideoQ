import { protectedProcedure, publicProcedure, t } from "../init";
import { chatInputSchemas } from "../inputs/chat";

export const chatRouter = t.router({
  send: publicProcedure
    .input(chatInputSchemas["chat.send"])
    .mutation(({ ctx, input }) => ctx.call("chat.send", input)),
  feedback: publicProcedure
    .input(chatInputSchemas["chat.feedback"])
    .mutation(({ ctx, input }) => ctx.call("chat.feedback", input)),
  history: protectedProcedure
    .input(chatInputSchemas["chat.history"])
    .query(({ ctx, input }) => ctx.call("chat.history", input)),
  resetHistory: protectedProcedure
    .input(chatInputSchemas["chat.resetHistory"])
    .mutation(({ ctx, input }) => ctx.call("chat.resetHistory", input)),
  analytics: protectedProcedure
    .input(chatInputSchemas["chat.analytics"])
    .query(({ ctx, input }) => ctx.call("chat.analytics", input)),
});

export const evaluationRouter = t.router({
  summary: protectedProcedure
    .input(chatInputSchemas["evaluation.summary"])
    .query(({ ctx, input }) => ctx.call("evaluation.summary", input)),
  logs: protectedProcedure
    .input(chatInputSchemas["evaluation.logs"])
    .query(({ ctx, input }) => ctx.call("evaluation.logs", input)),
});
