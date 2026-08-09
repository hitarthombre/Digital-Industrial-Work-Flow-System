import { Card } from '../components/Card';
import '../custom-ui.css';

export default function Privacy() {
  return (
    <div className="diws-container">
      <div className="diws-text-center">
        <h1 className="diws-page-title">Privacy Policy</h1>
        <p className="diws-page-subtitle">Last updated: August 2026</p>
      </div>

      <Card className="diws-mt-6">
        <div className="diws-text-content">
          <p>
            At Digital Industrial Work Flow System (DIWS), we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our enterprise application.
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We may collect personal identification information from users in a variety of ways, including, but not limited to, when users visit our site, register on the site, place an order, fill out a form, and in connection with other activities, services, features or resources we make available on our Site.
          </p>

          <h2>2. How We Use Collected Information</h2>
          <p>
            DIWS may collect and use users personal information for the following purposes:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '2rem', marginBottom: '1rem' }}>
            <li>To improve customer service</li>
            <li>To personalize user experience</li>
            <li>To improve our Site</li>
            <li>To process payments</li>
            <li>To send periodic emails regarding order updates or system notifications</li>
          </ul>

          <h2>3. How We Protect Your Information</h2>
          <p>
            We adopt appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information, username, password, transaction information and data stored on our Site.
          </p>

          <h2>4. Sharing Your Personal Information</h2>
          <p>
            We do not sell, trade, or rent users personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates and advertisers for the purposes outlined above.
          </p>

          <h2>5. Contacting Us</h2>
          <p>
            If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at privacy@diws.example.com.
          </p>
        </div>
      </Card>
    </div>
  );
}
