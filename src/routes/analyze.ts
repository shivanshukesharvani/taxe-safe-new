/**
 * Routes for the analyze endpoint
 */

import { Router } from 'express';
import { analyzeTaxFiling } from '../controllers/analyzeController';
import { uploadMiddleware, handleUploadError } from '../middlewares/upload';
import { validateAnswers, checkValidation } from '../utils/validation';

const router = Router();

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
 *   "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
 *   "summary": "Summary text",
 *   "detectedIssues": [...]
 * }
 */
router.post(
  '/analyze',
  uploadMiddleware, // Handle file uploads
  handleUploadError, // Handle upload errors
  validateAnswers, // Validate answers field
  checkValidation, // Check validation results
  analyzeTaxFiling // Process the analysis
);

export default router;

