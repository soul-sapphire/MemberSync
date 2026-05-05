const nodemailer = require('nodemailer');

// Using environment variables for credentials
// To set locally: firebase functions:config:set mail.user="myemail@gmail.com" mail.pass="mypassword"
// or use process.env if loaded via dotenv. For Firebase V2, it's process.env
const mailUser = process.env.MAIL_USER || 'demo@membersync.com';
const mailPass = process.env.MAIL_PASS || 'demopassword';

// Mock transporter if no credentials (so it doesn't crash during dev/testing)
const createTransporter = () => {
  if (mailUser === 'demo@membersync.com') {
    return {
      sendMail: async (options) => {
        console.log(`[MOCK EMAIL] To: ${options.to} | Subject: ${options.subject}`);
        return { messageId: 'mock-id' };
      }
    };
  }
  
  return nodemailer.createTransport({
    service: 'gmail', // or configured SMTP
    auth: {
      user: mailUser,
      pass: mailPass
    }
  });
};

const transporter = createTransporter();

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"MemberSync System" <${mailUser}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
};

exports.sendExpiryWarningEmail = async (email, name, daysLeft) => {
  return sendEmail({
    to: email,
    subject: 'Action Required: Membership Expiring Soon',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your membership is expiring in <strong>${daysLeft} days</strong>.</p>
      <p>Please log in to your portal to renew your membership and avoid any interruption to your benefits.</p>
      <br/>
      <p>Thank you,<br/>The MemberSync Team</p>
    `
  });
};

exports.sendPaymentSuccessEmail = async (email, name, amount) => {
  return sendEmail({
    to: email,
    subject: 'Payment Receipt: Thank You!',
    html: `
      <h2>Hello ${name},</h2>
      <p>We have successfully received your payment of <strong>$${amount}</strong>.</p>
      <p>Your membership status has been updated. You can view your receipt in the portal.</p>
      <br/>
      <p>Thank you,<br/>The MemberSync Team</p>
    `
  });
};

exports.sendSuspensionEmail = async (email, name, reason) => {
  return sendEmail({
    to: email,
    subject: 'Important: Membership Suspended',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your membership has been suspended for the following reason:</p>
      <p><em>${reason}</em></p>
      <p>Please contact an administrator to resolve this issue.</p>
      <br/>
      <p>Thank you,<br/>The MemberSync Team</p>
    `
  });
};

exports.sendApprovalEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: 'Welcome! Membership Approved',
    html: `
      <h2>Hello ${name},</h2>
      <p>Great news! Your membership application has been approved.</p>
      <p>You can now log in and access all member benefits.</p>
      <br/>
      <p>Welcome aboard,<br/>The MemberSync Team</p>
    `
  });
};
