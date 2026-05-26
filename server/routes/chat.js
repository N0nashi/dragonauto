const express = require("express");
const router = express.Router();
const db = require("../db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const isModerator = require("../middleware/isModerator");

const BOT_ENTRIES = [
  {
    keywords: ["привет", "здравствуй", "здравствуйте", "добрый день", "добрый вечер", "доброе утро", "hello", "hi"],
    response:    "Привет! 👋 Чем могу помочь? Вы можете спросить о доставке, ценах, как оформить заказ, запчастях или контактах.",
    response_en: "Hello! 👋 How can I help you? You can ask about delivery, prices, how to order, spare parts or contacts.",
  },
  {
    keywords: ["доставка", "доставку", "доставке", "доставки", "доставкой", "сроки", "долго", "когда приедет", "везут", "везти", "delivery", "shipping", "how long", "arrive"],
    response:    "🚚 Доставка из Китая занимает от 30 до 60 дней в зависимости от способа (морской или автомобильный). Запчасти доставляем за 2–4 недели. Мы работаем только с проверенными логистическими партнёрами.",
    response_en: "🚚 Delivery from China takes 30–60 days depending on the method (sea or road). Spare parts are delivered in 2–4 weeks. We only work with trusted logistics partners.",
  },
  {
    keywords: ["цена", "стоимость", "сколько стоит", "оплата", "платить", "деньги", "бюджет", "price", "cost", "how much", "payment"],
    response:    "💰 Цены указаны в каталоге. После согласования заказа менеджер предоставит точный расчёт с учётом доставки и таможенного оформления. Принимаем банковский перевод.",
    response_en: "💰 Prices are listed in the catalog. After confirming your order, a manager will provide an exact quote including delivery and customs clearance. We accept bank transfers.",
  },
  {
    keywords: ["как заказать", "оформить заказ", "купить", "хочу купить", "как купить", "заказать автомобиль", "how to order", "order a car", "buy a car", "purchase"],
    response:    "📋 Как оформить заказ:\n1. Выберите авто в каталоге или оставьте заявку\n2. Менеджер свяжется в течение 24 ч\n3. Согласуем условия и внесёте предоплату\n4. Мы организуем доставку под ключ",
    response_en: "📋 How to order:\n1. Pick a car from the catalog or submit a request\n2. A manager will contact you within 24 h\n3. We agree on terms and you pay a deposit\n4. We handle the full delivery process",
  },
  {
    keywords: ["гарантия", "документы", "птс", "таможня", "растаможка", "легально", "warranty", "documents", "customs", "legal"],
    response:    "📄 Все автомобили проходят полную таможенную очистку. Вы получаете ПТС, СТС и договор купли-продажи. Мы несём ответственность за каждый автомобиль на всех этапах.",
    response_en: "📄 All vehicles go through full customs clearance. You receive all required documents and a purchase agreement. We are responsible for every car at every stage.",
  },
  {
    keywords: ["запчасть", "запчасти", "деталь", "детали", "запчастях", "spare part", "spare parts", "parts", "part"],
    response:    "🔧 Мы доставляем оригинальные и аналоговые запчасти для автомобилей из Китая, Японии и Кореи. Оставьте заявку в разделе «Запчасти» — менеджер подберёт нужную позицию.",
    response_en: "🔧 We deliver genuine and aftermarket parts for cars from China, Japan and Korea. Submit a request in the Spare Parts section — a manager will find the right part for you.",
  },
  {
    keywords: ["телефон", "контакт", "позвонить", "связаться", "адрес", "офис", "почта", "email", "contact", "phone", "address", "office"],
    response:    "📞 +7 (982) 290-00-86\n📧 nonashi@mail.ru\n📍 г. Челябинск, Салавата Юлаева д.29\n\nРаботаем пн–пт 9:00–18:00",
    response_en: "📞 +7 (982) 290-00-86\n📧 nonashi@mail.ru\n📍 Chelyabinsk, Salavata Yulaeva 29\n\nMon–Fri 9:00–18:00",
  },
  {
    keywords: ["марки", "бренды", "какие машины", "haval", "geely", "chery", "byd", "китайские", "brands", "models", "cars available", "what cars"],
    response:    "🚗 Работаем с авто из Китая, Японии и Кореи. Популярные китайские марки: Haval, Geely, Chery, BYD, Exeed, Li Auto. Весь ассортимент — в каталоге на сайте.",
    response_en: "🚗 We work with cars from China, Japan and Korea. Popular Chinese brands: Haval, Geely, Chery, BYD, Exeed, Li Auto. Full range is in the catalog.",
  },
  {
    keywords: ["кредит", "рассрочка", "лизинг", "ипотека", "credit", "installment", "leasing", "finance", "loan"],
    response:    "💳 Рассматриваем варианты через партнёрские банки. Уточните условия у менеджера — напишите «позвать менеджера» или позвоните: +7 (982) 290-00-86.",
    response_en: "💳 We offer financing options through partner banks. Ask a manager for details — type 'call manager' or call: +7 (982) 290-00-86.",
  },
  {
    keywords: ["помощь", "помоги", "не понимаю", "что умеешь", "что можешь", "help", "what can you do", "what do you know"],
    response:    "🤖 Я могу ответить на вопросы о:\n• Доставке и сроках\n• Ценах и оплате\n• Как оформить заказ\n• Гарантиях и документах\n• Запчастях\n• Контактах\n\nЕсли нужен живой менеджер — напишите «позвать менеджера»",
    response_en: "🤖 I can answer questions about:\n• Delivery and timelines\n• Prices and payment\n• How to order\n• Warranties and documents\n• Spare parts\n• Contacts\n\nFor a live manager — type 'call manager'",
  },
];

const ESCALATION_KEYWORDS = [
  "менеджер", "оператор", "человек", "живой", "позови", "позвать",
  "администратор", "сотрудник", "поговорить с", "связаться с", "хочу человека",
  "manager", "operator", "human", "agent", "real person", "speak to a manager",
  "talk to", "call manager", "i want to speak", "connect me",
];

function getBotResponse(message, lang) {
  const lower = message.toLowerCase();
  if (ESCALATION_KEYWORDS.some((k) => lower.includes(k))) return null;
  const useEn = lang === "en";
  for (const entry of BOT_ENTRIES) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return useEn ? (entry.response_en || entry.response) : entry.response;
    }
  }
  return useEn
    ? "Hmm, I didn't quite understand your question 🤔 Try rephrasing or type 'call manager' — a live specialist will reply personally."
    : "Хм, не совсем понял вопрос 🤔 Попробуйте переформулировать или напишите «позвать менеджера» — живой специалист ответит вам лично.";
}

