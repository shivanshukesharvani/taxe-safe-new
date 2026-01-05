/**
 * AI Service for analyzing tax filing data using Azure OpenAI
 * CRASH-SAFE: Always returns valid response, falls back to mock on any error
 */

const axios = require('axios');
const { getMockResult } = require('../mock/mockResult');
const { safeJsonParse } = require('../utils/safeJson');

class AIService {
  constructor() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key = process.env.AZURE_OPENAI_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const useMockAI = process.env.USE_MOCK_AI === 'true' || process.env.USE_MOCK_AI === '1';

    this.useMock = useMockAI || !endpoint || !key || !deploymentName;

    if (!this.useMock) {
      this.config = {
        endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
        key: key,
        deploymentName: deploymentName
      };
    }
  }

  /**
   * Checks if Azure OpenAI is configured
   */
  isConfigured() {
    return !this.useMock && this.config !== null;
  }

  /**
   * Constructs the prompt for Azure OpenAI analysis
   */
  buildPrompt(answers, ocrText) {
    try {
      const answersText = JSON.stringify(answers, null, 2);
      
      let prompt = `You are a tax filing expert assistant. Analyze the following tax filing information and identify potential mistakes, errors, or issues.

User's Answers from Question Wizard:
${answersText}
`;

      if (ocrText && ocrText.trim().length > 0) {
        prompt += `\n\nExtracted Text from Uploaded Documents (Salary Slip, Form 26AS, etc.):
${ocrText}
`;
      }

      prompt += `\n\nPlease analyze this information and return a JSON response with the following structure:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "summary": "A brief summary of the overall risk assessment",
  "detectedIssues": [
    {
      "id": "unique-id",
      "title": "Issue title",
      "short": "Short description",
      "long": "Detailed explanation of the issue"
    }
  ]
}

Focus on:
1. Wrong ITR form selection
2. Missing or incorrect TDS information
3. HRA claim issues
4. Section 80C limit violations
5. Capital gains reporting errors
6. Any other tax filing mistakes

Return ONLY valid JSON, no additional text or markdown formatting.`;

      return prompt;
    } catch (error) {
      console.error('Error building prompt:', error.message);
      return '';
    }
  }

  /**
   * Calls Azure OpenAI to analyze the tax filing data
   * CRASH-SAFE: Wrapped in try/catch, always returns valid response
   */
  async analyzeWithAzureOpenAI(answers, ocrText) {
    if (!this.config) {
      throw new Error('Azure OpenAI not configured');
    }

    try {
      const prompt = this.buildPrompt(answers, ocrText);
      
      if (!prompt) {
        throw new Error('Failed to build prompt');
      }

      // Azure OpenAI Chat Completions API endpoint
      const apiVersion = '2023-12-01-preview';
      const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${apiVersion}`;

      // Set timeout (5-8 seconds)
      const timeout = 8000;

      const response = await axios.post(
        url,
        {
          messages: [
            {
              role: 'system',
              content: 'You are a tax filing expert assistant. Always respond with valid JSON only, no markdown formatting or additional text.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: 'json_object' } // Request JSON mode if supported
        },
        {
          headers: {
            'api-key': this.config.key,
            'Content-Type': 'application/json'
          },
          timeout: timeout
        }
      );

      // Extract content from response
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse JSON response safely
      const parsedResponse = safeJsonParse(content);
      if (!parsedResponse) {
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Validate response structure
      if (!this.isValidResponse(parsedResponse)) {
        console.warn('OpenAI response structure invalid, using fallback');
        return this.analyzeFallback(answers, ocrText);
      }

      return parsedResponse;

    } catch (error) {
      console.error('Azure OpenAI API error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Fallback to mock on any error
      return this.analyzeFallback(answers, ocrText);
    }
  }

  /**
   * Validates that the response has the required structure
   */
  isValidResponse(response) {
    try {
      if (!response || typeof response !== 'object') {
        return false;
      }

      const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validRiskLevels.includes(response.riskLevel)) {
        return false;
      }

      if (typeof response.summary !== 'string') {
        return false;
      }

      if (!Array.isArray(response.detectedIssues)) {
        return false;
      }

      // Validate each issue
      for (const issue of response.detectedIssues) {
        if (!issue || typeof issue !== 'object') {
          return false;
        }
        if (typeof issue.id !== 'string' ||
            typeof issue.title !== 'string' ||
            typeof issue.short !== 'string' ||
            typeof issue.long !== 'string') {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error validating response:', error.message);
      return false;
    }
  }

  /**
   * Fallback analysis using mock data
   * CRASH-SAFE: Always returns valid mock response
   */
  analyzeFallback(answers, ocrText) {
    try {
      console.log('Using fallback mock response');
      return getMockResult();
    } catch (error) {
      console.error('Error in fallback:', error.message);
      // Ultimate fallback - return minimal valid response
      return {
        riskLevel: 'MEDIUM',
        summary: 'Analysis unavailable. Please try again.',
        detectedIssues: []
      };
    }
  }

  /**
   * Main analysis method - tries Azure OpenAI first, falls back to mock if needed
   * CRASH-SAFE: Wrapped in try/catch, always returns valid response
   */
  async analyzeInput(payload) {
    try {
      const { answers, ocrText } = payload;
      
      if (this.isConfigured()) {
        try {
          return await this.analyzeWithAzureOpenAI(answers, ocrText || '');
        } catch (error) {
          console.error('Azure OpenAI analysis failed, using fallback:', error.message);
          return this.analyzeFallback(answers, ocrText || '');
        }
      } else {
        return this.analyzeFallback(answers, ocrText || '');
      }
    } catch (error) {
      console.error('Error in analyzeInput:', error.message);
      return this.analyzeFallback({}, '');
    }
  }
}

// Export singleton instance
module.exports = new AIService();

