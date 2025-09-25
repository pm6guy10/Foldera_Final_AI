export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Foldera Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-2">Documents Analyzed</h2>
          <p className="text-3xl font-bold text-cyan-400">1,287</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-2">Conflicts Detected</h2>
          <p className="text-3xl font-bold text-amber-400">23</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-xl border border-slate-800">
          <h2 className="text-xl font-semibold mb-2">Time Saved</h2>
          <p className="text-3xl font-bold text-green-400">47 hrs</p>
        </div>
      </div>
      <div className="mt-8 p-6 bg-slate-900 rounded-xl border border-slate-800">
        <p className="text-slate-400">Full dashboard features coming soon...</p>
      </div>
    </div>
  );
}
