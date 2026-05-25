// authMiddleware already sets req.userRole from DB — no extra query needed
module.exports = function isModerator(req, res, next) {
  if (!req.userRole || (req.userRole !== "moderator" && req.userRole !== "admin")) {
    return res.status(403).json({ error: "Доступ запрещён" });
  }
  next();
};
