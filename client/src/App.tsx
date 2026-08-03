import { useState } from 'react'

function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'docs'>('overview')

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/75 border-b border-slate-800/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">DIWS</span>
              <span className="text-xs text-indigo-400 font-semibold ml-2 uppercase tracking-widest">Portal</span>
            </div>
          </div>

          <nav className="flex items-center space-x-1">
            {(['overview', 'modules', 'docs'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 capitalize ${
                  activeTab === tab
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              System Initialized
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-6 py-8">
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-150 to-slate-400">
                Digital Industrial <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Workflow System</span>
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                A multi-tenant SaaS platform built to coordinate, track, and optimize manufacturing operations, inventory movements, procurement workflows, and factory analytics.
              </p>
              <div className="pt-4 flex justify-center gap-4">
                <a
                  href="#explore"
                  onClick={(e) => { e.preventDefault(); setActiveTab('modules'); }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-sm hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Explore System Modules
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-semibold text-sm hover:bg-slate-800 transition-all duration-300"
                >
                  View Documentation
                </a>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Platform Architecture', val: 'Multi-Tenant', desc: 'Secure data isolation per tenant/company' },
                { label: 'API Services', val: 'Node & Express', desc: 'Robust TypeScript backend with REST services' },
                { label: 'Database Storage', val: 'MongoDB Atlas', desc: 'Flexible document design with Mongoose schemas' }
              ].map((stat, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-300" />
                  <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{stat.label}</span>
                  <div className="text-2xl font-bold mt-2 text-white">{stat.val}</div>
                  <p className="text-sm text-slate-400 mt-2">{stat.desc}</p>
                </div>
              ))}
            </div>

            {/* Live Progress Card */}
            <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-slate-850 shadow-xl">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Project Setup & Foundation Completed</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Frontend and Backend environments have been scaffolded with TypeScript support, Tailwind CSS v4, and initial server integrations.
                  </p>
                </div>
                <div className="flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-xl">
                  <span className="text-indigo-400 text-sm font-semibold">Milestone 1 & 2 Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Modules */}
        {activeTab === 'modules' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h2 className="text-3xl font-extrabold text-white">System Modules</h2>
              <p className="text-slate-400 text-sm">Overview of the core functional units configured in DIWS</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Authentication', desc: 'Secure token-based JWT logins, roles, & company isolation checks.' },
                { title: 'Organization Setup', desc: 'Configure multi-factories, warehouses, departments & settings.' },
                { title: 'Inventory & Stock', desc: 'Trace item history, adjustments, and warehouse transfers.' },
                { title: 'Procurement Flow', desc: 'Create and track purchase requests, orders, and goods receipts.' },
                { title: 'Production Management', desc: 'Work order tracking, material consumption, and scrap logging.' },
                { title: 'Sales & Dispatch', desc: 'Manage invoices, quotations, transport updates, and delivery states.' }
              ].map((mod, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 hover:bg-slate-900/60 hover:border-slate-700 transition-all duration-300">
                  <h4 className="font-bold text-white mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2.5" />
                    {mod.title}
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Docs */}
        {activeTab === 'docs' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-extrabold text-white">Documentation Quick Access</h2>
              <p className="text-slate-400 text-sm">System requirements, architectures, and design configurations</p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl divide-y divide-slate-800/80 overflow-hidden">
              {[
                { name: 'PRD.md', path: 'docs/01-Planning/PRD.md', desc: 'Functional requirements, business rules, and project scope.' },
                { name: 'Roadmap.md', path: 'docs/01-Planning/Roadmap.md', desc: 'Phase-wise milestones and expected project timeline.' },
                { name: 'Architecture.md', path: 'docs/02-Architecture/Architecture.md', desc: 'Server structures, layering, database concepts, and security design.' },
                { name: 'Database.md', path: 'docs/02-Architecture/Database.md', desc: 'Collection definitions, indexing, and multi-tenant schema models.' }
              ].map((doc, idx) => (
                <div key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/80 transition-all duration-200">
                  <div>
                    <h5 className="font-bold text-white text-sm">{doc.name}</h5>
                    <p className="text-xs text-slate-450 mt-1">{doc.desc}</p>
                  </div>
                  <div>
                    <span className="text-xs text-indigo-400 font-semibold bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10 hover:bg-indigo-500/20 transition-colors cursor-pointer">
                      {doc.path}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-slate-500 py-8 text-center text-xs mt-12 relative z-10">
        <p>© 2026 Digital Industrial Workflow System. All operational modules running.</p>
      </footer>
    </div>
  )
}

export default App
