export default function About() {
  return (
    <div className="py-16 text-center space-y-6 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-extrabold text-white">About the Platform</h2>
      <p className="text-lg text-slate-400 leading-relaxed">
        The Digital Industrial Workflow System (DIWS) is engineered to solve operational inefficiencies in the manufacturing sector. By transitioning traditional paper and spreadsheet workflows into a unified, secure cloud environment, we empower companies with complete visibility over their logistics, production stages, and warehousing.
      </p>
      <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h4 className="font-bold text-white mb-2">Our Vision</h4>
          <p className="text-sm text-slate-400">To establish the standard framework for digital industrial workflows across global manufacturing pipelines.</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <h4 className="font-bold text-white mb-2">Our Mission</h4>
          <p className="text-sm text-slate-400">Deliver configurable, robust SaaS solutions that optimize resources, track inventory, and reduce operational overhead.</p>
        </div>
      </div>
    </div>
  )
}
