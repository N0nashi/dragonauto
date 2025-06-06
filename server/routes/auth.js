const express = require("express");
const router = express.Router();
const bcryptjs = require("bcryptjs");
const db = require("../db");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { uploadMiddleware } = require("./upload");

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

// 📌 Роут: Регистрация
router.post("/register", uploadMiddleware, async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    const existing = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Пользователь с таким email уже существует" });
    }

    let photoUrl = null;
    if (req.file) {
      photoUrl = `/uploads/avatars/${req.file.filename}`;
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const result = await db.query(
      `INSERT INTO users (email, password, first_name, last_name, photo_url, is_verified)
       VALUES ($1, $2, $3, $4, $5, false) RETURNING id, email`,
      [email, hashedPassword, first_name, last_name, photoUrl]
    );

    const user = result.rows[0];

    // Генерация кода подтверждения
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 минут

    // Удаляем старые коды
    await db.query("DELETE FROM password_resets WHERE email = $1", [email]);

    // Сохраняем новый код
    await db.query(`
      INSERT INTO password_resets (email, code, expires_at)
      VALUES ($1, $2, to_timestamp($3 / 1000.0))
    `, [email, code, expires]);

    // Настройка SMTP Яндекс
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

    // Отправка письма
    await transporter.sendMail({
      from: `"DragonAuto" <${process.env.YANDEX_EMAIL}>`,
      to: email,
      subject: "Код подтверждения email",
      text: `Ваш код подтверждения: ${code}. Он действителен в течение 10 минут.`,
    });

    console.log(`Код подтверждения ${code} отправлен на ${email}`);

    res.json({ message: "Регистрация успешна. Код подтверждения отправлен на email", requiresVerification: true });

  } catch (error) {
    console.error("Ошибка регистрации:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 📬 Роут: Подтверждение email по коду
router.post("/verify-email", async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM password_resets WHERE email = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1",
      [email, code]
    );

    const entry = result.rows[0];

    if (!entry) {
      return res.status(400).json({ error: "Неверный код" });
    }

    if (new Date(entry.expires_at) < new Date()) {
      return res.status(400).json({ error: "Срок действия кода истёк" });
    }

    // Обновляем статус пользователя
    await db.query("UPDATE users SET is_verified = TRUE WHERE email = $1", [email]);

    // Опционально: удаляем использованный код
    await db.query("DELETE FROM password_resets WHERE email = $1", [email]);

    res.json({ message: "Email успешно подтверждён" });

  } catch (error) {
    console.error("Ошибка подтверждения email:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 🔑 Роут: Авторизация
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    if (!user) return res.status(400).json({ error: "Неверный email или пароль" });

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Неверный email или пароль" });

    if (!user.is_verified) {
      return res.status(403).json({ error: "Email не подтверждён" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Ошибка входа:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// 📧 Роут: Забыли пароль — отправка кода
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email обязателен" });

  try {
    const userCheck = await db.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: "Пользователь с таким email не найден" });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 минут

    // Удаляем старые коды
    await db.query("DELETE FROM password_resets WHERE email = $1", [email]);

    // Сохраняем новый код
    await db.query(`
      INSERT INTO password_resets (email, code, expires_at)
      VALUES ($1, $2, to_timestamp($3 / 1000.0))
    `, [email, code, expires]);

    // Настройка SMTP Яндекс
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

    // Отправка письма
    await transporter.sendMail({
      from: `"DragonAuto" <${process.env.YANDEX_EMAIL}>`,
      to: email,
      subject: "Код восстановления пароля",
      text: `Ваш код восстановления: ${code}. Он действителен в течение 10 минут.`,
    });

    console.log(`Код восстановления ${code} отправлен на ${email}`);
    res.json({ message: "Код восстановления отправлен на email" });

  } catch (error) {
    console.error("Ошибка в /forgot-password:", error);
    res.status(500).json({ error: "Произошла ошибка при отправке кода" });
  }
});

// 🔐 Роут: Сброс пароля по коду
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const result = await db.query(
      "SELECT * FROM password_resets WHERE email = $1 AND code = $2 ORDER BY created_at DESC LIMIT 1",
      [email, otp]
    );

    const entry = result.rows[0];

    if (!entry) {
      return res.status(400).json({ error: "Неверный код" });
    }

    if (new Date(entry.expires_at) < new Date()) {
      return res.status(400).json({ error: "Код истёк" });
    }

    const hashedPassword = await bcryptjs.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE email = $2", [hashedPassword, email]);

    await db.query("DELETE FROM password_resets WHERE email = $1", [email]);

    res.json({ message: "Пароль успешно обновлён" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;