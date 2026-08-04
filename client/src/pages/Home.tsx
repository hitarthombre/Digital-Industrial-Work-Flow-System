export default function Home() {
  return (
    <div className="py-16 text-center space-y-6 max-w-4xl mx-auto">
      <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
        Digital Industrial <br />
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Workflow System</span>
      </h1>
      <p className="text-lg text-slate-405 leading-relaxed">
        A cloud-based, multi-tenant SaaS platform built to coordinate, track, and optimize manufacturing operations, inventory movements, procurement workflows, and factory analytics.
      </p>
      <div className="pt-6">
        <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          Welcome to the Portal
        </span>
      </div>
    </div>
  )
}
