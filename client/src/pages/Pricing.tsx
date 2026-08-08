import Pricingcard from "../Components-Cards/Pricingcard";

function Pricing() {
  return (
    <main className="pricing-page">

      {/* ================= PRICING HEADER ================= */}

      <section className="pricing-hero">

        <div className="pricing-eyebrow">
          SIMPLE & TRANSPARENT
        </div>

        <h1>
          Choose the right
          <span> workflow plan.</span>
        </h1>

        <p>
          Flexible plans designed to help industrial teams
          manage, monitor and optimize their workflows.
        </p>

      </section>


      {/* ================= PRICING CARDS ================= */}

      <section className="pricing-section">

        <div className="pricing-grid">

          <Pricingcard
            name="Starter"
            price="$29"
            description="For small teams getting started with digital workflow management."
            features={[
              "Up to 5 team members",
              "Workflow management",
              "Task assignment",
              "Basic progress tracking",
              "Standard reporting",
            ]}
          />

          <Pricingcard
            name="Professional"
            price="$79"
            description="For growing industrial teams that need advanced workflow control."
            features={[
              "Up to 25 team members",
              "Advanced workflow management",
              "Production monitoring",
              "Quality control tracking",
              "Analytics & reporting",
            ]}
            popular={true}
          />

          <Pricingcard
            name="Enterprise"
            price="$149"
            description="For large industrial organizations managing complex operations."
            features={[
              "Unlimited team members",
              "Complete workflow management",
              "Advanced production monitoring",
              "Real-time analytics",
              "Priority support",
            ]}
          />

        </div>

      </section>


      {/* ================= BOTTOM CTA ================= */}

      <section className="pricing-cta">

        <div>
          <p className="pricing-cta-label">
            READY TO GET STARTED?
          </p>

          <h2>
            Build a smarter
            <span> industrial workflow.</span>
          </h2>

          <p>
            Choose a plan that fits your team and start
            managing your workflow more efficiently.
          </p>
        </div>

        <button className="pricing-cta-button">
          Get Started
        </button>

      </section>

    </main>
  );
}

export default Pricing;