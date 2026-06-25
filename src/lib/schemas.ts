import { z } from "zod";

const nodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1).optional(),
    position: z.object({ x: z.number(), y: z.number() }).optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  })
  .catchall(z.unknown());

const edgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
  })
  .catchall(z.unknown());

export const graphSchema = z.object({
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1).max(120),
});

export const updateWorkflowSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    graph: graphSchema.optional(),
  })
  .refine((d) => d.name !== undefined || d.graph !== undefined, {
    message: "Provide at least one of: name, graph",
  });

export const importWorkflowSchema = z.object({
  version: z.literal(1).optional(),
  name: z.string().min(1).max(120),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
});

export type Graph = z.infer<typeof graphSchema>;