async function extractUserId(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const decoded = jwt.verify(auth.split(" ")[1], process.env.JWT_SECRET);
    const r = await db.query("SELECT id FROM users WHERE id = $1", [decoded.id]);
    return r.rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

// POST /api/chat/start
router.post("/start", async (req, res) => {
  try {
    const { sessionToken, lang, forceNew } = req.body;
    const userId = await extractUserId(req);

    if (sessionToken) {
      const existing = await db.query(
        "SELECT * FROM chat_sessions WHERE session_token = $1",
        [sessionToken]
      );
      if (existing.rows.length > 0) {
        const s = existing.rows[0];
        if (forceNew) {
          await db.query("UPDATE chat_sessions SET status = 'closed' WHERE id = $1", [s.id]);
        } else if (s.status !== "closed") {
          if (userId && !s.user_id)
            await db.query("UPDATE chat_sessions SET user_id = $1 WHERE id = $2", [userId, s.id]);
          const msgs = await db.query(
            "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
            [s.id]
          );
          return res.json({ sessionToken, sessionId: s.id, status: s.status, messages: msgs.rows });
        }
      }
    }

    const newToken = crypto.randomBytes(32).toString("hex");
    const sess = await db.query(
      "INSERT INTO chat_sessions (session_token, user_id, status) VALUES ($1, $2, 'bot') RETURNING *",
      [newToken, userId]
    );
    const sessId = sess.rows[0].id;

    const welcome = lang === "en"
      ? "Hello! 👋 I'm the DragonAuto virtual assistant. I can help with questions about cars from China, delivery and spare parts. How can I help?"
      : "Привет! 👋 Я виртуальный помощник DragonAuto. Помогу ответить на вопросы об автомобилях из Китая, доставке и запчастях. Чем могу помочь?";
    await db.query(
      "INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, 'bot', $2)",
      [sessId, welcome]
    );
    const msgs = await db.query(
      "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessId]
    );
    res.json({ sessionToken: newToken, sessionId: sessId, status: "bot", messages: msgs.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/message", async (req, res) => {
  try {
    const { sessionToken, message, lang } = req.body;
    if (!sessionToken || !message?.trim())
      return res.status(400).json({ error: "Неверные параметры" });

    const sess = await db.query(
      "SELECT * FROM chat_sessions WHERE session_token = $1",
      [sessionToken]
    );
    if (!sess.rows.length) return res.status(404).json({ error: "Сессия не найдена" });
    const session = sess.rows[0];

    await db.query(
      "INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, 'user', $2)",
      [session.id, message.trim()]
    );
    await db.query("UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1", [session.id]);

    let newStatus = session.status;

    if (session.status !== "active") {
      const lower = message.toLowerCase();
      const wantsHuman = ESCALATION_KEYWORDS.some((k) => lower.includes(k));

      const isEn = lang === "en";
      if (wantsHuman || session.status === "pending") {
        if (session.status !== "pending") {
          await db.query("UPDATE chat_sessions SET status = 'pending' WHERE id = $1", [session.id]);
          newStatus = "pending";
          await db.query(
            "INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, 'bot', $2)",
            [session.id, isEn
              ? "Got it! 👤 Connecting you to a manager. Please wait — they will join shortly."
              : "Понял! 👤 Передаю вас менеджеру. Ожидайте — он подключится в ближайшее время."]
          );
        } else {
          await db.query(
            "INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, 'bot', $2)",
            [session.id, isEn
              ? "Your message has been received. The manager will reply soon. ⏳"
              : "Ваше сообщение получено. Менеджер скоро ответит. ⏳"]
          );
        }
      } else {
        const reply = getBotResponse(message, lang);
        if (reply) {
          await db.query(
            "INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, 'bot', $2)",
            [session.id, reply]
          );
        }
      }
    }

    const msgs = await db.query(
      "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [session.id]
    );
    const updSess = await db.query("SELECT status FROM chat_sessions WHERE id = $1", [session.id]);
    res.json({ messages: msgs.rows, status: updSess.rows[0].status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/poll", async (req, res) => {
  try {
    const { sessionToken, after } = req.query;
    if (!sessionToken) return res.status(400).json({ error: "Нет токена" });

    const sess = await db.query(
      "SELECT * FROM chat_sessions WHERE session_token = $1",
      [sessionToken]
    );
    if (!sess.rows.length) return res.status(404).json({ error: "Сессия не найдена" });

    const msgs = after
      ? await db.query(
          "SELECT * FROM chat_messages WHERE session_id = $1 AND id > $2 ORDER BY created_at ASC",
          [sess.rows[0].id, after]
        )
      : await db.query(
          "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
          [sess.rows[0].id]
        );

    res.json({ messages: msgs.rows, status: sess.rows[0].status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/chat/admin/tickets
router.get("/admin/tickets", authMiddleware, isModerator, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        cs.id, cs.status, cs.updated_at, cs.session_token,
        u.first_name, u.last_name, u.email,
        (SELECT message    FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) AS last_message,
        (SELECT created_at FROM chat_messages WHERE session_id = cs.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
        (SELECT COUNT(*)   FROM chat_messages WHERE session_id = cs.id AND sender = 'user' AND is_read = false)::int AS unread_count
      FROM chat_sessions cs
      LEFT JOIN users u ON u.id = cs.user_id
      WHERE cs.status IN ('pending', 'active')
      ORDER BY cs.updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.get("/admin/messages/:sessionId", authMiddleware, isModerator, async (req, res) => {
  try {
    const msgs = await db.query(
      "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [req.params.sessionId]
    );
    await db.query(
      "UPDATE chat_messages SET is_read = true WHERE session_id = $1 AND sender = 'user'",
      [req.params.sessionId]
    );
    res.json(msgs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.post("/admin/reply", authMiddleware, isModerator, async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message?.trim())
      return res.status(400).json({ error: "Неверные параметры" });

    const sess = await db.query("SELECT * FROM chat_sessions WHERE id = $1", [sessionId]);
    if (!sess.rows.length) return res.status(404).json({ error: "Сессия не найдена" });

    await db.query(
      "INSERT INTO chat_messages (session_id, sender, message) VALUES ($1, 'admin', $2)",
      [sessionId, message.trim()]
    );
    await db.query(
      "UPDATE chat_sessions SET status = 'active', updated_at = NOW() WHERE id = $1",
      [sessionId]
    );
    res.json({ message: "Отправлено" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

router.patch("/admin/close/:sessionId", authMiddleware, isModerator, async (req, res) => {
  try {
    await db.query(
      "UPDATE chat_sessions SET status = 'closed' WHERE id = $1",
      [req.params.sessionId]
    );
    res.json({ message: "Диалог закрыт" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
