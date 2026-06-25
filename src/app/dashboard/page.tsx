import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();

  return (
    <main className="mx-auto w-full max-w-5xl p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <UserButton />
      </header>
      <p className="mt-2 text-sm text-gray-500">Signed in as {userId}</p>
      <p className="mt-8 text-gray-500">
        No workflows yet — the dashboard UI lands in Phase 2.
      </p>
    </main>
  );
}
