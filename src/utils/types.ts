/**
 * Type definitions for the Tax Filing Mistake Checker API
 */

// Wizard answers from the frontend
export interface WizardAnswers {
  [key: string]: any; // Flexible structure to accommodate various question types
}

// Detected issue structure
export interface DetectedIssue {
  id: string;
  title: string;
  short: string;
  long: string;
}

// API response structure
export interface AnalysisResponse {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  detectedIssues: DetectedIssue[];
}

// Request body structure for /api/analyze
export interface AnalyzeRequest {
  answers: WizardAnswers;
  salarySlip?: Express.Multer.File;
  form26as?: Express.Multer.File;
}

// Azure OpenAI configuration
export interface AzureOpenAIConfig {
  endpoint: string;
  key: string;
  deploymentName: string;
}

// Azure Document Intelligence configuration
export interface AzureDocIntelligenceConfig {
  endpoint: string;
  key: string;
}

