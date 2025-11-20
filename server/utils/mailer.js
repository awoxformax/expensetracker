const nodemailer = require("nodemailer");

let transporter;
let transporterInitialized = false;

function ensureTransporter() {
  if (transporterInitialized) {
    return transporter;
  }
  transporterInitialized = true;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[Mailer] SMTP details missing. Verification codes will be logged to console."
    );
    transporter = null;
    return transporter;
  }

  const secure =
    typeof SMTP_SECURE !== "undefined"
      ? SMTP_SECURE === "true" || SMTP_SECURE === "1"
      : Number(SMTP_PORT) === 465;

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

async function sendSignupVerificationEmail(email, code) {
  const mailer = ensureTransporter();
  const from =
    process.env.MAIL_FROM ||
    `Expense Tracker <no-reply@${process.env.APP_DOMAIN || "expensetracker.local"}>`;

  const message = {
    to: email,
    from,
    subject: "ExpenseTracker - Email təsdiq kodu",
    text: `Salam,\n\nQeydiyyatı tamamlamaq üçün təsdiq kodun: ${code}\nBu kod 10 dəqiqə ərzində etibarlıdır.\n\nƏgər bu tələbi sən göndərməmisənsə, xahiş edirik görməzlikdən gəl.\n`,
    html: `<p>Salam,</p><p>Qeydiyyatı tamamlamaq üçün təsdiq kodun:</p><p style="font-size:28px;margin:16px 0;"><strong>${code}</strong></p><p>Bu kod 10 dəqiqə ərzində etibarlıdır.</p><p>Əgər bu tələbi sən göndərməmisənsə, xahiş edirik görməzlikdən gəl.</p>`,
  };

  if (!mailer) {
    console.log(
      `[Mailer disabled] Verification code for ${email}: ${code}`
    );
    return;
  }

  await mailer.sendMail(message);
}

module.exports = {
  sendSignupVerificationEmail,
};
