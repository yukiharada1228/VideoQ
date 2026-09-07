import { protectedProcedure, t } from "../init";
import { plogInputSchemas } from "../inputs/plog";

export const plogRouter = t.router({
  graph: protectedProcedure.input(plogInputSchemas["plog.graph"]).query(({ ctx, input }) =>
    ctx.call("plog.graph", input),
  ),
  learnerState: protectedProcedure.input(plogInputSchemas["plog.learnerState"]).query(({ ctx, input }) =>
    ctx.call("plog.learnerState", input),
  ),
  resetLearnerState: protectedProcedure.input(plogInputSchemas["plog.resetLearnerState"]).mutation(({ ctx, input }) =>
    ctx.call("plog.resetLearnerState", input),
  ),
  rebuild: protectedProcedure.input(plogInputSchemas["plog.rebuild"]).mutation(({ ctx, input }) =>
    ctx.call("plog.rebuild", input),
  ),
  createConcept: protectedProcedure
    .input(plogInputSchemas["plog.createConcept"])
    .mutation(({ ctx, input }) => ctx.call("plog.createConcept", input)),
  updateConcept: protectedProcedure
    .input(plogInputSchemas["plog.updateConcept"])
    .mutation(({ ctx, input }) => ctx.call("plog.updateConcept", input)),
  deleteConcept: protectedProcedure.input(plogInputSchemas["plog.deleteConcept"]).mutation(({ ctx, input }) =>
    ctx.call("plog.deleteConcept", input),
  ),
  mergeConcepts: protectedProcedure
    .input(plogInputSchemas["plog.mergeConcepts"])
    .mutation(({ ctx, input }) => ctx.call("plog.mergeConcepts", input)),
  updateLearningObject: protectedProcedure
    .input(plogInputSchemas["plog.updateLearningObject"])
    .mutation(({ ctx, input }) => ctx.call("plog.updateLearningObject", input)),
  createEdge: protectedProcedure
    .input(plogInputSchemas["plog.createEdge"])
    .mutation(({ ctx, input }) => ctx.call("plog.createEdge", input)),
  updateEdge: protectedProcedure
    .input(plogInputSchemas["plog.updateEdge"])
    .mutation(({ ctx, input }) => ctx.call("plog.updateEdge", input)),
  deleteEdge: protectedProcedure.input(plogInputSchemas["plog.deleteEdge"]).mutation(({ ctx, input }) =>
    ctx.call("plog.deleteEdge", input),
  ),
});
