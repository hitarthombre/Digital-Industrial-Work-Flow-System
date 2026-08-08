import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LOGO */}
        <Link to="/" className="logo">
          DIWS
        </Link>

        {/* NAVIGATION */}
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/features">Features</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/terms">Terms</Link>
        </div>

        {/* CTA */}
        <Link to="/pricing" className="nav-button">
          Get Started
        </Link>

      </div>
    </nav>
  );
}

export default Navbar;