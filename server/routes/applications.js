const express = require("express");
const router = express.Router();
const db = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const isModerator = require("../middleware/isModerator");
const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// Строгий лимит на создание заявок — по пользователю, чтобы нельзя было накликать сотню
const createApplicationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => (req.userId ? `u${req.userId}` : ipKeyGenerator(req)),
  message: { error: "Слишком много заявок за короткое время, подождите немного" },
});

function parseToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.split(",").map(s => s.trim()).filter(Boolean);
}


const CURRENT_YEAR = new Date().getFullYear();
const BOUNDS = {
  year:    { min: 1950, max: CURRENT_YEAR + 1 },
  price:   { min: 1,    max: 1_000_000_000 },
  mileage: { min: 0,    max: 2_000_000 },
  power:   { min: 0,    max: 2000 },
};
const MAX_TEXT_LEN = 50;
const MAX_DESC_LEN = 1000;
const MAX_ARRAY_LEN = 30;

// Число в пределах [min, max]
function numInRange(v, { min, max }) {
  if (v === undefined || v === null || v === "") return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
}

// Строка содержит хотя бы одну букву (марка/название не из одних цифр)
const hasLetter = (v) => /[a-zA-Zа-яА-ЯёЁ]/.test(String(v ?? ""));

// Возвращает текст ошибки или null
function validateApplication(type, b) {
  if (type === "car") {
    for (const [k, key] of [["year", "year"], ["price", "price"], ["mileage", "mileage"], ["power", "power"]]) {
      const from = b[`${key}_from_car`];
      const to   = b[`${key}_to_car`];
      if (!numInRange(from, BOUNDS[k]) || !numInRange(to, BOUNDS[k]))
        return `Поле «${key}» вне допустимого диапазона`;
      if (Number(from) > Number(to))
        return `Поле «${key}»: «от» больше «до»`;
    }
    for (const arr of [b.country_car, b.brand_car, b.model_car, b.gearbox_car, b.body_car, b.drive_car]) {
      const a = parseToArray(arr);
      if (a.length > MAX_ARRAY_LEN) return "Слишком много значений в поле";
      if (a.some(s => String(s).length > MAX_TEXT_LEN)) return "Слишком длинное значение в поле";
    }
    if (parseToArray(b.brand_car).some(s => !hasLetter(s)))
      return "Марка должна содержать буквы";
  } else {
    if (!numInRange(b.price_from_part, BOUNDS.price) || !numInRange(b.price_to_part, BOUNDS.price))
      return "Цена вне допустимого диапазона";
    if (Number(b.price_from_part) > Number(b.price_to_part))
      return "Цена: «от» больше «до»";
    for (const s of [b.part_name, b.brand_part, b.model_part, b.country_part, b.body_part]) {
      if (s != null && String(s).length > MAX_TEXT_LEN) return "Слишком длинное значение в поле";
    }
    if (!hasLetter(b.part_name)) return "Название должно содержать буквы";
    if (!hasLetter(b.brand_part)) return "Марка должна содержать буквы";
  }
  if (b.description != null && String(b.description).length > MAX_DESC_LEN)
    return "Слишком длинное описание";
  return null;
}

const TRANSITIONS = {
  "в обработке": { admin: ["в работе", "отменена"] },
  "в работе":    { admin: ["предложение", "отменена"] },
  "предложение": { admin: ["в работе", "отменена"], user: ["согласована"] },
  "согласована": { admin: ["выполнена", "отменена"] },
};

async function notifyUser(applicationId, type) {
  try {
    const r = await db.query("SELECT user_id FROM applications WHERE id = $1", [applicationId]);
    if (!r.rows[0]) return;
    await db.query(
      "INSERT INTO application_notifications (user_id, application_id, type) VALUES ($1, $2, $3)",
      [r.rows[0].user_id, applicationId, type]
    );
  } catch (e) {
    console.error("notifyUser error:", e.message);
  }
}

