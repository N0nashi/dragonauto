/**
 * Мок модуля db.js (pg Pool).
 * В тестах управляй через: db.query.mockResolvedValueOnce({ rows: [...] })
 */
const db = {
  query: jest.fn(),
};

module.exports = db;
