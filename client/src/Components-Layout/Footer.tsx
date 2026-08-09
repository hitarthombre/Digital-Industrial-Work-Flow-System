function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* TOP SECTION */}
        <div className="footer-top">
          
          {/* BRAND */}
          <div className="footer-brand">
            <h3>DIWS</h3>
            <p>
              Digital Industrial Work Flow System
            </p>
          </div>

          {/* LINKS */}
          <div className="footer-links">
            <a href="/about">About</a>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/terms">Terms</a>
          </div>

        </div>

        {/* BOTTOM SECTION */}
        <div className="footer-bottom">
          <p>© 2026 Digital Industrial Work Flow System. All rights reserved.</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;