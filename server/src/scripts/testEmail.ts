import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import nodemailer from 'nodemailer';

// Set IPv4 preference
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const resendApiKey = process.env.RESEND_API_KEY;
const targetEmail = process.argv[2] || 'moretrupti546@gmail.com';

console.log('=== DIWS Email Dispatch Diagnostic Test ===');
console.log(`Target Email: ${targetEmail}`);
console.log(`Resend API Key: ${resendApiKey ? '****** (configured)' : 'MISSING'}`);
console.log(`SMTP Host: ${smtpHost}:${smtpPort}`);
console.log(`SMTP User: ${smtpUser}`);

async function runTest() {
  // Step 1: Test Resend HTTPS API (Port 443)
  if (resendApiKey) {
    console.log('\n--- Step 1: Testing Resend HTTPS API (Port 443) ---');
    try {
      const resendFrom = process.env.RESEND_FROM || "diws <onboarding@resend.dev>";
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [targetEmail],
          subject: "DIWS Notification Test via Resend API",
          text: `Hello! This is a test email sent from DIWS backend using Resend HTTPS API to ${targetEmail}.`,
          html: `<div style="font-family: sans-serif; padding: 20px; border: 1px solid #4f46e5; border-radius: 8px;">
            <h2 style="color: #4f46e5;">DIWS Resend Email Test ✅</h2>
            <p>Your Resend API Key is working successfully!</p>
            <p><b>Target Email:</b> ${targetEmail}</p>
            <p><b>Timestamp:</b> ${new Date().toISOString()}</p>
          </div>`,
        }),
      });

      if (response.ok) {
        const resData: any = await response.json();
        console.log(`✅ Email sent successfully via Resend HTTPS API! Email ID: ${resData.id}`);
        return;
      } else {
        const errText = await response.text();
        console.error(`❌ Resend API Error: ${errText}`);
      }
    } catch (resendErr: any) {
      console.error(`❌ Resend API Exception: ${resendErr.message}`);
    }
  }

  // 1. Test DNS IPv4 resolution
  console.log('\n--- Step 1: DNS IPv4 Resolution ---');
  try {
    const ips = await dns.promises.resolve4(smtpHost);
    console.log(`DNS IPv4 addresses for ${smtpHost}:`, ips);
  } catch (err: any) {
    console.error(`DNS resolution failed for ${smtpHost}: ${err.message}`);
  }

  // 2. Test Nodemailer with Port 587 + family: 4
  console.log('\n--- Step 2: Testing SMTP (Port 587 / STARTTLS with family: 4) ---');
  try {
    const transporter587 = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    } as nodemailer.TransportOptions);

    console.log('Verifying connection to 587...');
    await transporter587.verify();
    console.log('✅ Port 587 connection verified successfully!');

    console.log('Sending test email via Port 587...');
    const info = await transporter587.sendMail({
      from: `"DIWS Test" <${smtpUser}>`,
      to: 'hitarththombre@gmail.com',
      subject: 'DIWS Local Test Email (Port 587)',
      text: 'This is a test email sent from DIWS local backend to verify SMTP configuration.',
    });
    console.log('✅ Test email sent via Port 587! Message ID:', info.messageId);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Port 587 failed:', err.message);
    if (err.code) console.error('Error Code:', err.code);
    if (err.command) console.error('Command:', err.command);
  }

  // 3. Test Nodemailer with Port 465 (SSL/TLS) + family: 4
  console.log('\n--- Step 3: Testing SMTP Fallback (Port 465 / Direct SSL with family: 4) ---');
  try {
    const transporter465 = nodemailer.createTransport({
      host: smtpHost,
      port: 465,
      secure: true,
      family: 4,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    } as nodemailer.TransportOptions);

    console.log('Verifying connection to 465...');
    await transporter465.verify();
    console.log('✅ Port 465 connection verified successfully!');

    console.log('Sending test email via Port 465...');
    const info = await transporter465.sendMail({
      from: `"DIWS Test" <${smtpUser}>`,
      to: 'hitarththombre@gmail.com',
      subject: 'DIWS Local Test Email (Port 465)',
      text: 'This is a test email sent from DIWS local backend to verify SMTP configuration via SSL Port 465.',
    });
    console.log('✅ Test email sent via Port 465! Message ID:', info.messageId);
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Port 465 failed:', err.message);
    if (err.code) console.error('Error Code:', err.code);
    if (err.command) console.error('Command:', err.command);
  }
}

runTest();