// POST /api/applications — создать заявку
router.post("/", authMiddleware, createApplicationLimiter, async (req, res) => {
  const userId = req.userId;
  const {
    type, description,
    country_car, brand_car, model_car,
    price_from_car, price_to_car,
    year_from_car, year_to_car, year_range_car,
    mileage_from_car, mileage_to_car,
    gearbox_car, body_car, drive_car,
    power_from_car, power_to_car,
    country_part, brand_part, model_part, part_name,
    price_from_part, price_to_part, body_part,
  } = req.body;

  if (!type || !["car", "part"].includes(type))
    return res.status(400).json({ error: "Некорректный тип заявки" });

  const boundsError = validateApplication(type, req.body);
  if (boundsError) return res.status(400).json({ error: boundsError });

  // Поставщик не может заказать собственный товар (админ/модератор — может, для отладки)
  const isStaff = req.userRole === "admin" || req.userRole === "moderator";
  const { source_item_id, source_item_type } = req.body;
  if (!isStaff && source_item_id && ["car", "part"].includes(source_item_type)) {
    try {
      const table = source_item_type === "car" ? "cars" : "parts";
      const own = await db.query(`SELECT supplier_id FROM ${table} WHERE id = $1`, [source_item_id]);
      if (own.rows[0]?.supplier_id === userId)
        return res.status(400).json({ error: "Нельзя заказать собственный товар" });
    } catch (e) {
      console.error("source item check error:", e.message);
    }
  }

  try {
    await db.query("BEGIN");

    const result = await db.query(
      "INSERT INTO applications (user_id, type, description, status) VALUES ($1,$2,$3,$4) RETURNING id",
      [userId, type, description || null, "в обработке"]
    );
    const applicationId = result.rows[0].id;

    if (type === "car") {
      const required = [
        { name: "country_car", value: country_car },
        { name: "brand_car", value: brand_car },
        { name: "price_from_car", value: price_from_car },
        { name: "price_to_car", value: price_to_car },
        { name: "year_from_car", value: year_from_car },
        { name: "year_to_car", value: year_to_car },
        { name: "mileage_from_car", value: mileage_from_car },
        { name: "mileage_to_car", value: mileage_to_car },
        { name: "gearbox_car", value: gearbox_car },
        { name: "body_car", value: body_car },
        { name: "drive_car", value: drive_car },
        { name: "power_from_car", value: power_from_car },
        { name: "power_to_car", value: power_to_car },
      ];
      const missing = required.filter(f => f.value === undefined || f.value === null || f.value === "");
      if (missing.length > 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({ error: "Не все поля заполнены", missingFields: missing.map(f => f.name) });
      }
      await db.query(
        `INSERT INTO car_applications (
          application_id, country_car, brand_car, model_car,
          price_from_car, price_to_car, year_from_car, year_to_car, year_range_car,
          mileage_from_car, mileage_to_car, gearbox_car, body_car, drive_car,
          power_from_car, power_to_car
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          applicationId,
          parseToArray(country_car) || null,
          parseToArray(brand_car) || null,
          parseToArray(model_car) || null,
          price_from_car || null, price_to_car || null,
          year_from_car || null, year_to_car || null, year_range_car || null,
          mileage_from_car || null, mileage_to_car || null,
          parseToArray(gearbox_car) || null,
          parseToArray(body_car) || null,
          parseToArray(drive_car) || null,
          power_from_car || null, power_to_car || null,
        ]
      );
    } else {
      const required = [
        { name: "country_part", value: country_part },
        { name: "brand_part", value: brand_part },
        { name: "model_part", value: model_part },
        { name: "part_name", value: part_name },
        { name: "price_from_part", value: price_from_part },
        { name: "price_to_part", value: price_to_part },
        { name: "body_part", value: body_part },
      ];
      const missing = required.filter(f => !f.value);
      if (missing.length > 0) {
        await db.query("ROLLBACK");
        return res.status(400).json({ error: "Не все поля заполнены", missingFields: missing.map(f => f.name) });
      }
      await db.query(
        `INSERT INTO part_applications (
          application_id, country_part, brand_part, model_part,
          part_name, price_from_part, price_to_part, body_part, description
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [applicationId, country_part, brand_part, model_part, part_name,
         price_from_part, price_to_part, body_part, description || null]
      );
    }

    await db.query("COMMIT");
    res.status(201).json({ message: "Заявка успешно создана", applicationId });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Ошибка создания заявки:", error.message);
    res.status(500).json({ error: "Ошибка сервера при создании заявки" });
  }
});

// GET /api/applications — заявки текущего пользователя
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.userId;
  try {
    const result = await db.query(
      `SELECT a.id, a.type, a.description, a.status, a.date, a.offered_price,
        a.matched_item_id, a.matched_item_type,
        CASE
          WHEN a.matched_item_type = 'car'
          THEN (SELECT row_to_json(mi) FROM (SELECT id, brand, model, year, price, photo_url, country, mileage, gearbox, drive, body, engine_power, description FROM cars WHERE id = a.matched_item_id) mi)
          WHEN a.matched_item_type = 'part'
          THEN (SELECT row_to_json(mi) FROM (SELECT id, part_name, price, photo_url, brand, model, year, body, country FROM parts WHERE id = a.matched_item_id) mi)
          ELSE NULL
        END AS matched_item,
        c.country_car, c.brand_car, c.model_car,
        c.price_from_car, c.price_to_car,
        c.year_from_car, c.year_to_car, c.year_range_car,
        c.mileage_from_car, c.mileage_to_car,
        c.gearbox_car, c.body_car, c.drive_car,
        c.power_from_car, c.power_to_car,
        p.country_part, p.brand_part, p.model_part,
        p.part_name, p.price_from_part, p.price_to_part, p.body_part
       FROM applications a
       LEFT JOIN car_applications c ON a.id = c.application_id
       LEFT JOIN part_applications p ON a.id = p.application_id
       WHERE a.user_id = $1
       ORDER BY a.date DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения заявок:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/applications/all — все активные заявки (модератор)
router.get("/all", authMiddleware, isModerator, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.id, a.user_id, a.type, a.status, a.date, a.offered_price,
         u.first_name, u.last_name, u.email
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.status NOT IN ('выполнена', 'отменена')
       ORDER BY a.date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Ошибка получения всех заявок:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/applications/:id — одна заявка
router.get("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });

  try {
    const matchedItemExpr = `
        a.matched_item_id, a.matched_item_type, a.matched_supplier_id, a.supplier_status,
        CASE
          WHEN a.matched_item_type = 'car'
          THEN (SELECT row_to_json(mi) FROM (SELECT id, brand, model, year, price, photo_url FROM cars  WHERE id = a.matched_item_id) mi)
          WHEN a.matched_item_type = 'part'
          THEN (SELECT row_to_json(mi) FROM (SELECT id, part_name, price, photo_url          FROM parts WHERE id = a.matched_item_id) mi)
          ELSE NULL
        END AS matched_item`;

    const base = `
      SELECT a.id, a.user_id, a.type, a.description, a.status, a.date, a.offered_price,
        ${matchedItemExpr},
        c.application_id, c.country_car, c.brand_car, c.model_car,
        c.price_from_car, c.price_to_car,
        c.year_from_car, c.year_to_car, c.year_range_car,
        c.mileage_from_car, c.mileage_to_car,
        c.gearbox_car, c.body_car, c.drive_car,
        c.power_from_car, c.power_to_car,
        p.country_part, p.brand_part, p.model_part,
        p.part_name, p.price_from_part, p.price_to_part, p.body_part
      FROM applications a
      LEFT JOIN car_applications c ON a.id = c.application_id
      LEFT JOIN part_applications p ON a.id = p.application_id`;

    const modQuery = `
      SELECT a.id, a.user_id, a.type, a.description, a.status, a.date, a.offered_price,
        u.email,
        ${matchedItemExpr},
        c.application_id, c.country_car, c.brand_car, c.model_car,
        c.price_from_car, c.price_to_car,
        c.year_from_car, c.year_to_car, c.year_range_car,
        c.mileage_from_car, c.mileage_to_car,
        c.gearbox_car, c.body_car, c.drive_car,
        c.power_from_car, c.power_to_car,
        p.country_part, p.brand_part, p.model_part,
        p.part_name, p.price_from_part, p.price_to_part, p.body_part
      FROM applications a
      LEFT JOIN car_applications c ON a.id = c.application_id
      LEFT JOIN part_applications p ON a.id = p.application_id
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.id = $1 LIMIT 1`;

    const result = (userRole === "moderator" || userRole === "admin")
      ? await db.query(modQuery, [applicationId])
      : await db.query(`${base} WHERE a.user_id = $1 AND a.id = $2 LIMIT 1`, [userId, applicationId]);

    if (result.rowCount === 0) return res.status(404).json({ error: "Заявка не найдена" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Ошибка получения заявки:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /api/applications/:id/status — смена статуса (модератор)
router.patch("/:id/status", authMiddleware, isModerator, async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  const { status, comment, offered_price } = req.body;

  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });
  if (!status) return res.status(400).json({ error: "Статус не указан" });

  try {
    const cur = await db.query("SELECT status FROM applications WHERE id = $1", [applicationId]);
    if (cur.rowCount === 0) return res.status(404).json({ error: "Заявка не найдена" });

    const currentStatus = cur.rows[0].status;
    const allowed = TRANSITIONS[currentStatus]?.admin ?? [];
    if (!allowed.includes(status)) {
      console.error(`[STATUS] Отклонён переход: appId=${applicationId}, currentStatus='${currentStatus}', requested='${status}', allowed=${JSON.stringify(allowed)}`);
      return res.status(400).json({ error: `Переход из "${currentStatus}" в "${status}" недопустим` });
    }

    if (status === "предложение" && offered_price != null) {
      const price = parseFloat(offered_price);
      if (isNaN(price) || price <= 0)
        return res.status(400).json({ error: "Некорректная цена предложения" });
      await db.query(
        "UPDATE applications SET status = $1, offered_price = $2 WHERE id = $3",
        [status, price, applicationId]
      );
    } else {
      await db.query("UPDATE applications SET status = $1 WHERE id = $2", [status, applicationId]);
    }

    if (comment?.trim()) {
      const nameR = await db.query(
        "SELECT first_name, last_name FROM users WHERE id = $1", [req.userId]
      );
      const name = nameR.rows[0]
        ? `${nameR.rows[0].first_name} ${nameR.rows[0].last_name}`.trim()
        : "Менеджер";
      await db.query(
        "INSERT INTO application_comments (application_id, author_role, author_name, message) VALUES ($1,'admin',$2,$3)",
        [applicationId, name, comment.trim()]
      );
    }

    await notifyUser(applicationId, "status_change");

    // Если статус = 'предложение' и есть привязанный поставщик — уведомить его
    if (status === "предложение") {
      const matchRow = await db.query(
        "SELECT matched_supplier_id, offered_price FROM applications WHERE id = $1",
        [applicationId]
      );
      if (matchRow.rows[0]?.matched_supplier_id) {
        const price = matchRow.rows[0].offered_price;
        await db.query(
          `INSERT INTO supplier_messages (application_id, sender_role, sender_name, message)
           VALUES ($1, 'admin', 'Система', $2)`,
          [
            applicationId,
            `📋 Модератор направил предложение клиенту по заявке #${applicationId}` +
            (price ? ` на сумму ${Number(price).toLocaleString("ru-RU")} ₽` : "") +
            `.\nОжидайте подтверждения клиента.`
          ]
        );
      }
    }
    res.json({ message: "Статус обновлён", newStatus: status });
  } catch (err) {
    console.error("Ошибка смены статуса:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /api/applications/:id/confirm-offer — пользователь принимает предложение
router.patch("/:id/confirm-offer", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });

  try {
    const cur = await db.query(
      "SELECT status, user_id FROM applications WHERE id = $1", [applicationId]
    );
    if (cur.rowCount === 0) return res.status(404).json({ error: "Заявка не найдена" });
    if (cur.rows[0].user_id !== userId) return res.status(403).json({ error: "Нет доступа" });
    if (cur.rows[0].status !== "предложение")
      return res.status(400).json({ error: "Заявка не в статусе 'предложение'" });

    await db.query("UPDATE applications SET status = 'согласована' WHERE id = $1", [applicationId]);

    // Если к заявке привязан поставщик — отправить системное сообщение в переписку
    const matchRow = await db.query(
      "SELECT matched_supplier_id FROM applications WHERE id = $1",
      [applicationId]
    );
    if (matchRow.rows[0]?.matched_supplier_id) {
      await db.query(
        `INSERT INTO supplier_messages (application_id, sender_role, sender_name, message)
         VALUES ($1, 'admin', 'Система', $2)`,
        [
          applicationId,
          `✅ Клиент подтвердил заказ по заявке #${applicationId}.\n` +
          `Свяжитесь с менеджером для согласования условий поставки.`
        ]
      );
    }

    res.json({ message: "Предложение принято", newStatus: "согласована" });
  } catch (err) {
    console.error("Ошибка confirm-offer:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /api/applications/:id/decline-offer — пользователь отклоняет предложение
router.patch("/:id/decline-offer", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });

  try {
    const cur = await db.query(
      "SELECT status, user_id, matched_supplier_id FROM applications WHERE id = $1", [applicationId]
    );
    if (cur.rowCount === 0) return res.status(404).json({ error: "Заявка не найдена" });
    if (cur.rows[0].user_id !== userId) return res.status(403).json({ error: "Нет доступа" });
    if (cur.rows[0].status !== "предложение")
      return res.status(400).json({ error: "Заявка не в статусе 'предложение'" });

    // Возвращаем в работу, снимаем предложение и привязку товара — менеджер подберёт другой вариант
    await db.query(
      `UPDATE applications
          SET status = 'в работе', offered_price = NULL,
              matched_item_id = NULL, matched_item_type = NULL,
              matched_supplier_id = NULL, supplier_status = NULL
        WHERE id = $1`,
      [applicationId]
    );

    // Если был привязан поставщик — уведомить его, что вариант отклонён
    if (cur.rows[0].matched_supplier_id) {
      await db.query(
        `INSERT INTO supplier_messages (application_id, sender_role, sender_name, message)
         VALUES ($1, 'admin', 'Система', $2)`,
        [applicationId, `❌ Клиент отклонил предложение по заявке #${applicationId}. Менеджер подбирает другой вариант.`]
      );
    }

    res.json({ message: "Предложение отклонено", newStatus: "в работе" });
  } catch (err) {
    console.error("Ошибка decline-offer:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/applications/:id/comments — список комментариев
router.get("/:id/comments", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });

  try {
    if (userRole !== "moderator" && userRole !== "admin") {
      const own = await db.query("SELECT id FROM applications WHERE id = $1 AND user_id = $2", [applicationId, userId]);
      if (own.rowCount === 0) return res.status(403).json({ error: "Нет доступа" });
    }
    const result = await db.query(
      "SELECT * FROM application_comments WHERE application_id = $1 ORDER BY created_at ASC",
      [applicationId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка получения комментариев:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/applications/:id/comments — добавить комментарий
router.post("/:id/comments", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;
  const applicationId = parseInt(req.params.id, 10);
  const { message } = req.body;

  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });
  if (!message?.trim()) return res.status(400).json({ error: "Сообщение не может быть пустым" });

  try {
    if (userRole !== "moderator" && userRole !== "admin") {
      const own = await db.query("SELECT id FROM applications WHERE id = $1 AND user_id = $2", [applicationId, userId]);
      if (own.rowCount === 0) return res.status(403).json({ error: "Нет доступа" });
    }

    const nameR = await db.query("SELECT first_name, last_name FROM users WHERE id = $1", [userId]);
    const authorName = nameR.rows[0]
      ? `${nameR.rows[0].first_name} ${nameR.rows[0].last_name}`.trim()
      : "Пользователь";
    const authorRole = userRole === "moderator" || userRole === "admin" ? "admin" : "user";

    const result = await db.query(
      "INSERT INTO application_comments (application_id, author_role, author_name, message) VALUES ($1,$2,$3,$4) RETURNING *",
      [applicationId, authorRole, authorName, message.trim()]
    );

    if (authorRole === "admin") {
      await notifyUser(applicationId, "new_comment");
    }

    res.status(201).json({ comment: result.rows[0] });
  } catch (err) {
    console.error("Ошибка добавления комментария:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /api/applications/:id/close — пользователь закрывает заявку
router.patch("/:id/close", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });

  try {
    const cur = await db.query("SELECT status FROM applications WHERE id = $1 AND user_id = $2", [applicationId, userId]);
    if (cur.rowCount === 0) return res.status(404).json({ error: "Заявка не найдена" });
    const s = cur.rows[0].status;
    if (s === "выполнена") return res.status(400).json({ error: "Заявка уже закрыта" });
    if (s === "отменена")  return res.status(400).json({ error: "Нельзя закрыть отменённую заявку" });
    if (s !== "согласована") return res.status(400).json({ error: "Закрыть можно только согласованную заявку" });

    await db.query("UPDATE applications SET status = 'выполнена' WHERE id = $1", [applicationId]);
    res.json({ message: "Заявка успешно закрыта" });
  } catch (error) {
    console.error("Ошибка закрытия заявки:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /api/applications/:id/match — привязать товар поставщика (модератор)
router.patch("/:id/match", authMiddleware, isModerator, async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  const { item_id, item_type } = req.body;
  if (isNaN(applicationId) || !item_id || !["car", "part"].includes(item_type))
    return res.status(400).json({ error: "Неверные параметры" });

  try {
    const table = item_type === "car" ? "cars" : "parts";
    const item = await db.query(`SELECT id, supplier_id FROM ${table} WHERE id = $1 AND status = 'approved'`, [item_id]);
    if (!item.rows.length) return res.status(404).json({ error: "Товар не найден или не одобрен" });
    const supplierId = item.rows[0].supplier_id;
    if (!supplierId) return res.status(400).json({ error: "У товара нет поставщика" });

    // Нельзя привязать товар поставщика к его же заявке (кроме заявок персонала — для отладки)
    const appOwner = await db.query(
      "SELECT a.user_id, u.role FROM applications a JOIN users u ON u.id = a.user_id WHERE a.id = $1",
      [applicationId]
    );
    if (!appOwner.rows.length) return res.status(404).json({ error: "Заявка не найдена" });
    const ownerIsStaff = ["admin", "moderator"].includes(appOwner.rows[0].role);
    if (!ownerIsStaff && appOwner.rows[0].user_id === supplierId)
      return res.status(400).json({ error: "Нельзя привязать товар поставщика к его же заявке" });

    await db.query(
      `UPDATE applications SET matched_item_id=$1, matched_item_type=$2, matched_supplier_id=$3, supplier_status='pending'
       WHERE id=$4`,
      [item_id, item_type, supplierId, applicationId]
    );

    await db.query(
      "INSERT INTO application_notifications (user_id, application_id, type) VALUES ($1,$2,'supplier_match')",
      [supplierId, applicationId]
    );

    res.json({ message: "Товар привязан, поставщик уведомлён" });
  } catch (err) {
    console.error("match error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /api/applications/:id/match — убрать привязку (модератор)
router.delete("/:id/match", authMiddleware, isModerator, async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });
  try {
    await db.query(
      "UPDATE applications SET matched_item_id=NULL, matched_item_type=NULL, matched_supplier_id=NULL, supplier_status=NULL WHERE id=$1",
      [applicationId]
    );
    res.json({ message: "Привязка удалена" });
  } catch (err) {
    console.error("unmatch error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// GET /api/applications/:id/supplier-messages
// Доступ: модератор или поставщик из matched_supplier_id
router.get("/:id/supplier-messages", authMiddleware, async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });
  try {
    const app = await db.query("SELECT matched_supplier_id FROM applications WHERE id=$1", [applicationId]);
    if (!app.rows.length) return res.status(404).json({ error: "Заявка не найдена" });
    const isMod = req.userRole === "moderator" || req.userRole === "admin";
    const isMatchedSupplier = app.rows[0].matched_supplier_id === req.userId;
    if (!isMod && !isMatchedSupplier) return res.status(403).json({ error: "Нет доступа" });

    const msgs = await db.query(
      "SELECT * FROM supplier_messages WHERE application_id=$1 ORDER BY created_at ASC",
      [applicationId]
    );
    if (isMod) {
      await db.query(
        "UPDATE supplier_messages SET is_read=TRUE WHERE application_id=$1 AND sender_role='supplier'",
        [applicationId]
      );
    } else {
      await db.query(
        "UPDATE supplier_messages SET is_read=TRUE WHERE application_id=$1 AND sender_role='admin'",
        [applicationId]
      );
    }
    res.json(msgs.rows);
  } catch (err) {
    console.error("supplier-messages get error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/applications/:id/supplier-messages
// Доступ: модератор или поставщик из matched_supplier_id
router.post("/:id/supplier-messages", authMiddleware, async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  const { message } = req.body;
  if (isNaN(applicationId) || !message?.trim())
    return res.status(400).json({ error: "Неверные параметры" });
  try {
    const app = await db.query("SELECT matched_supplier_id FROM applications WHERE id=$1", [applicationId]);
    if (!app.rows.length) return res.status(404).json({ error: "Заявка не найдена" });
    const isMod = req.userRole === "moderator" || req.userRole === "admin";
    const isMatchedSupplier = app.rows[0].matched_supplier_id === req.userId;
    if (!isMod && !isMatchedSupplier) return res.status(403).json({ error: "Нет доступа" });

    const nameR = await db.query("SELECT first_name, last_name FROM users WHERE id=$1", [req.userId]);
    const senderName = nameR.rows[0]
      ? `${nameR.rows[0].first_name} ${nameR.rows[0].last_name}`.trim()
      : (isMod ? "Менеджер" : "Поставщик");
    const senderRole = isMod ? "admin" : "supplier";

    const result = await db.query(
      "INSERT INTO supplier_messages (application_id, sender_role, sender_name, message) VALUES ($1,$2,$3,$4) RETURNING *",
      [applicationId, senderRole, senderName, message.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("supplier-messages post error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// PATCH /api/applications/:id/supplier-confirm — поставщик подтверждает/отклоняет
router.patch("/:id/supplier-confirm", authMiddleware, async (req, res) => {
  const applicationId = parseInt(req.params.id, 10);
  const { status } = req.body;
  if (isNaN(applicationId) || !["confirmed", "declined"].includes(status))
    return res.status(400).json({ error: "Неверные параметры" });
  try {
    const app = await db.query(
      "SELECT matched_supplier_id FROM applications WHERE id=$1", [applicationId]
    );
    if (!app.rows.length) return res.status(404).json({ error: "Заявка не найдена" });
    if (app.rows[0].matched_supplier_id !== req.userId)
      return res.status(403).json({ error: "Нет доступа" });

    await db.query("UPDATE applications SET supplier_status=$1 WHERE id=$2", [status, applicationId]);

    res.json({ message: "Статус обновлён", supplier_status: status });
  } catch (err) {
    console.error("supplier-confirm error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /api/applications/:id — отменить заявку
router.delete("/:id", authMiddleware, async (req, res) => {
  const userId = req.userId;
  const applicationId = parseInt(req.params.id, 10);
  if (isNaN(applicationId)) return res.status(400).json({ error: "Неверный ID" });

  try {
    const check = await db.query("SELECT user_id, status FROM applications WHERE id = $1", [applicationId]);
    if (check.rowCount === 0) return res.status(404).json({ error: "Заявка не найдена" });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: "Нет доступа" });

    const { status } = check.rows[0];
    if (status === "выполнена" || status === "отменена")
      return res.status(400).json({ error: "Нельзя отменить заявку в финальном статусе" });

    await db.query("UPDATE applications SET status = 'отменена' WHERE id = $1", [applicationId]);
    res.json({ message: `Заявка №${applicationId} отменена` });
  } catch (error) {
    console.error("Ошибка отмены заявки:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
