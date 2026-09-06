import { z } from "zod";
import { protectedProcedure, t } from "../init";

const id = z.number().int().positive();
const videoId = z.object({ videoId: id });
const conceptId = videoId.extend({ conceptId: id });
const edgeId = videoId.extend({ edgeId: id });
const waypoint = z.object({
  start_sec: z.number().optional(),
  end_sec: z.number().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  label: z.string().optional(),
});

export const plogRouter = t.router({
  graph: protectedProcedure.input(videoId).query(({ ctx, input }) =>
    ctx.call("plog.graph", input),
  ),
  learnerState: protectedProcedure.input(videoId).query(({ ctx, input }) =>
    ctx.call("plog.learnerState", input),
  ),
  resetLearnerState: protectedProcedure.input(videoId).mutation(({ ctx, input }) =>
    ctx.call("plog.resetLearnerState", input),
  ),
  rebuild: protectedProcedure.input(videoId).mutation(({ ctx, input }) =>
    ctx.call("plog.rebuild", input),
  ),
  createConcept: protectedProcedure
    .input(videoId.extend({
      label: z.string().trim().min(1, "label is required"),
      nodeType: z.string().optional(),
      introSec: z.number().optional(),
      sourceQuote: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("plog.createConcept", input)),
  updateConcept: protectedProcedure
    .input(conceptId.extend({
      label: z.string().optional(),
      nodeType: z.string().optional(),
      introSec: z.number().optional(),
      sourceQuote: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("plog.updateConcept", input)),
  deleteConcept: protectedProcedure.input(conceptId).mutation(({ ctx, input }) =>
    ctx.call("plog.deleteConcept", input),
  ),
  mergeConcepts: protectedProcedure
    .input(videoId.extend({ survivorId: id, absorbId: id }))
    .mutation(({ ctx, input }) => ctx.call("plog.mergeConcepts", input)),
  updateLearningObject: protectedProcedure
    .input(conceptId.extend({
      openingQuestion: z.string().optional(),
      hintLadder: z.array(z.string()).optional(),
      misconceptions: z.array(z.string()).optional(),
      canonicalOrder: z.array(z.string()).optional(),
      workedExamples: z.array(z.string()).optional(),
      waypoints: z.array(waypoint).optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("plog.updateLearningObject", input)),
  createEdge: protectedProcedure
    .input(videoId.extend({
      sourceId: id,
      targetId: id,
      edgeType: z.string(),
      quote: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => ctx.call("plog.createEdge", input)),
  updateEdge: protectedProcedure
    .input(edgeId.extend({
      sourceId: id.optional(),
      targetId: id.optional(),
      edgeType: z.string().optional(),
      quote: z.string().optional(),
    }).refine(
      ({ sourceId, targetId, edgeType, quote }) =>
        sourceId !== undefined || targetId !== undefined || edgeType !== undefined || quote !== undefined,
      { message: "Provide at least one edge field" },
    ))
    .mutation(({ ctx, input }) => ctx.call("plog.updateEdge", input)),
  deleteEdge: protectedProcedure.input(edgeId).mutation(({ ctx, input }) =>
    ctx.call("plog.deleteEdge", input),
  ),
});
