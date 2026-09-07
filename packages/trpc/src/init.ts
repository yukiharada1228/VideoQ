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
    const internalError = error.code === "INTERNAL_SERVER_ERROR";
    // Output validation is a server failure, never a client field error.
    const outputValidationError = internalError && error.cause instanceof ZodError;
    const cause = outputValidationError ? undefined : error.cause as ApplicationErrorCause | undefined;
    const inputValidationError = error.code === "BAD_REQUEST" && error.cause instanceof ZodError
      ? error.cause
      : undefined;
    const validationDetails: Record<string, string[]> = {};
    if (inputValidationError) {
      for (const issue of inputValidationError.issues) {
        const field = String(issue.path[0] ?? "input");
        (validationDetails[field] ??= []).push(issue.message);
      }
    }
    const applicationCode = inputValidationError
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
      message: internalError
        ? "An internal server error occurred."
        : inputValidationError
          ? (inputValidationError.issues[0]?.message ?? "Invalid input")
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
