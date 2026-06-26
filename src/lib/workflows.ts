import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export function listWorkflows(userId: string) {
  return prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, name: true, thumbnail: true, createdAt: true, updatedAt: true },
  });
}

export function getWorkflow(userId: string, id: string) {
  return prisma.workflow.findFirst({ where: { id, userId } });
}

export function createWorkflow(userId: string, name: string) {
  return prisma.workflow.create({ data: { userId, name } });
}

export async function updateWorkflow(
  userId: string,
  id: string,
  patch: { name?: string; graph?: Prisma.InputJsonValue; thumbnail?: string | null },
) {
  const data: Prisma.WorkflowUpdateManyMutationInput = {};
  if (patch.name !== undefined) data.name = patch.name;
  if (patch.graph !== undefined) data.graph = patch.graph;
  if (patch.thumbnail !== undefined) data.thumbnail = patch.thumbnail;

  const result = await prisma.workflow.updateMany({ where: { id, userId }, data });
  if (result.count === 0) return null;
  return prisma.workflow.findUnique({ where: { id } });
}

export async function duplicateWorkflow(userId: string, id: string) {
  const source = await prisma.workflow.findFirst({ where: { id, userId } });
  if (!source) return null;
  return prisma.workflow.create({
    data: {
      userId,
      name: `${source.name} Copy`,
      thumbnail: source.thumbnail,
      graph: source.graph as Prisma.InputJsonValue,
    },
  });
}

export async function deleteWorkflow(userId: string, id: string) {
  const result = await prisma.workflow.deleteMany({ where: { id, userId } });
  return result.count > 0;
}

export function createImportedWorkflow(
  userId: string,
  name: string,
  graph: Prisma.InputJsonValue,
) {
  return prisma.workflow.create({ data: { userId, name, graph } });
}
