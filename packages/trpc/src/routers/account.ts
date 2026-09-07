import { protectedProcedure, t } from "../init";
import { accountInputSchemas } from "../inputs/account";

export const accountRouter = t.router({
  me: protectedProcedure.query(({ ctx }) => ctx.call("account.me", undefined)),
  searchApiKeyStatus: protectedProcedure.query(({ ctx }) =>
    ctx.call("account.searchApiKeyStatus", undefined),
  ),
  saveSearchApiKey: protectedProcedure
    .input(accountInputSchemas["account.saveSearchApiKey"])
    .mutation(({ ctx, input }) => ctx.call("account.saveSearchApiKey", input)),
  deleteSearchApiKey: protectedProcedure.mutation(({ ctx }) =>
    ctx.call("account.deleteSearchApiKey", undefined),
  ),
});
