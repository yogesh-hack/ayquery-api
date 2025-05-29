import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendCompanyAgentIdEmail = async (name, email, companyAgentId) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your AyQuery Company Agent ID is Ready",
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f3f4f6; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 5px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; font-size: 40px; margin-bottom: 20px;">🏢</div>
        <div style="background-color: #047857; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h2 style="font-size: 20px; font-weight: bold;">--- AyQuery Company Portal ---</h2>
          <p style="margin-top: 5px;">Welcome to AyQuery as a Verified Company</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <h3 style="font-size: 18px; font-weight: 600;">Hello, Owner of ${name}</h3>
          <p style="margin: 10px 0;">Your unique Company Agent ID has been successfully created:</p>
          <div style="border: 2px dashed #10b981; border-radius: 6px; padding: 12px; font-size: 24px; font-weight: bold; color: #059669;">
            ${companyAgentId}
          </div>
          <p style="font-size: 14px; color: #555; margin-top: 15px;">
            Please keep this ID safe. You will use it to manage your company-related actions on AyQuery.
          </p>
          <a href="#" style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px;">
            Go to Company Dashboard
          </a>
          <p style="font-size: 14px; color: #555; margin-top: 20px;">
            Need help? <a href="#" style="color: #059669; text-decoration: underline;">Contact support</a>
          </p>
          <p style="font-size: 14px; color: #555; margin-top: 15px;">
            Thank you,<br>The AyQuery Team
          </p>
        </div>
      </div>
    </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
