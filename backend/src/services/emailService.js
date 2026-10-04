const transporter = require('../config/nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[Email Mock]: To: ${to} | Subject: ${subject}`);
      return { success: true, mock: true };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Society Management" <no-reply@society.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent]: Message ID: ${info.messageId}`);
    return { success: true, info };
  } catch (error) {
    console.error(`[Email Service Error]: ${error.message}`);
    // Non-blocking error: return gracefully
    return { success: false, error: error.message };
  }
};

const sendPaymentReceiptEmail = async (user, payment, flat) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #00b4d8;">Society Maintenance Payment Receipt</h2>
      <p>Dear ${user.fullName},</p>
      <p>Thank you for your payment. Your transaction has been completed successfully.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Flat:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${flat.flatNumber}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Paid:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">₹${payment.totalPaid}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Transaction ID:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${payment.transactionId}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(payment.paymentDate).toLocaleDateString()}</td></tr>
      </table>
      <p style="margin-top: 20px;">Regards,<br/><strong>Society Management Admin</strong></p>
    </div>
  `;
  return await sendEmail({ to: user.email, subject: `Payment Receipt - ${payment.transactionId}`, html });
};

module.exports = { sendEmail, sendPaymentReceiptEmail };
