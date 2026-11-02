const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendEmail = async ({
  to,
  subject,
  html,
  fromName = "School App",
  attachments,
}) => {
  await transporter.sendMail({
    from: `"${String(fromName).replace(/["\r\n]/g, "")}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    ...(attachments?.length && { attachments }),
  });
};

exports.sendPasswordResetEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"School App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

exports.sendVerificationEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"School App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
