// middlewares/fileValidation.js

/**
 * File validation middleware
 * - Type check (PDF / PNG / JPG)
 * - Size limit (5MB)
 * Security + Judges friendly
 */

const ALLOWED_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function fileValidation(req, res, next) {
  const file = req.file;

  // File optional hai (user bina file bhi submit kar sakta hai)
  if (!file) return next();

  // 🔒 MIME type check
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      error: "Invalid file type. Only PDF, PNG, JPG allowed.",
    });
  }

  // 📏 Size check
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      error: "File too large. Maximum allowed size is 5MB.",
    });
  }

  // ✅ File safe → next middleware / controller
  next();
}

module.exports = fileValidation;
