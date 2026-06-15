const express    = require("express");
const router     = express.Router();
const db         = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { sendMail } = require("../utils/mailer");

const isSupplier = async (req, res, next) => {
  const r = req.userRole;
  if (r !== "supplier" && r !== "admin" && r !== "moderator")
    return res.status(403).json({ error: "Только для поставщиков" });

  // Проверка блокировки
  try {
    const u = await db.query("SELECT is_blocked FROM users WHERE id = $1", [req.userId]);
    if (u.rows[0]?.is_blocked)
      return res.status(403).json({ error: "Аккаунт заблокирован" });
  } catch {
    return res.status(500).json({ error: "Ошибка сервера" });
  }

  next();
};

const isAdmin = (req, res, next) => {
  const r = req.userRole;
  if (r !== "admin" && r !== "moderator")
    return res.status(403).json({ error: "Только для администраторов" });
  next();
};

/* Серверные границы для товаров каталога — чтобы нельзя было залить мусор через консоль */
const CURRENT_YEAR = new Date().getFullYear();
const ITEM_BOUNDS = {
  year:    { min: 1950, max: CURRENT_YEAR + 1 },
  price:   { min: 1,    max: 1_000_000_000 },
  mileage: { min: 0,    max: 2_000_000 },
  power:   { min: 0,    max: 2000 },
};
const ITEM_MAX_TEXT = 50;

function numInRange(v, { min, max }) {
  if (v === undefined || v === null || v === "") return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
}
function textTooLong(...vals) {
  return vals.some(v => v != null && String(v).length > ITEM_MAX_TEXT);
}
// Строка содержит хотя бы одну букву (марка/модель/название не из одних цифр)
const hasLetter = (v) => /[a-zA-Zа-яА-ЯёЁ]/.test(String(v ?? ""));

// Допустимый статус, если задаёт админ/модератор
function resolveStatus(req) {
  if (req.userRole === "admin" || req.userRole === "moderator")
    return ["approved", "pending", "rejected"].includes(req.body.status) ? req.body.status : "approved";
  return "pending";
}

function validateCar(b) {
  if (!numInRange(b.year, ITEM_BOUNDS.year))   return "Некорректный год";
  if (!numInRange(b.price, ITEM_BOUNDS.price))  return "Некорректная цена";
  if (b.mileage !== undefined && b.mileage !== null && b.mileage !== "" && !numInRange(b.mileage, ITEM_BOUNDS.mileage))
    return "Некорректный пробег";
  if (b.engine_power != null && b.engine_power !== "" && !numInRange(b.engine_power, ITEM_BOUNDS.power))
    return "Некорректная мощность";
  if (textTooLong(b.brand, b.model, b.country, b.body, b.gearbox, b.drive))
    return "Слишком длинное значение в поле";
  if (!hasLetter(b.brand)) return "Марка должна содержать буквы";
  return null;
}
function validatePart(b) {
  if (!numInRange(b.price, ITEM_BOUNDS.price)) return "Некорректная цена";
  if (b.year != null && b.year !== "" && !numInRange(b.year, ITEM_BOUNDS.year))
    return "Некорректный год";
  if (textTooLong(b.part_name, b.brand, b.model, b.country, b.body))
    return "Слишком длинное значение в поле";
  if (!hasLetter(b.part_name)) return "Название должно содержать буквы";
  if (b.brand && !hasLetter(b.brand)) return "Марка должна содержать буквы";
  return null;
}

// SUPPLIER: свои товары

