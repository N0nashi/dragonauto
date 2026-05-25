/**
 * Тесты: Уведомления пользователя
 * Маршруты: GET /api/notifications, GET /api/notifications/unread-count,
 *           PATCH /api/notifications/mark-read
 */
jest.mock("../db");

const request = require("supertest");
const app     = require("../app");
const db      = require("../db");
const { authHeader } = require("./helpers");

function mockAuth(role = "client", id = 1) {
  db.query.mockResolvedValueOnce({ rows: [{ role }] });
}

const SAMPLE_NOTIF = {
  id: 1, application_id: 7, type: "status_change",
  is_read: false, created_at: new Date().toISOString(),
  app_status: "в обработке", app_type: "car",
};

// ───────────────────────────────────────────────
// GET /api/notifications
// ───────────────────────────────────────────────
describe("GET /api/notifications", () => {
  beforeEach(() => jest.clearAllMocks());

  test("401 — без токена доступ запрещён", async () => {
    const res = await request(app).get("/api/notifications");
    expect(res.status).toBe(401);
  });

  test("200 — возвращает список уведомлений пользователя", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rows: [SAMPLE_NOTIF] });

    const res = await request(app)
      .get("/api/notifications")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("type", "status_change");
  });

  test("200 — пустой массив если нет уведомлений", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get("/api/notifications")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ───────────────────────────────────────────────
// GET /api/notifications/unread-count
// ───────────────────────────────────────────────
describe("GET /api/notifications/unread-count", () => {
  beforeEach(() => jest.clearAllMocks());

  test("200 — возвращает количество непрочитанных", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rows: [{ count: 3 }] });

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("count", 3);
  });

  test("200 — возвращает 0 если нет непрочитанных", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rows: [{ count: 0 }] });

    const res = await request(app)
      .get("/api/notifications/unread-count")
      .set(authHeader(1, "client"));

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

// ───────────────────────────────────────────────
// PATCH /api/notifications/mark-read
// ───────────────────────────────────────────────
describe("PATCH /api/notifications/mark-read", () => {
  beforeEach(() => jest.clearAllMocks());

  test("401 — без авторизации не работает", async () => {
    const res = await request(app)
      .patch("/api/notifications/mark-read")
      .send({});
    expect(res.status).toBe(401);
  });

  test("200 — помечает все уведомления как прочитанные", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rowCount: 2 }); // UPDATE

    const res = await request(app)
      .patch("/api/notifications/mark-read")
      .set(authHeader(1, "client"))
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  test("200 — помечает уведомления конкретной заявки", async () => {
    mockAuth("client", 1);
    db.query.mockResolvedValueOnce({ rowCount: 1 });

    const res = await request(app)
      .patch("/api/notifications/mark-read")
      .set(authHeader(1, "client"))
      .send({ application_id: 7 });

    expect(res.status).toBe(200);
    // Проверяем что запрос фильтровал по application_id
    const updateCall = db.query.mock.calls.find(c => c[0].includes("UPDATE"));
    expect(updateCall[0]).toContain("application_id");
  });
});
