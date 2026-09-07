import { adminProcedure, t } from "../init";
import { adminInputSchemas } from "../inputs/admin";

export const adminRouter = t.router({
  listUsers: adminProcedure
    .input(adminInputSchemas["admin.listUsers"])
    .query(({ ctx, input }) => ctx.call("admin.listUsers", input)),
  getUser: adminProcedure.input(adminInputSchemas["admin.getUser"]).query(({ ctx, input }) =>
    ctx.call("admin.getUser", input),
  ),
  patchQuota: adminProcedure
    .input(adminInputSchemas["admin.patchQuota"])
    .mutation(({ ctx, input }) => ctx.call("admin.patchQuota", input)),
  patchUsage: adminProcedure
    .input(adminInputSchemas["admin.patchUsage"])
    .mutation(({ ctx, input }) => ctx.call("admin.patchUsage", input)),
  patchFlags: adminProcedure
    .input(adminInputSchemas["admin.patchFlags"])
    .mutation(({ ctx, input }) => ctx.call("admin.patchFlags", input)),
  deleteUser: adminProcedure.input(adminInputSchemas["admin.deleteUser"]).mutation(({ ctx, input }) =>
    ctx.call("admin.deleteUser", input),
  ),
  reindexAll: adminProcedure.mutation(({ ctx }) =>
    ctx.call("admin.reindexAll", undefined),
  ),
});
