import { z } from "zod";

const id = z.number().int().positive();

export const tagsInputSchemas = {
  "tags.list": z.object({
    limit: z.number().int().positive().max(100).default(100),
    offset: z.number().int().nonnegative().default(0),
  }).default({ limit: 100, offset: 0 }),
  "tags.get": z.object({ id }),
  "tags.create": z.object({ name: z.string().min(1).max(50), color: z.string().min(1).default("gray") }),
  "tags.update": z.object({
    id,
    name: z.string().min(1).max(50).optional(),
    color: z.string().min(1).optional(),
  }),
  "tags.replace": z.object({ id, name: z.string().min(1).max(50), color: z.string().min(1) }),
  "tags.delete": z.object({ id }),
};
