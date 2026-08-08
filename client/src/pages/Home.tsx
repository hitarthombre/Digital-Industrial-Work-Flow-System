function Home() {
  return (
    <div className="home-page">

      {/* ================= HERO ================= */}
      <section className="home-hero">

        <div className="home-hero-content">

          <p className="home-eyebrow">
            DIGITAL INDUSTRIAL WORKFLOW SYSTEM
          </p>

          <h1>
            Simplify Your
            <span> Industrial Workflow.</span>
          </h1>

          <p className="home-description">
            A modern digital platform designed to simplify,
            organize and optimize industrial workflows.
          </p>

          <div className="home-actions">
            <button className="primary-button">
              Get Started
            </button>

            <button className="secondary-button">
              Explore Features
            </button>
          </div>

        </div>

        {/* HERO VISUAL */}
        <div className="home-hero-visual">

          <div className="workflow-card">

            <div className="workflow-card-header">
              <span>Workflow Status</span>

              <span className="status-active">
                ● Active
              </span>
            </div>

            <div className="workflow-line">

              <div className="workflow-step completed">
                <div className="step-circle">✓</div>

                <div>
                  <strong>Planning</strong>
                  <small>Completed</small>
                </div>
              </div>

              <div className="workflow-step completed">
                <div className="step-circle">✓</div>

                <div>
                  <strong>Production</strong>
                  <small>Completed</small>
                </div>
              </div>

              <div className="workflow-step current">
                <div className="step-circle">3</div>

                <div>
                  <strong>Quality Check</strong>
                  <small>In Progress</small>
                </div>
              </div>

              <div className="workflow-step">
                <div className="step-circle">4</div>

                <div>
                  <strong>Delivery</strong>
                  <small>Pending</small>
                </div>
              </div>

            </div>
          </div>

        </div>

      </section>


      {/* ================= STATS ================= */}
      <section className="home-stats">

        <div className="stat-item">
          <h2>500+</h2>
          <p>Workflows<br />Managed</p>
        </div>

        <div className="stat-item">
          <h2>120+</h2>
          <p>Industrial<br />Teams</p>
        </div>

        <div className="stat-item">
          <h2>98%</h2>
          <p>Process<br />Efficiency</p>
        </div>

        <div className="stat-item">
          <h2>24/7</h2>
          <p>Workflow<br />Visibility</p>
        </div>

      </section>


      {/* ================= HOW IT WORKS ================= */}
      <section className="how-it-works">

        <div className="how-it-works-header">

          <p>HOW IT WORKS</p>

          <h2>
            From Planning to
            <span> Completion.</span>
          </h2>

          <p>
            Manage every stage of your industrial workflow
            through one centralized platform.
          </p>

        </div>


        <div className="process-grid">

          <div className="process-card">
            <div className="process-number">01</div>

            <h3>Plan</h3>

            <p>
              Create and organize your workflow,
              assign tasks, and define production
              requirements.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">02</div>

            <h3>Execute</h3>

            <p>
              Coordinate teams and monitor ongoing
              operations throughout the production
              process.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">03</div>

            <h3>Monitor</h3>

            <p>
              Track progress, identify delays, and
              maintain complete visibility of your
              workflow.
            </p>
          </div>


          <div className="process-card">
            <div className="process-number">04</div>

            <h3>Complete</h3>

            <p>
              Complete quality checks and finalize
              the workflow with accurate records
              and reporting.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}

export default Home;