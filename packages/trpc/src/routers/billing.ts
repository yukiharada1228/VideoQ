import { protectedProcedure, publicProcedure, t } from "../init";
import { billingInputSchemas } from "../inputs/billing";

export const billingRouter = t.router({
  plans: publicProcedure.query(({ ctx }) => ctx.call("billing.plans", undefined)),
  checkout: protectedProcedure
    .input(billingInputSchemas["billing.checkout"])
    .mutation(({ ctx, input }) => ctx.call("billing.checkout", input)),
  portal: protectedProcedure
    .input(billingInputSchemas["billing.portal"])
    .mutation(({ ctx, input }) => ctx.call("billing.portal", input)),
});
