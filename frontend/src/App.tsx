export default function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-600">
        Local communication practice
      </p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
        EchoRole foundation
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
        The API contract is being scaffolded. The mock service worker is active
        in development; feature screens arrive in Phase 1.
      </p>
      <a
        className="mt-8 w-fit rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500"
        href="/api/v1/health"
      >
        Check mocked API
      </a>
    </main>
  );
}
