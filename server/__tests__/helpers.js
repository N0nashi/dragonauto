const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET;

/**
 * Генерирует JWT-токен для тестового пользователя.
 * @param {number} id   - ID пользователя
 * @param {string} role - Роль: 'client' | 'moderator' | 'admin' | 'supplier'
 */
function makeToken(id = 1, role = "client") {
  return jwt.sign({ id, role }, SECRET, { expiresIn: "1h" });
}

/**
 * Возвращает заголовок Authorization с Bearer-токеном.
 */
function authHeader(id = 1, role = "client") {
  return { Authorization: `Bearer ${makeToken(id, role)}` };
}

module.exports = { makeToken, authHeader };
