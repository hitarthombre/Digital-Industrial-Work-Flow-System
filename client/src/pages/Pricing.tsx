export default function Pricing() {
  return (
    <div className="py-16 text-center space-y-8 max-w-5xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-extrabold text-white">Pricing Plans</h2>
      <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Choose the plan that suits your company scale. All plans offer complete data isolation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
        {[
          { name: 'Starter', price: '$49', features: ['Up to 1 Factory', 'Up to 2 Warehouses', 'Max 10 active users', 'Basic reporting'] },
          { name: 'Professional', price: '$149', features: ['Up to 5 Factories', 'Up to 10 Warehouses', 'Max 50 active users', 'Advanced analytics', 'Email alerts'], highlight: true },
          { name: 'Enterprise', price: 'Custom', features: ['Unlimited Factories', 'Unlimited Warehouses', 'Unlimited active users', 'Dedicated support', 'API Integrations', 'Custom audit logs'] }
        ].map((plan, idx) => (
          <div key={idx} className={`p-8 rounded-2xl border text-left flex flex-col justify-between ${
            plan.highlight 
              ? 'bg-slate-900/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10 relative' 
              : 'bg-slate-900/40 border-slate-800'
          }`}>
            {plan.highlight && (
              <span className="absolute -top-3.5 left-6 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-white">{plan.name}</h4>
              <div className="flex items-baseline">
                <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                {plan.price !== 'Custom' && <span className="text-slate-450 ml-1 text-sm">/month</span>}
              </div>
              <ul className="space-y-2 pt-4">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="text-sm text-slate-400 flex items-center">
                    <svg className="w-4 h-4 text-indigo-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>
            <button className={`w-full mt-8 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              plan.highlight
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}>
              {plan.price === 'Custom' ? 'Contact Us' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
