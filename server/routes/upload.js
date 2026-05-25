const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const uploadBase = path.join(__dirname, "../uploads");

function createMulterStorage(folderName) {
  const fullPath = path.join(uploadBase, folderName);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });

  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, uniqueName);
    },
  });
}

const ALLOWED_FOLDERS = new Set(["avatars", "cars", "parts"]);

function uploadMiddleware(req, res, next) {
  const folder = req.query.folder;
  if (!folder || !ALLOWED_FOLDERS.has(folder)) {
    return res.status(400).json({ error: "Недопустимый параметр folder" });
  }
  const storage = createMulterStorage(folder);

  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype);
      if (ext && mime) {
        cb(null, true);
      } else {
        cb(new Error("Разрешены только изображения jpeg/jpg/png/webp"));
      }
    },
  }).single("file");

  upload(req, res, function (err) {
    if (err) {
      const safe = err instanceof multer.MulterError || err.message?.startsWith("Разрешены");
      return res.status(400).json({ error: safe ? err.message : "Ошибка загрузки файла" });
    }
    next();
  });
}

router.post("/", uploadMiddleware, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не загружен" });
  }

  const folder = req.query.folder;
  const url = `/uploads/${folder}/${req.file.filename}`;

  res.json({ url });
});

/**
 * Middleware для загрузки аватарки при регистрации (папка "avatars" хардкодом).
 * Не требует ?folder= в query.
 */
function avatarUploadMiddleware(req, res, next) {
  const storage = createMulterStorage("avatars");
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype);
      if (ext && mime) cb(null, true);
      else cb(new Error("Разрешены только изображения jpeg/jpg/png/webp"));
    },
  }).single("file");

  upload(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}

module.exports = {
  router,
  uploadMiddleware,
  avatarUploadMiddleware,
};
