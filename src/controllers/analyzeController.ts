/**
 * Controller for the /api/analyze endpoint
 * Handles request processing, file uploads, OCR, and AI analysis
 */

import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { parseAnswers } from '../utils/validation';
import { ocrService } from '../services/ocrService';
import { aiService } from '../services/aiService';
import { WizardAnswers } from '../utils/types';

/**
 * Main analyze endpoint handler
 * POST /api/analyze
 * 
 * Expected request:
 * - Content-Type: multipart/form-data (if files) OR application/json
 * - Body fields:
 *   - answers: JSON string or object with wizard answers
 *   - salarySlip: (optional) PDF/image file
 *   - form26as: (optional) PDF/image file
 */
export const analyzeTaxFiling = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Parse answers from request
    // Multer may have parsed it as a string, or it might be in req.body.answers
    let answers: WizardAnswers;
    
    if (req.body.answers) {
      answers = parseAnswers(req.body.answers);
    } else {
      // If answers not in body, try to parse entire body as JSON (for application/json requests)
      if (typeof req.body === 'object' && req.body.answers) {
        answers = parseAnswers(req.body.answers);
      } else {
        throw new Error('Answers field is required');
      }
    }

    // Extract uploaded files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const salarySlip = files?.salarySlip?.[0];
    const form26as = files?.form26as?.[0];

    console.log('Processing analysis request:', {
      hasAnswers: !!answers,
      hasSalarySlip: !!salarySlip,
      hasForm26as: !!form26as
    });

    // Step 1: Extract text from uploaded documents using OCR
    let ocrText = '';
    const filesToProcess: Array<{ buffer: Buffer; mimetype: string }> = [];

    if (salarySlip) {
      filesToProcess.push({
        buffer: salarySlip.buffer,
        mimetype: salarySlip.mimetype
      });
    }

    if (form26as) {
      filesToProcess.push({
        buffer: form26as.buffer,
        mimetype: form26as.mimetype
      });
    }

    if (filesToProcess.length > 0 && ocrService.isConfigured()) {
      try {
        console.log('Extracting text from documents using OCR...');
        ocrText = await ocrService.extractTextFromFiles(filesToProcess);
        console.log(`OCR extracted ${ocrText.length} characters of text`);
      } catch (error) {
        console.error('OCR extraction failed, continuing without OCR text:', error);
        // Continue without OCR text - AI service can still work with answers
      }
    } else if (filesToProcess.length > 0) {
      console.log('OCR service not configured, skipping document text extraction');
    }

    // Step 2: Analyze using AI service (Azure OpenAI or fallback)
    console.log('Analyzing tax filing data...');
    const analysisResult = await aiService.analyze(answers, ocrText);

    // Step 3: Return results
    res.status(200).json(analysisResult);
  }
);

