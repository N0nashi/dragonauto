const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const isModerator = require("../middleware/isModerator");
const db = require("../db");
const nodemailer = require("nodemailer");
require("dotenv").config(); // ← обязательно подключи dotenv

// Настройка почтового транспортера для Yandex
const transporter = nodemailer.createTransport({
  host: "smtp.yandex.ru",
  port: 465,
  secure: true,
  auth: {
    user: process.env.YANDEX_EMAIL,
    pass: process.env.YANDEX_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});


// Проверка подключения
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP ошибка:", error);
  } else {
    console.log("SMTP соединение успешно");
  }
});

// ➕ Маршрут отправки писем
router.post("/send-email", authMiddleware, isModerator, async (req, res) => {
  const { to, subject, text } = req.body;

  if (!to || !subject || !text) {
    return res.status(400).json({ message: "Все поля обязательны" });
  }

  try {
    await transporter.sendMail({
      from: `"DragonAuto" <${process.env.YANDEX_EMAIL}>`,
      to,
      subject,
      text,
    });

    res.json({ message: "Письмо успешно отправлено" });
  } catch (error) {
    console.error("Ошибка отправки письма:", error);
    res.status(500).json({ message: "Не удалось отправить письмо" });
  }
});

module.exports = router;
