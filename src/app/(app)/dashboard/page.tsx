import { auth } from "@clerk/nextjs/server";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { listWorkflows } from "@/lib/workflows";

export default async function DashboardPage() {
  const { userId } = await auth();
  const rows = userId ? await listWorkflows(userId) : [];
  const workflows = rows.map((w) => ({
    id: w.id,
    name: w.name,
    thumbnail: w.thumbnail,
    updatedAt: w.updatedAt.toISOString(),
  }));
  return <DashboardView workflows={workflows} />;
}
