export default function Terms() {
  return (
    <div className="py-16 text-left space-y-6 max-w-3xl mx-auto">
      <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-8">Terms & Conditions</h2>
      
      <section className="space-y-3">
        <h4 className="text-lg font-bold text-white">1. Service Definition</h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          The Digital Industrial Workflow System (DIWS) provides subscription-based software-as-a-service (SaaS) features for manufacturing businesses, including warehouse, procurement, production management, and reporting modules.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-lg font-bold text-white">2. Multi-Tenant Separation and Data Security</h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          We guarantee logical database isolation for each company tenant using strict system-level filtering. Under no circumstances will company data be shared, leaked, or accessible by other tenants.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-lg font-bold text-white">3. User Credentials and Responsibilities</h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          Organizations are responsible for maintaining the confidentiality of user account logins, managing sub-user role permissions properly, and auditing actions using the provided platform activity logs.
        </p>
      </section>

      <section className="space-y-3">
        <h4 className="text-lg font-bold text-white">4. Fair Usage and Availability</h4>
        <p className="text-sm text-slate-400 leading-relaxed">
          System services are hosted on reliable cloud infrastructures with target 99.9% uptime. Fair usage policies apply to API queries and cloud document storage volumes.
        </p>
      </section>
    </div>
  )
}
