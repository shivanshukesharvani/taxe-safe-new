/**
 * Main server file for Tax Filing Mistake Checker API
 * Express server with CORS, error handling, and route configuration
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './utils/errorHandler';
import analyzeRoutes from './routes/analyze';
import { rateLimit } from './middlewares/rateLimit';

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Middleware
// CORS: Enable for all origins (MVP) - In production, restrict to specific frontend domains
app.use(cors({
  origin: '*', // Allow all origins for MVP
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser for JSON requests (for application/json content type)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (optional, basic implementation)
// In production, use express-rate-limit with Redis
app.use(rateLimit);

// Request logging (simple console logging for MVP)
// In production, use proper logging library like Winston
app.use((req: Request, res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Tax Filing Mistake Checker API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze'
    }
  });
});

// API routes
app.use('/api', analyzeRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📍 Analyze endpoint: http://localhost:${PORT}/api/analyze`);
  
  // Log configuration status
  const hasOpenAI = !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
  const hasDocIntelligence = !!(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
  const fallbackToMock = process.env.FALLBACK_TO_MOCK === 'true' || process.env.FALLBACK_TO_MOCK === '1';
  
  console.log('\n📋 Configuration Status:');
  console.log(`   Azure OpenAI: ${hasOpenAI && !fallbackToMock ? '✅ Configured' : '❌ Not configured (using mock)'}`);
  console.log(`   Azure Document Intelligence: ${hasDocIntelligence ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Fallback to Mock: ${fallbackToMock ? '✅ Enabled' : '❌ Disabled'}`);
});

export default app;

