import AboutCard from "../Components-Cards/Aboutcard";

export default function About() {
  return (
    <main className="about-page">

      {/* =========================
          HERO
      ========================= */}

      <section className="about-hero">

        <div className="about-hero-content">

          <span className="about-eyebrow">
            ABOUT DIWS
          </span>

          <h1>
            Building better
            <span> industrial workflows.</span>
          </h1>

          <p>
            The Digital Industrial Work Flow System is designed
            to simplify complex industrial operations through
            intelligent, connected and reliable workflows.
          </p>

        </div>

      </section>


      {/* =========================
          VISION & MISSION
      ========================= */}

      <section className="about-cards-section">

        <div className="section-heading">

          <span className="about-eyebrow">
            WHAT DRIVES US
          </span>

          <h2>
            Designed around
            <span> real industrial needs.</span>
          </h2>

        </div>


        <div className="about-cards-grid">

          <AboutCard
            number="01"
            title="Our Vision"
            description="To create a connected industrial environment where workflows are transparent, efficient and easy to manage."
          />

          <AboutCard
            number="02"
            title="Our Mission"
            description="To provide reliable digital tools that simplify operations, improve collaboration and help industries make better decisions."
          />

          <AboutCard
            number="03"
            title="Our Approach"
            description="We combine practical industrial workflows with modern technology to build solutions that are simple, scalable and dependable."
          />

        </div>

      </section>


      {/* =========================
          CLOSING SECTION
      ========================= */}

      <section className="about-closing">

        <div>

          <span className="about-eyebrow">
            OUR PHILOSOPHY
          </span>

          <h2>
            Simple systems.
            <br />
            <span>Meaningful results.</span>
          </h2>

        </div>

        <p>
          We believe technology should make industrial
          operations clearer, not more complicated.
        </p>

      </section>

    </main>
  );
}