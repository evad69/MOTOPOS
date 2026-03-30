/** Renders the temporary default landing page before feature pages are added. */
export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="rounded-xl bg-white px-8 py-10 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">MotorParts POS</h1>
        <p className="mt-3 text-base text-slate-600">
          Next.js 14 project scaffold is ready for feature development.
        </p>
      </div>
    </main>
  );
}
