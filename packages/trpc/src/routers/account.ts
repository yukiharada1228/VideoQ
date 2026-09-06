import { z } from "zod";
import { protectedProcedure, t } from "../init";

export const accountRouter = t.router({
  me: protectedProcedure.query(({ ctx }) => ctx.call("account.me", undefined)),
  searchApiKeyStatus: protectedProcedure.query(({ ctx }) =>
    ctx.call("account.searchApiKeyStatus", undefined),
  ),
  saveSearchApiKey: protectedProcedure
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(({ ctx, input }) => ctx.call("account.saveSearchApiKey", input)),
  deleteSearchApiKey: protectedProcedure.mutation(({ ctx }) =>
    ctx.call("account.deleteSearchApiKey", undefined),
  ),
});
