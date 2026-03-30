/** Renders the temporary dashboard placeholder used during setup verification. */
export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">MotorParts POS</h1>
        <p className="mt-2 text-sm text-slate-600">
          Phase 1 complete - setup verified.
        </p>
      </div>
    </main>
  );
}