// GET /api/supplier/listings
router.get("/listings", authMiddleware, isSupplier, async (req, res) => {
  try {
    const cars = await db.query(
      `SELECT id, brand, model, year, price, photo_url, status, 'car' AS type
         FROM cars WHERE supplier_id = $1 ORDER BY id DESC`,
      [req.userId]
    );
    const parts = await db.query(
      `SELECT id, part_name, brand, model, price, photo_url, status, 'part' AS type
         FROM parts WHERE supplier_id = $1 ORDER BY id DESC`,
      [req.userId]
    );
    res.json([...cars.rows, ...parts.rows]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// POST /api/supplier/cars
router.post("/cars", authMiddleware, isSupplier, async (req, res) => {
  const { brand, model, year, price, country, mileage, body, gearbox, drive, engine_power, photo_url } = req.body;
  if (!brand || !model || !year || !price || !country)
    return res.status(400).json({ error: "Обязательные поля: brand, model, year, price, country" });
  const vErr = validateCar(req.body);
  if (vErr) return res.status(400).json({ error: vErr });
  const status = resolveStatus(req);
  try {
    const r = await db.query(
      `INSERT INTO cars (brand,model,year,price,country,mileage,body,gearbox,drive,engine_power,photo_url,supplier_id,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [brand, model, +year, +price, country, +mileage||0, body||null, gearbox||null, drive||null, engine_power?+engine_power:null, photo_url||null, req.userId, status]
    );
    res.status(201).json({ id: r.rows[0].id, message: status === "pending" ? "Автомобиль отправлен на модерацию" : "Автомобиль добавлен" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// PATCH /api/supplier/my-car/:id — поставщик редактирует свой автомобиль → статус сбрасывается в pending
router.patch("/my-car/:id", authMiddleware, isSupplier, async (req, res) => {
  const { brand, model, year, price, country, mileage, body, gearbox, drive, engine_power, photo_url } = req.body;
  if (!brand || !model || !year || !price || !country)
    return res.status(400).json({ error: "Обязательные поля: brand, model, year, price, country" });
  const vErr = validateCar(req.body);
  if (vErr) return res.status(400).json({ error: vErr });
  try {
    const own = await db.query("SELECT id FROM cars WHERE id=$1 AND supplier_id=$2", [req.params.id, req.userId]);
    if (!own.rows.length) return res.status(403).json({ error: "Нет доступа" });
    await db.query(
      `UPDATE cars SET brand=$1,model=$2,year=$3,price=$4,country=$5,mileage=$6,body=$7,
              gearbox=$8,drive=$9,engine_power=$10,photo_url=$11,status='pending'
       WHERE id=$12`,
      [brand, model, +year, +price, country, +mileage||0, body||null, gearbox||null, drive||null,
       engine_power?+engine_power:null, photo_url||null, req.params.id]
    );
    res.json({ message: "Автомобиль обновлён и отправлен на модерацию" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// PATCH /api/supplier/my-part/:id — поставщик редактирует свою запчасть → статус сбрасывается в pending
router.patch("/my-part/:id", authMiddleware, isSupplier, async (req, res) => {
  const { part_name, brand, model, price, country, body, year, photo_url } = req.body;
  if (!part_name || !price)
    return res.status(400).json({ error: "Обязательные поля: part_name, price" });
  const vErr = validatePart(req.body);
  if (vErr) return res.status(400).json({ error: vErr });
  try {
    const own = await db.query("SELECT id FROM parts WHERE id=$1 AND supplier_id=$2", [req.params.id, req.userId]);
    if (!own.rows.length) return res.status(403).json({ error: "Нет доступа" });
    await db.query(
      `UPDATE parts SET part_name=$1,brand=$2,model=$3,price=$4,country=$5,body=$6,year=$7,photo_url=$8,status='pending'
       WHERE id=$9`,
      [part_name, brand||null, model||null, +price, country||null, body||null, year?+year:null, photo_url||null, req.params.id]
    );
    res.json({ message: "Запчасть обновлена и отправлена на модерацию" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// POST /api/supplier/parts
router.post("/parts", authMiddleware, isSupplier, async (req, res) => {
  const { part_name, brand, model, price, country, body, year, photo_url } = req.body;
  if (!part_name || !price)
    return res.status(400).json({ error: "Обязательные поля: part_name, price" });
  const vErr = validatePart(req.body);
  if (vErr) return res.status(400).json({ error: vErr });
  const status = resolveStatus(req);
  try {
    const r = await db.query(
      `INSERT INTO parts (part_name,brand,model,price,country,body,year,photo_url,supplier_id,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [part_name, brand||null, model||null, +price, country||null, body||null, year?+year:null, photo_url||null, req.userId, status]
    );
    res.status(201).json({ id: r.rows[0].id, message: status === "pending" ? "Запчасть отправлена на модерацию" : "Запчасть добавлена" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// SUPPLIER: заявки, в которых выбраны его товары

// GET /api/supplier/matched-applications
router.get("/matched-applications", authMiddleware, isSupplier, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         a.id, a.type, a.status, a.date, a.supplier_status,
         a.matched_item_id, a.matched_item_type,
         -- matched item details
         CASE
           WHEN a.matched_item_type = 'car'
           THEN (SELECT row_to_json(c) FROM (
                  SELECT id, brand, model, year, price, photo_url FROM cars WHERE id = a.matched_item_id
                ) c)
           ELSE (SELECT row_to_json(p) FROM (
                  SELECT id, part_name, price, photo_url FROM parts WHERE id = a.matched_item_id
                ) p)
         END AS matched_item,
         -- unread supplier messages from admin
         (SELECT COUNT(*)::int FROM supplier_messages sm
          WHERE sm.application_id = a.id AND sm.sender_role = 'admin' AND sm.is_read = FALSE) AS unread_count
       FROM applications a
       WHERE a.matched_supplier_id = $1
       ORDER BY a.date DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("matched-applications error:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// ADMIN: модерация

// GET /api/supplier/pending — товары поставщиков на модерации
router.get("/pending", authMiddleware, isAdmin, async (req, res) => {
  try {
    const cars  = await db.query(
      `SELECT c.id, c.brand, c.model, c.year, c.price, c.photo_url, c.supplier_id, c.status,
              c.country, c.mileage, c.body, c.gearbox, c.drive, c.engine_power,
              'car' AS type, u.first_name, u.last_name, u.email
         FROM cars c LEFT JOIN users u ON u.id = c.supplier_id
        WHERE c.status = 'pending' ORDER BY c.id DESC`
    );
    const parts = await db.query(
      `SELECT p.id, p.part_name, p.brand, p.model, p.price, p.photo_url, p.supplier_id, p.status,
              p.country, p.body, p.year,
              'part' AS type, u.first_name, u.last_name, u.email
         FROM parts p LEFT JOIN users u ON u.id = p.supplier_id
        WHERE p.status = 'pending' ORDER BY p.id DESC`
    );
    res.json([...cars.rows, ...parts.rows]);
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// POST /api/supplier/moderate — одобрить/отклонить
router.post("/moderate", authMiddleware, isAdmin, async (req, res) => {
  const { id, type, status } = req.body;
  if (!id || !["car", "part"].includes(type) || !["approved","rejected"].includes(status))
    return res.status(400).json({ error: "Неверные параметры" });
  try {
    const TABLE_MAP = { car: "cars", part: "parts" };
    const table = TABLE_MAP[type];
    await db.query(`UPDATE ${table} SET status = $1 WHERE id = $2`, [status, id]);
    res.json({ message: `Статус обновлён: ${status}` });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// GET /api/supplier/all — все товары каталога (для редактирования админом)
router.get("/all", authMiddleware, isAdmin, async (req, res) => {
  try {
    const cars  = await db.query(
      `SELECT id, brand, model, year, price, photo_url, status, country, mileage, body, gearbox, drive, engine_power, supplier_id, 'car' AS type
         FROM cars ORDER BY id DESC`
    );
    const parts = await db.query(
      `SELECT id, part_name, brand, model, price, photo_url, status, country, body, year, supplier_id, 'part' AS type
         FROM parts ORDER BY id DESC`
    );
    res.json({ cars: cars.rows, parts: parts.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// PATCH /api/supplier/car/:id — редактировать авто (admin)
router.patch("/car/:id", authMiddleware, isAdmin, async (req, res) => {
  const { brand, model, year, price, country, mileage, body, gearbox, drive, status } = req.body;
  try {
    await db.query(
      `UPDATE cars SET brand=$1,model=$2,year=$3,price=$4,country=$5,mileage=$6,body=$7,gearbox=$8,drive=$9,status=$10
         WHERE id=$11`,
      [brand, model, +year, +price, country, +mileage||0, body||null, gearbox||null, drive||null, status, req.params.id]
    );
    res.json({ message: "Обновлено" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// PATCH /api/supplier/part/:id — редактировать запчасть (admin)
router.patch("/part/:id", authMiddleware, isAdmin, async (req, res) => {
  const { part_name, brand, model, price, country, body, year, status } = req.body;
  try {
    await db.query(
      `UPDATE parts SET part_name=$1,brand=$2,model=$3,price=$4,country=$5,body=$6,year=$7,status=$8
         WHERE id=$9`,
      [part_name, brand||null, model||null, +price, country||null, body||null, year?+year:null, status, req.params.id]
    );
    res.json({ message: "Обновлено" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// GET /api/supplier/suppliers — список поставщиков (admin)
router.get("/suppliers", authMiddleware, isAdmin, async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, first_name, last_name, email, is_blocked, created_at
         FROM users WHERE role = 'supplier' ORDER BY id DESC`
    );
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

// PATCH /api/supplier/block/:id — блокировать/разблокировать поставщика
router.patch("/block/:id", authMiddleware, isAdmin, async (req, res) => {
  const { blocked } = req.body;
  const supplierId = req.params.id;
  try {
    await db.query(`UPDATE users SET is_blocked = $1 WHERE id = $2 AND role = 'supplier'`, [!!blocked, supplierId]);

    if (blocked) {
      // Переводим все активные/ожидающие объявления в rejected
      const cars = await db.query(
        `UPDATE cars SET status = 'rejected' WHERE supplier_id = $1 AND status IN ('approved','pending') RETURNING id, brand, model, year`,
        [supplierId]
      );
      const parts = await db.query(
        `UPDATE parts SET status = 'rejected' WHERE supplier_id = $1 AND status IN ('approved','pending') RETURNING id, part_name`,
        [supplierId]
      );

      // Получаем данные поставщика для письма
      const supRow = await db.query(`SELECT email, first_name FROM users WHERE id = $1`, [supplierId]);
      const supplier = supRow.rows[0];

      let cancelledCount = 0;
      const carIds  = cars.rows.map(r => r.id);
      const partIds = parts.rows.map(r => r.id);

      // Отменяем заявки, привязанные к авто этого поставщика
      if (carIds.length > 0) {
        const affected = await db.query(
          `SELECT a.id, u.email, u.first_name, c.brand, c.model, c.year
             FROM applications a
             JOIN users u ON u.id = a.user_id
             JOIN cars c ON c.id = a.matched_item_id
            WHERE a.matched_item_id = ANY($1::int[]) AND a.matched_item_type = 'car'
              AND a.status NOT IN ('выполнена','отменена')`,
          [carIds]
        );
        if (affected.rows.length > 0) {
          await db.query(
            `UPDATE applications SET status = 'отменена'
              WHERE matched_item_id = ANY($1::int[]) AND matched_item_type = 'car'
                AND status NOT IN ('выполнена','отменена')`,
            [carIds]
          );
          cancelledCount += affected.rows.length;
          for (const row of affected.rows) {
            sendMail({
              to: row.email,
              subject: "Ваша заявка отменена — DragonAuto",
              text: `Здравствуйте, ${row.first_name}!\n\nОбъявление «${row.brand} ${row.model} ${row.year}» было заблокировано администратором, поэтому ваша заявка №${row.id} автоматически переведена в статус «Отменено».\n\nВы можете создать новую заявку на нашем сайте.\n\nС уважением,\nДрагонАвто`,
            }).catch(e => console.error("Mail error:", e.message));
          }
        }
      }

      // Отменяем заявки, привязанные к запчастям этого поставщика
      if (partIds.length > 0) {
        const affected = await db.query(
          `SELECT a.id, u.email, u.first_name, p.part_name
             FROM applications a
             JOIN users u ON u.id = a.user_id
             JOIN parts p ON p.id = a.matched_item_id
            WHERE a.matched_item_id = ANY($1::int[]) AND a.matched_item_type = 'part'
              AND a.status NOT IN ('выполнена','отменена')`,
          [partIds]
        );
        if (affected.rows.length > 0) {
          await db.query(
            `UPDATE applications SET status = 'отменена'
              WHERE matched_item_id = ANY($1::int[]) AND matched_item_type = 'part'
                AND status NOT IN ('выполнена','отменена')`,
            [partIds]
          );
          cancelledCount += affected.rows.length;
          for (const row of affected.rows) {
            sendMail({
              to: row.email,
              subject: "Ваша заявка отменена — DragonAuto",
              text: `Здравствуйте, ${row.first_name}!\n\nОбъявление «${row.part_name}» было заблокировано администратором, поэтому ваша заявка №${row.id} автоматически переведена в статус «Отменено».\n\nВы можете создать новую заявку на нашем сайте.\n\nС уважением,\nДрагонАвто`,
            }).catch(e => console.error("Mail error:", e.message));
          }
        }
      }

      // Уведомляем самого поставщика
      if (supplier) {
        sendMail({
          to: supplier.email,
          subject: "Ваш аккаунт заблокирован — DragonAuto",
          text: `Здравствуйте, ${supplier.first_name}!\n\nВаш аккаунт поставщика был заблокирован администратором.\nВсе ваши объявления переведены в статус «Отклонено».\n\nЕсли вы считаете это ошибкой, свяжитесь с нами по телефону +7 (982) 290-00-86.\n\nС уважением,\nДрагонАвто`,
        }).catch(e => console.error("Mail error:", e.message));
      }

      res.json({
        message: "Поставщик заблокирован",
        rejectedCars: carIds.length,
        rejectedParts: partIds.length,
        cancelledApplications: cancelledCount,
      });
    } else {
      res.json({ message: "Поставщик разблокирован" });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: "Ошибка сервера" }); }
});

/* helper — отменяет только заявки, привязанные к удаляемому товару, и рассылает письма */
async function cancelMatchedApplications(itemId, type, itemLabel) {
  // Берём только заявки, реально привязанные к этому товару
  const result = await db.query(
    `SELECT a.id, a.user_id, u.email, u.first_name
       FROM applications a
       JOIN users u ON u.id = a.user_id
      WHERE a.matched_item_id = $1 AND a.matched_item_type = $2
        AND a.status NOT IN ('выполнена','отменена')`,
    [itemId, type]
  );
  if (result.rows.length === 0) return 0;

  // Отменяем и снимаем привязку, чтобы не осталось ссылки на удалённый товар
  await db.query(
    `UPDATE applications
        SET status = 'отменена',
            matched_item_id = NULL, matched_item_type = NULL,
            matched_supplier_id = NULL, supplier_status = NULL
      WHERE matched_item_id = $1 AND matched_item_type = $2
        AND status NOT IN ('выполнена','отменена')`,
    [itemId, type]
  );

  // Рассылаем письма асинхронно (не блокируем ответ)
  for (const row of result.rows) {
    sendMail({
      to: row.email,
      subject: "Ваша заявка отменена — DragonAuto",
      text:
        `Здравствуйте, ${row.first_name}!\n\n` +
        `Позиция каталога «${itemLabel}» была удалена администратором, ` +
        `поэтому ваша заявка №${row.id} автоматически переведена в статус «Отменено».\n\n` +
        `Вы можете создать новую заявку на нашем сайте.\n\n` +
        `С уважением,\nДрагонАвто`,
    }).catch(err => console.error("Mail error:", err.message));
  }

  return result.rows.length;
}

// DELETE /api/supplier/car/:id — удалить авто (admin)
router.delete("/car/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const car = await db.query("SELECT * FROM cars WHERE id = $1", [req.params.id]);
    if (car.rows.length === 0) return res.status(404).json({ error: "Не найдено" });

    const { brand, model, year } = car.rows[0];
    const label = `${brand} ${model} ${year}`;

    const cancelled = await cancelMatchedApplications(req.params.id, "car", label);
    await db.query("DELETE FROM cars WHERE id = $1", [req.params.id]);

    res.json({ message: "Автомобиль удалён", cancelledApplications: cancelled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// DELETE /api/supplier/part/:id — удалить запчасть (admin)
router.delete("/part/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const part = await db.query("SELECT * FROM parts WHERE id = $1", [req.params.id]);
    if (part.rows.length === 0) return res.status(404).json({ error: "Не найдено" });

    const label = part.rows[0].part_name || "Запчасть";

    const cancelled = await cancelMatchedApplications(req.params.id, "part", label);
    await db.query("DELETE FROM parts WHERE id = $1", [req.params.id]);

    res.json({ message: "Запчасть удалена", cancelledApplications: cancelled });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;
