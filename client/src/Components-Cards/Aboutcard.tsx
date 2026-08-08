interface AboutCardProps {
  title: string;
  description: string;
  number: string;
}

export default function AboutCard({
  title,
  description,
  number,
}: AboutCardProps) {
  return (
    <div className="about-card">
      <div className="about-card-number">
        {number}
      </div>

      <div className="about-card-content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <div className="about-card-line" />
    </div>
  );
}