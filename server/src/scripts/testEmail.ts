import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';
import nodemailer from 'nodemailer';

// Set IPv4 preference
dns.setDefaultResultOrder('ipv4first');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

console.log('=== DIWS Local SMTP Diagnostic Test ===');
console.log(`SMTP Host: ${smtpHost}`);
console.log(`SMTP Port: ${smtpPort}`);
console.log(`SMTP User: ${smtpUser}`);
console.log(`SMTP Pass: ${smtpPass ? '****** (configured)' : 'MISSING'}`);

async function runTest() {
  if (!smtpUser || !smtpPass) {
    console.error('ERROR: SMTP credentials missing in .env');
    process.exit(1);
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
