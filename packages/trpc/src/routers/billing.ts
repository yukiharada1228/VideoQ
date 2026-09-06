import { z } from "zod";
import { protectedProcedure, publicProcedure, t } from "../init";

const locale = z.enum(["en", "ja"]).optional();

export const billingRouter = t.router({
  plans: publicProcedure.query(({ ctx }) => ctx.call("billing.plans", undefined)),
  checkout: protectedProcedure
    .input(z.object({ lookupKey: z.string().min(1), locale }))
    .mutation(({ ctx, input }) => ctx.call("billing.checkout", input)),
  portal: protectedProcedure
    .input(z.object({ locale }).default({}))
    .mutation(({ ctx, input }) => ctx.call("billing.portal", input)),
});
