/**
 * Тесты: Заявки пользователей
 * Маршруты: GET /api/applications, POST /api/applications,
 *           DELETE /api/applications/:id, PATCH /api/applications/:id/status
 */
jest.mock("../db");
jest.mock("../utils/mailer", () => ({ sendMail: jest.fn().mockResolvedValue(true) }), { virtual: true });

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");
const { authHeader } = require("./helpers");

// authMiddleware делает SELECT role FROM users — мокаем его по умолчанию
function mockAuth(role = "client", id = 1) {
  db.query.mockResolvedValueOnce({ rows: [{ role }] }); // authMiddleware
}

const SAMPLE_APP = {
  id: 7, user_id: 1, type: "car", status: "в обработке",
  date: new Date().toISOString(), description: "Тест",
};

// ───────────────────────────────────────────────
// GET /api/applications — список заявок
// ───────────────────────────────────────────────
describe("GET /api/applications", () => {
  beforeEach(() => jest.clearAllMocks());

  test("401 — без токена возвращает ошибку авторизации", async () => {
    const res = await request(app).get("/api/applications");
    expect(res.status).toBe(401);
  });

  test("200 — авторизованный клиент получает свои заявки", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rows: [SAMPLE_APP] });

    const res = await request(app)
      .get("/api/applications")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("200 — модератор получает все заявки", async () => {
    mockAuth("moderator", 10);
    db.query.mockResolvedValueOnce({ rows: [SAMPLE_APP, { ...SAMPLE_APP, id: 8, user_id: 2 }] });

    const res = await request(app)
      .get("/api/applications")
      .set(authHeader(10, "moderator"));

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

// ───────────────────────────────────────────────
// GET /api/applications/:id — одна заявка
// ───────────────────────────────────────────────
describe("GET /api/applications/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 — владелец заявки получает её данные", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rows: [SAMPLE_APP], rowCount: 1 });

    const res = await request(app)
      .get("/api/applications/7")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", 7);
  });

  test("404 — заявка не найдена или чужая", async () => {
    mockAuth("client", 2); // другой пользователь
    db.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app)
      .get("/api/applications/7")
      .set(authHeader(2, "client"));

    expect(res.status).toBe(404);
  });
});

// ───────────────────────────────────────────────
// DELETE /api/applications/:id — отмена заявки
// ───────────────────────────────────────────────
describe("DELETE /api/applications/:id", () => {
  beforeEach(() => jest.clearAllMocks());

  test("401 — без авторизации нельзя отменить заявку", async () => {
    const res = await request(app).delete("/api/applications/7");
    expect(res.status).toBe(401);
  });

  test("200 — владелец успешно отменяет заявку", async () => {
    mockAuth("client", 1);
    // SELECT проверяет владельца и статус
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1, status: "в обработке" }], rowCount: 1 });
    // DELETE
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .delete("/api/applications/7")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
  });
});

// ───────────────────────────────────────────────
// PATCH /api/applications/:id/status — смена статуса (модератор)
// ───────────────────────────────────────────────
describe("PATCH /api/applications/:id/status", () => {
  beforeEach(() => jest.clearAllMocks());

  test("403 — клиент не может менять статус", async () => {
    mockAuth("client", 1);

    const res = await request(app)
      .patch("/api/applications/7/status")
      .set(authHeader(1, "client"))
      .send({ status: "в работе" });

    expect(res.status).toBe(403);
  });

  test("200 — модератор успешно меняет статус", async () => {
    mockAuth("moderator", 10);
    // SELECT текущего статуса
    db.query.mockResolvedValueOnce({ rows: [{ status: "в обработке" }], rowCount: 1 });
    // UPDATE статуса
    db.query.mockResolvedValueOnce({ rowCount: 1 });
    // notifyUser: SELECT user_id
    db.query.mockResolvedValueOnce({ rows: [{ user_id: 1 }] });
    // notifyUser: INSERT notification
    db.query.mockResolvedValueOnce({ rows: [] });
    // предложение: SELECT matched_supplier_id (нет поставщика)
    db.query.mockResolvedValueOnce({ rows: [{ matched_supplier_id: null }] });

    const res = await request(app)
      .patch("/api/applications/7/status")
      .set(authHeader(10, "moderator"))
      .send({ status: "в работе" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("newStatus", "в работе");
  });

  test("400 — недопустимый переход статуса", async () => {
    mockAuth("moderator", 10);
    // Заявка уже 'выполнена'
    db.query.mockResolvedValueOnce({ rows: [{ status: "выполнена" }], rowCount: 1 });

    const res = await request(app)
      .patch("/api/applications/7/status")
      .set(authHeader(10, "moderator"))
      .send({ status: "в работе" });

    expect(res.status).toBe(400);
  });
});
