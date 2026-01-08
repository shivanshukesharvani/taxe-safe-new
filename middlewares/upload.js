// middlewares/upload.js

const multer = require("multer");

const storage = multer.memoryStorage(); // Azure upload ke liye best

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // double safety (5MB)
  },
});

module.exports = upload;
