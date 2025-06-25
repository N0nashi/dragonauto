// parts.js — Роуты для работы с запчастями
const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /filters — получение уникальных значений для фильтров
router.get("/filters", async (req, res) => {
  const { country, brand } = req.query;

  try {
    // Бренды только для выбранной страны
    const brandsQuery = await db.query(
      `SELECT DISTINCT brand FROM parts 
       WHERE ($1::text IS NULL OR country = $1) 
       ORDER BY brand`,
      [country]
    );

    const modelsQuery = await db.query(
      `SELECT DISTINCT model FROM parts 
       WHERE ($1::text IS NULL OR country = $1)
         AND ($2::text IS NULL OR brand = $2)
       ORDER BY model`,
      [country, brand]
    );

    // Остальные запросы без изменений
    const countriesQuery = await db.query(
      `SELECT DISTINCT country FROM parts ORDER BY country`
    );

    const bodiesQuery = await db.query(
      `SELECT DISTINCT body FROM parts ORDER BY body`
    );

    const pricesQuery = await db.query(
      `SELECT MIN(price) as min, MAX(price) as max FROM parts`
    );

    res.json({
      brands: brandsQuery.rows.map(r => r.brand),
      models: modelsQuery.rows.map(r => r.model),
      countries: countriesQuery.rows.map(r => r.country),
      bodies: bodiesQuery.rows.map(r => r.body),
      priceRange: pricesQuery.rows[0],
    });
  } catch (err) {
    console.error("Ошибка в /api/parts/filters:", err.message);
    res.status(500).json({ error: "Ошибка при получении фильтров" });
  }
});

// POST /search — поиск запчастей по фильтрам
router.post("/search", async (req, res) => {
  const {
    brand,
    model,
    country,
    year_from,
    year_to,
    body_type,
    price_from,
    price_to
  } = req.body;
  
  const filters = [];
  const values = [];

  if (brand) {
    filters.push(`brand = $${values.length + 1}`);
    values.push(brand);
  }
  if (model) {
    filters.push(`model = $${values.length + 1}`);
    values.push(model);
  }
  if (country) {
    filters.push(`country = $${values.length + 1}`);
    values.push(country);
  }
  if (year_from) {
    filters.push(`year >= $${values.length + 1}`);
    values.push(year_from);
  }
  if (year_to) {
    filters.push(`year <= $${values.length + 1}`);
    values.push(year_to);
  }
  if (body_type) {
    filters.push(`body = $${values.length + 1}`);
    values.push(body_type);
  }
  if (price_from) {
    filters.push(`price >= $${values.length + 1}`);
    values.push(price_from);
  }
  if (price_to) {
    filters.push(`price <= $${values.length + 1}`);
    values.push(price_to);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const query = `
    SELECT 
      id, 
      country, 
      brand, 
      model, 
      year, 
      body AS body_type, 
      part_name, 
      photo_url,
      price
    FROM parts 
    ${whereClause} 
    ORDER BY id DESC
  `;

  try {
    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в /api/parts/search:", err.message);
    res.status(500).json({ error: "Ошибка при получении запчастей" });
  }
});

// GET / — получение всех запчастей
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM parts ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Ошибка в /api/parts:", err.message);
    res.status(500).json({ error: "Ошибка при получении списка запчастей" });
  }
});
// GET /:id — получение одной запчасти по ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM parts WHERE id = $1", [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Запчасть не найдена" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при получении запчасти:", err.message);
    res.status(500).json({ error: "Ошибка при получении запчасти" });
  }
});

// POST / — добавление новой запчасти
router.post("/", async (req, res) => {
  const {
    country,
    brand,
    model,
    year,
    body,
    part_name,
    photo_url,
    price
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO parts (country, brand, model, year, body, part_name, photo_url, price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [country, brand, model, year, body, part_name, photo_url, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при добавлении запчасти:", err.message);
    res.status(500).json({ error: "Не удалось добавить запчасть" });
  }
});

// PUT /:id — редактирование запчасти
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const {
    country,
    brand,
    model,
    year,
    body,
    part_name,
    photo_url,
    price
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE parts SET
         country = $1,
         brand = $2,
         model = $3,
         year = $4,
         body = $5,
         part_name = $6,
         photo_url = $7,
         price = $8
       WHERE id = $9
       RETURNING *`,
      [country, brand, model, year, body, part_name, photo_url, price, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Запчасть не найдена" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Ошибка при редактировании запчасти:", err.message);
    res.status(500).json({ error: "Не удалось обновить данные запчасти" });
  }
});

// DELETE /:id — удаление запчасти
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const result = await db.query("DELETE FROM parts WHERE id = $1 RETURNING *", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Запчасть не найдена" });
    }

    res.json({ message: "Запчасть успешно удалена" });
  } catch (err) {
    console.error("Ошибка при удалении запчасти:", err.message);
    res.status(500).json({ error: "Не удалось удалить запчасть" });
  }
});

module.exports = router;