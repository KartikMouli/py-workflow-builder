export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex h-full items-center justify-center text-sm text-gray-400">
      Canvas for workflow {id} — coming in Phase 3.
    </div>
  );
}
