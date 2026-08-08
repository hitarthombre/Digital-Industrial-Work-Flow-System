interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
}

function Pricingcard({
  name,
  price,
  description,
  features,
  popular = false,
}: PricingCardProps) {
  return (
    <div className={`pricing-card ${popular ? "pricing-card-popular" : ""}`}>
      
      {popular && (
        <div className="pricing-popular-badge">
          MOST POPULAR
        </div>
      )}

      <div className="pricing-card-content">

        <h3>{name}</h3>

        <div className="pricing-price">
          <span>{price}</span>
          <small>/month</small>
        </div>

        <p className="pricing-description">
          {description}
        </p>

        <div className="pricing-includes">
          <p>Includes:</p>

          <ul>
            {features.map((feature, index) => (
              <li key={index}>
                <span>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button className="pricing-button">
          Get Started
        </button>

      </div>
    </div>
  );
}

export default Pricingcard;