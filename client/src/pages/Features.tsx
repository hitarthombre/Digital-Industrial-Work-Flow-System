export default function Features() {
  return (
    <div className="py-16 text-center space-y-8 max-w-4xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-extrabold text-white">Platform Features</h2>
      <p className="text-lg text-slate-455 max-w-2xl mx-auto leading-relaxed">
        DIWS hosts a suite of connected modules designed specifically to align with standard manufacturing operation flows.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {[
          { title: 'Secure Authentication', desc: 'Custom role-based permissions and complete, enterprise-level tenant isolation.' },
          { title: 'Factory Configuration', desc: 'Map your physical assets easily by managing multiple factories and warehouses.' },
          { title: 'Inventory Analytics', desc: 'Real-time stock level monitoring, batch movements, adjustments, and alerts.' },
          { title: 'Procurement Pipeline', desc: 'Digitize purchasing by linking purchase requests, approvals, and goods receipts.' },
          { title: 'Production Tracking', desc: 'Monitor production phases, record raw material consumption, and log scrap.' },
          { title: 'Sales & Dispatch', desc: 'Manage quotations, confirmed sales invoices, shipment tracking, and logistics documents.' }
        ].map((feat, idx) => (
          <div key={idx} className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors">
            <h4 className="font-bold text-white mb-2 flex items-center">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2" />
              {feat.title}
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
