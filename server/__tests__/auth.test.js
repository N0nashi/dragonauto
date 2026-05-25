/**
 * Тесты: Авторизация и регистрация
 * Маршруты: POST /api/register, POST /api/login
 */
jest.mock("../db");
jest.mock("nodemailer", () => ({
  createTransport: () => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test" }),
    verify:   jest.fn((cb) => cb && cb(null, true)),
  }),
}));

const request  = require("supertest");
const bcryptjs = require("bcryptjs");
const app      = require("../app");
const db       = require("../db");

// ───────────────────────────────────────────────
// Регистрация
// ───────────────────────────────────────────────
describe("POST /api/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("201 — успешная регистрация нового пользователя", async () => {
    // Нет существующего пользователя
    db.query
      .mockResolvedValueOnce({ rows: [] })                        // SELECT существующего
      .mockResolvedValueOnce({ rows: [{ id: 1, email: "user@test.com", role: "client" }] }) // INSERT
      .mockResolvedValueOnce({ rows: [] })                        // DELETE password_resets
      .mockResolvedValueOnce({ rows: [] });                       // INSERT password_resets (код)

    const res = await request(app)
      .post("/api/register")
      .send({
        email:      "user@test.com",
        password:   "Password123",
        first_name: "Иван",
        last_name:  "Иванов",
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("message");
  });

  test("400 — отсутствуют обязательные поля", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({ email: "user@test.com" }); // нет password, first_name, last_name

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("400 — пароль короче 8 символов", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        email:      "user@test.com",
        password:   "123",
        first_name: "Иван",
        last_name:  "Иванов",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8/);
  });

  test("400 — некорректный формат email", async () => {
    const res = await request(app)
      .post("/api/register")
      .send({
        email:      "not-an-email",
        password:   "Password123",
        first_name: "Иван",
        last_name:  "Иванов",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test("400 — email уже зарегистрирован", async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 99 }] }); // пользователь найден

    const res = await request(app)
      .post("/api/register")
      .send({
        email:      "exists@test.com",
        password:   "Password123",
        first_name: "Иван",
        last_name:  "Иванов",
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("Роль ограничена: только 'client' или 'supplier'", async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 2, email: "admin@test.com", role: "client" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/register")
      .send({
        email:      "admin@test.com",
        password:   "Password123",
        first_name: "Злой",
        last_name:  "Хакер",
        role:       "admin", // попытка установить admin
      });

    // Запрос должен успешно создать пользователя, но с ролью 'client'
    expect(res.status).toBe(201);
    // Проверяем что в INSERT передалась роль 'client', а не 'admin'
    const insertCall = db.query.mock.calls.find(c => c[0].includes("INSERT INTO users"));
    expect(insertCall).toBeDefined();
    expect(insertCall[1]).not.toContain("admin");
  });
});

// ───────────────────────────────────────────────
// Вход
// ───────────────────────────────────────────────
describe("POST /api/login", () => {
  const passwordPlain  = "Password123";
  let   passwordHashed;

  beforeAll(async () => {
    passwordHashed = await bcryptjs.hash(passwordPlain, 10);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("200 — успешный вход, возвращает token", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: "user@test.com", password: passwordHashed, role: "client", is_verified: true, is_blocked: false }],
    });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "user@test.com", password: passwordPlain });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(typeof res.body.token).toBe("string");
  });

  test("400 — отсутствуют поля email или password", async () => {
    const res = await request(app)
      .post("/api/login")
      .send({ email: "user@test.com" });

    expect(res.status).toBe(400);
  });

  test("401 — пользователь не найден", async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "nobody@test.com", password: "Password123" });

    expect(res.status).toBe(401);
  });

  test("401 — неверный пароль", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: "user@test.com", password: passwordHashed, role: "client", is_verified: true, is_blocked: false }],
    });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "user@test.com", password: "WrongPassword" });

    expect(res.status).toBe(401);
  });

  test("403 — аккаунт заблокирован", async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 1, email: "user@test.com", password: passwordHashed, role: "client", is_verified: true, is_blocked: true }],
    });

    const res = await request(app)
      .post("/api/login")
      .send({ email: "user@test.com", password: passwordPlain });

    expect(res.status).toBe(403);
  });
});
