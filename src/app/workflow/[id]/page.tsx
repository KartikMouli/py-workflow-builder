export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <h1 className="text-xl font-semibold">Workflow {id}</h1>
      <p className="mt-8 text-gray-500">The canvas lands in Phase 3.</p>
    </main>
  );
}
