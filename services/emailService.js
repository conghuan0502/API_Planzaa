const SibApiV3Sdk = require('@getbrevo/brevo');

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
const apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email using Brevo
 * @param {string} email - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} otp - OTP code
 * @returns {Promise} Brevo API response
 */
const sendOTPEmail = async (email, name, otp) => {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

  sendSmtpEmail.sender = {
    email: process.env.EMAIL_FROM,
    name: 'Event Management App'
  };

  sendSmtpEmail.to = [
    {
      email: email,
      name: name
    }
  ];

  sendSmtpEmail.subject = 'Reset Your Password - OTP Code';

  sendSmtpEmail.htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
        }
        .header {
          background-color: #4CAF50;
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 5px 5px 0 0;
        }
        .content {
          background-color: white;
          padding: 30px;
          border-radius: 0 0 5px 5px;
        }
        .otp-code {
          font-size: 32px;
          font-weight: bold;
          color: #4CAF50;
          text-align: center;
          padding: 20px;
          background-color: #f0f0f0;
          border-radius: 5px;
          margin: 20px 0;
          letter-spacing: 5px;
        }
        .warning {
          color: #f44336;
          font-size: 14px;
          margin-top: 20px;
        }
        .footer {
          text-align: center;
          margin-top: 20px;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Use the following OTP code to complete the password reset process:</p>

          <div class="otp-code">${otp}</div>

          <p>This code will expire in <strong>10 minutes</strong>.</p>

          <p class="warning">
            <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your account is safe.
          </p>

          <p>For security reasons, never share this code with anyone.</p>

          <p>Best regards,<br>Event Management Team</p>
        </div>
        <div class="footer">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};
