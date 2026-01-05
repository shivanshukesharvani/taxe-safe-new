/**
 * Main server file for Tax Filing Mistake Checker API
 * CRASH-RESISTANT: Handles all errors gracefully, never crashes
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ============================================
// CRASH SAFETY: Global error handlers
// ============================================
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION - Server will continue running:', error.message);
  console.error(error.stack);
  // Keep server alive - don't crash
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION - Server will continue running:', reason);
  // Keep server alive - don't crash
});

// ============================================
// Middleware Configuration
// ============================================

// CORS: Enable for all origins (MVP)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser for JSON requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  try {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  } catch (error) {
    console.error('Request logging error:', error.message);
    next();
  }
});

// ============================================
// Routes
// ============================================

// Health check endpoint
app.get('/', (req, res) => {
  try {
    res.json({
      status: 'ok',
      message: 'Tax Filing Mistake Checker API',
      version: '1.0.0',
      endpoints: {
        analyze: 'POST /api/analyze'
      }
    });
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// API routes
try {
  const analyzeRoutes = require('./routes/analyze');
  app.use('/api', analyzeRoutes);
} catch (error) {
  console.error('Failed to load analyze routes:', error.message);
  // Server continues, but /api/analyze will return 404
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// ============================================
// Start Server
// ============================================
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/`);
  console.log(`📍 Analyze endpoint: http://localhost:${PORT}/api/analyze`);
  
  // Log configuration status
  const hasOpenAI = !!(process.env.AZURE_OPENAI_ENDPOINT && 
                       process.env.AZURE_OPENAI_KEY && 
                       process.env.AZURE_OPENAI_DEPLOYMENT_NAME);
  const hasDocIntelligence = !!(process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT && 
                                process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);
  const useMockAI = process.env.USE_MOCK_AI === 'true' || process.env.USE_MOCK_AI === '1';
  
  console.log('\n📋 Configuration Status:');
  console.log(`   Azure OpenAI: ${hasOpenAI && !useMockAI ? '✅ Configured' : '❌ Not configured (using mock)'}`);
  console.log(`   Azure Document Intelligence: ${hasDocIntelligence ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`   Use Mock AI: ${useMockAI ? '✅ Enabled' : '❌ Disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

