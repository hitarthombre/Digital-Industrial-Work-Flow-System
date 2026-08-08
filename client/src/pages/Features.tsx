import Featurecard from "../Components-Cards/Featurecard";

export default function Features() {
  const features = [
    {
      icon: "⚙",
      title: "Workflow Management",
      description:
        "Design, manage and optimize industrial workflows from a centralized platform.",
    },
    {
      icon: "📦",
      title: "Inventory Management",
      description:
        "Maintain better visibility of materials, products and resources across operations.",
    },
    {
      icon: "⚡",
      title: "Smart Automation",
      description:
        "Reduce repetitive manual tasks and create smoother, more efficient workflows.",
    },
    {
      icon: "📊",
      title: "Analytics & Insights",
      description:
        "Turn operational data into meaningful insights that help teams make better decisions.",
    },
    {
      icon: "👥",
      title: "Team Collaboration",
      description:
        "Keep teams connected with shared workflows, information and operational visibility.",
    },
    {
      icon: "🔒",
      title: "Secure Platform",
      description:
        "Keep your operational information organized with a secure and reliable platform.",
    },
  ];

  return (
    <main className="features-page">

      {/* HERO */}

      <section className="features-hero">
        <span className="section-label">
          PLATFORM CAPABILITIES
        </span>

        <h1>
          Powerful tools for
          <span> smarter operations.</span>
        </h1>

        <p>
          DIWS brings your industrial workflows, operations and
          teams together in one streamlined platform.
        </p>
      </section>


      {/* FEATURES */}

      <section className="features-section">

        <div className="section-heading">
          <span className="section-label">
            WHAT WE OFFER
          </span>

          <h2>
            Everything you need to
            <span> simplify operations.</span>
          </h2>
        </div>


        <div className="feature-grid">

          {features.map((feature, index) => (
            <Featurecard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}

        </div>

      </section>


      {/* HIGHLIGHT */}

      <section className="features-highlight">

        <div className="highlight-content">

          <span className="section-label">
            CONNECTED WORKFLOWS
          </span>

          <h2>
            One platform.
            <br />
            <span>One connected workflow.</span>
          </h2>

          <p>
            From planning and coordination to execution and
            analysis, DIWS helps bring every stage of your
            industrial workflow together.
          </p>

          <button className="copper-button">
            Explore the platform
          </button>

        </div>

      </section>


      {/* CTA */}

      <section className="features-cta">

        <span className="section-label">
          GET STARTED
        </span>

        <h2>
          Ready to build a
          <span> better workflow?</span>
        </h2>

        <p>
          Discover how DIWS can help your organization
          operate with greater clarity and efficiency.
        </p>

        <button className="copper-button">
          Get Started
        </button>

      </section>

    </main>
  );
}