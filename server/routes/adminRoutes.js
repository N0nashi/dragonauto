const express = require("express");
const router  = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const isModerator    = require("../middleware/isModerator");
const db   = require("../db");
const { sendMail } = require("../utils/mailer");

// POST /api/admin/send-email
router.post("/send-email", authMiddleware, isModerator, async (req, res) => {
  const { to, subject, text } = req.body;
  if (!to || !subject || !text)
    return res.status(400).json({ message: "Все поля обязательны" });
  try {
    await sendMail({ to, subject, text });
    res.json({ message: "Письмо успешно отправлено" });
  } catch (err) {
    console.error("Ошибка отправки письма:", err);
    res.status(500).json({ message: "Не удалось отправить письмо" });
  }
});

module.exports = router;
