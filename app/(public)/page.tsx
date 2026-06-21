// Phase 0 placeholder landing. A React Server Component — the content ships as
// raw HTML with zero client JS, which is the whole point of the project.
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6">
      <h1 className="text-4xl font-bold tracking-tight">Agentscape</h1>
      <p className="mt-4 text-lg text-gray-600">
        The front door for every AI agent — legible to both humans and machines
        at the same URL.
      </p>
    </main>
  );
}
