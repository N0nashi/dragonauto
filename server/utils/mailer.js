const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: process.env.YANDEX_EMAIL,
    pass: process.env.YANDEX_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

transporter.verify((err) => {
  if (err) console.error("SMTP ошибка:", err.message);
  else     console.log("SMTP соединение успешно");
});

/**
 * @param {{ to: string, subject: string, text: string }} opts
 */
async function sendMail({ to, subject, text }) {
  return transporter.sendMail({
    from: `"DragonAuto" <${process.env.YANDEX_EMAIL}>`,
    to,
    subject,
    text,
  });
}

module.exports = { sendMail };
