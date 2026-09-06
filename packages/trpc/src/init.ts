import { TRPCError, initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import type { TrpcContext } from "./context";

type ApplicationErrorCause = {
  appCode?: unknown;
  code?: unknown;
  details?: unknown;
};

export const t = initTRPC.context<TrpcContext>().create({
  errorFormatter({ shape, error }) {
    const cause = error.cause as ApplicationErrorCause | undefined;
    const validationDetails: Record<string, string[]> = {};
    if (error.cause instanceof ZodError) {
      for (const issue of error.cause.issues) {
        const field = String(issue.path[0] ?? "input");
        (validationDetails[field] ??= []).push(issue.message);
      }
    }
    const applicationCode = error.cause instanceof ZodError
      ? "VALIDATION_ERROR"
      : typeof cause?.appCode === "string"
        ? cause.appCode
        : typeof cause?.code === "string"
          ? cause.code
          : undefined;
    const details = Object.keys(validationDetails).length > 0
      ? validationDetails
      : cause?.details;

    return {
      ...shape,
      message: error.cause instanceof ZodError
        ? (error.cause.issues[0]?.message ?? "Invalid input")
        : error.code === "INTERNAL_SERVER_ERROR"
          ? "An internal server error occurred."
          : shape.message,
      data: {
        ...shape.data,
        ...(applicationCode ? { applicationCode } : {}),
        ...(details !== undefined ? { details } : {}),
      },
    };
  },
});

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (ctx.userId === null) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication credentials were not provided.",
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  await ctx.assertSuperuser();
  return next();
});
