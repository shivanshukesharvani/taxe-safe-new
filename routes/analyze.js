/**
 * Routes for the analyze endpoint
 * CRASH-SAFE: All routes wrapped in error handlers
 */

const express = require('express');
const multer = require('multer');
const { asyncHandler, createError } = require('../middlewares/errorHandler');
const { validateAnswers, parseAnswers } = require('../utils/validateInput');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');

const router = express.Router();

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// File filter
const fileFilter = (req, file, cb) => {
  try {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only PDF, PNG, and JPG files are allowed. Received: ${file.mimetype}`));
    }
  } catch (error) {
    console.error('File filter error:', error.message);
    cb(error);
  }
};

// Configure multer with memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 2 // Maximum 2 files
  },
  fileFilter: fileFilter
});

/**
 * POST /api/analyze
 * 
 * Analyzes tax filing data from question wizard answers and optional document uploads
 * 
 * Request format:
 * - Content-Type: multipart/form-data (recommended if files) or application/json
 * - Body:
 *   - answers: JSON string or object (required)
 *   - salarySlip: File (optional, PDF/PNG/JPG, max 5MB)
 *   - form26as: File (optional, PDF/PNG/JPG, max 5MB)
 * 
 * Response:
 * {
 *   "riskLevel": "LOW" | "MEDIUM" | "HIGH",
 *   "summary": "Summary text",
 *   "detectedIssues": [...]
 * }
 */
router.post(
  '/analyze',
  // Handle file uploads (optional) - only for multipart/form-data
  (req, res, next) => {
    try {
      // Only use multer if Content-Type is multipart/form-data
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('multipart/form-data')) {
        upload.fields([
          { name: 'salarySlip', maxCount: 1 },
          { name: 'form26as', maxCount: 1 }
        ])(req, res, (err) => {
          if (err) {
            // Handle multer errors
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
          }
          next();
        });
      } else {
        // For application/json, skip multer
        next();
      }
    } catch (error) {
      console.error('Upload middleware error:', error.message);
      next(error);
    }
  },
  // Main handler
  asyncHandler(async (req, res, next) => {
    try {
      // Step 1: Validate input
      let answers = null;
      
      // Try to get answers from request body
      if (req.body.answers) {
        answers = parseAnswers(req.body.answers);
      } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        // If entire body is answers object (for application/json requests)
        // Check if it looks like answers (not file upload fields)
        if (!req.body.salarySlip && !req.body.form26as) {
          answers = parseAnswers(req.body);
        }
      }

      // Validate answers
      const validation = validateAnswers(answers);
      if (!validation.valid) {
        throw createError(validation.error, 400);
      }

      // Step 2: Extract text from uploaded documents using OCR (if files present)
      let ocrText = '';
      const files = req.files;
      const filesToProcess = [];

      if (files) {
        if (files.salarySlip && files.salarySlip[0]) {
          filesToProcess.push({
            buffer: files.salarySlip[0].buffer,
            mimetype: files.salarySlip[0].mimetype
          });
        }
        if (files.form26as && files.form26as[0]) {
          filesToProcess.push({
            buffer: files.form26as[0].buffer,
            mimetype: files.form26as[0].mimetype
          });
        }
      }

      if (filesToProcess.length > 0 && ocrService.isConfigured()) {
        try {
          console.log('Extracting text from documents using OCR...');
          ocrText = await ocrService.extractTextFromFiles(filesToProcess);
          console.log(`OCR extracted ${ocrText.length} characters of text`);
        } catch (error) {
          console.error('OCR extraction failed, continuing without OCR text:', error.message);
          // Continue without OCR text - AI service can still work with answers
        }
      } else if (filesToProcess.length > 0) {
        console.log('OCR service not configured, skipping document text extraction');
      }

      // Step 3: Prepare AI payload
      const payload = {
        answers: answers,
        ocrText: ocrText
      };

      // Step 4: Analyze using AI service (Azure OpenAI or fallback)
      console.log('Analyzing tax filing data...');
      const analysisResult = await aiService.analyzeInput(payload);

      // Step 5: Validate AI output (should already be validated, but double-check)
      if (!analysisResult || typeof analysisResult !== 'object') {
        console.warn('Invalid AI output, using fallback');
        const { getMockResult } = require('../mock/mockResult');
        return res.status(200).json(getMockResult());
      }

      // Step 6: Return clean JSON response
      res.status(200).json(analysisResult);

    } catch (error) {
      // Error should be handled by asyncHandler, but just in case
      console.error('Error in analyze endpoint:', error.message);
      next(error);
    }
  })
);

module.exports = router;

