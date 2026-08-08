type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export default function Featurecard({
  icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div className="feature-card-icon">
        {icon}
      </div>

      <div className="feature-card-content">
        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <div className="feature-card-line"></div>
    </div>
  );
}