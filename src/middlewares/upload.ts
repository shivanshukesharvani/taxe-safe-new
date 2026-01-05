/**
 * Multer configuration for file uploads
 * Handles multipart/form-data requests with file attachments
 */

import multer from 'multer';
import { Request } from 'express';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * File filter to accept only PDF and image files
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only PDF, PNG, and JPG files are allowed. Received: ${file.mimetype}`));
  }
};

/**
 * Configure multer to store files in memory
 * For production, consider using cloud storage (Azure Blob Storage, AWS S3, etc.)
 * and configure multer to upload directly to cloud storage
 */
const storage = multer.memoryStorage();

/**
 * Multer middleware configuration
 * Accepts up to 2 files: salarySlip and form26as
 * Files are stored in memory for immediate processing/upload to Azure services
 */
export const uploadMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2 // Maximum 2 files
  },
  fileFilter: fileFilter
}).fields([
  { name: 'salarySlip', maxCount: 1 },
  { name: 'form26as', maxCount: 1 }
]);

/**
 * Error handler for multer errors
 */
export const handleUploadError = (err: any, req: Request, res: any, next: any): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds the maximum limit of 5MB' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum 2 files allowed.' });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }
  next();
};

