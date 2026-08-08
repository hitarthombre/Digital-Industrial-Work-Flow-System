import React from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import '../custom-ui.css';

export default function Contact() {
  return (
    <div className="diws-container">
      <div className="diws-text-center">
        <h1 className="diws-page-title">Contact Us</h1>
        <p className="diws-page-subtitle">We'd love to hear from you. Get in touch with our team.</p>
      </div>

      <div className="diws-grid diws-grid-2">
        <Card>
          <h2 className="diws-form-title diws-mt-4">Send us a Message</h2>
          <form className="diws-mt-6" onSubmit={(e) => e.preventDefault()}>
            <Input label="Full Name" id="name" type="text" placeholder="John Doe" required />
            <Input label="Email Address" id="email" type="email" placeholder="john@example.com" required />
            <div className="diws-form-group">
              <label htmlFor="message" className="diws-label">Message</label>
              <textarea 
                id="message" 
                rows={4} 
                className="diws-input" 
                placeholder="How can we help?"
                required
              ></textarea>
            </div>
            <Button type="submit" fullWidth>Send Message</Button>
          </form>
        </Card>

        <div className="diws-flex diws-flex-col diws-gap-4">
          <Card>
            <h3 className="diws-page-subtitle" style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Global Headquarters</h3>
            <p className="diws-text-muted">123 Industrial Way<br/>Tech District, San Francisco<br/>CA 94107, USA</p>
          </Card>
          <Card>
            <h3 className="diws-page-subtitle" style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Contact Support</h3>
            <p className="diws-text-muted">Email: support@diws.example.com<br/>Phone: +1 (555) 123-4567</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
