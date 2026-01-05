/**
 * AI Service for analyzing tax filing data using Azure OpenAI
 * Falls back to mock response if Azure OpenAI is not configured or fails
 */

import axios, { AxiosError } from 'axios';
import { AzureOpenAIConfig, WizardAnswers, AnalysisResponse } from '../utils/types';
import { mockAnalysisResult } from '../mock/mockResult';

/**
 * AI Service for tax filing analysis
 * 
 * Azure OpenAI REST API pattern (Chat Completions):
 * POST {endpoint}openai/deployments/{deployment-name}/chat/completions?api-version=2023-12-01-preview
 * 
 * Headers:
 *   api-key: {key}
 *   Content-Type: application/json
 * 
 * Body:
 * {
 *   "messages": [
 *     {"role": "system", "content": "You are a tax filing expert..."},
 *     {"role": "user", "content": "Analyze this tax filing data: ..."}
 *   ],
 *   "temperature": 0.3,
 *   "max_tokens": 2000
 * }
 */
export class AIService {
  private config: AzureOpenAIConfig | null = null;
  private fallbackToMock: boolean;

  constructor() {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key = process.env.AZURE_OPENAI_KEY;
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    const fallbackEnv = process.env.FALLBACK_TO_MOCK;

    this.fallbackToMock = fallbackEnv === 'true' || fallbackEnv === '1';

    if (endpoint && key && deploymentName && !this.fallbackToMock) {
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
  isConfigured(): boolean {
    return this.config !== null && !this.fallbackToMock;
  }

  /**
   * Constructs the prompt for Azure OpenAI analysis
   */
  private buildPrompt(answers: WizardAnswers, ocrText: string): string {
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
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
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
  }

  /**
   * Calls Azure OpenAI to analyze the tax filing data
   */
  async analyzeWithAzureOpenAI(answers: WizardAnswers, ocrText: string): Promise<AnalysisResponse> {
    if (!this.config) {
      throw new Error('Azure OpenAI not configured');
    }

    try {
      const prompt = this.buildPrompt(answers, ocrText);
      
      // Azure OpenAI Chat Completions API endpoint
      const apiVersion = '2023-12-01-preview';
      const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${apiVersion}`;

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
          }
        }
      );

      // Extract content from response
      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Parse JSON response
      let parsedResponse: AnalysisResponse;
      try {
        // Try to extract JSON if wrapped in markdown code blocks
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        parsedResponse = JSON.parse(jsonString.trim());
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', content);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Validate response structure
      if (!this.isValidResponse(parsedResponse)) {
        console.warn('OpenAI response structure invalid, using fallback');
        return this.analyzeFallback(answers, ocrText);
      }

      return parsedResponse;

    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('Azure OpenAI API error:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      
      // Fallback to mock on error
      return this.analyzeFallback(answers, ocrText);
    }
  }

  /**
   * Validates that the response has the required structure
   */
  private isValidResponse(response: any): response is AnalysisResponse {
    return (
      response &&
      typeof response === 'object' &&
      ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(response.riskLevel) &&
      typeof response.summary === 'string' &&
      Array.isArray(response.detectedIssues) &&
      response.detectedIssues.every((issue: any) =>
        issue &&
        typeof issue.id === 'string' &&
        typeof issue.title === 'string' &&
        typeof issue.short === 'string' &&
        typeof issue.long === 'string'
      )
    );
  }

  /**
   * Fallback analysis using mock data
   * In a more sophisticated implementation, this could use rule-based logic
   */
  analyzeFallback(answers: WizardAnswers, ocrText: string): AnalysisResponse {
    console.log('Using fallback mock response');
    
    // For MVP, return the mock result
    // In production, you could add rule-based logic here based on answers
    // For example: if answers indicate capital gains but ITR-1 selected, add specific issue
    
    return mockAnalysisResult;
  }

  /**
   * Main analysis method - tries Azure OpenAI first, falls back to mock if needed
   */
  async analyze(answers: WizardAnswers, ocrText: string): Promise<AnalysisResponse> {
    if (this.isConfigured()) {
      try {
        return await this.analyzeWithAzureOpenAI(answers, ocrText);
      } catch (error) {
        console.error('Azure OpenAI analysis failed, using fallback:', error);
        return this.analyzeFallback(answers, ocrText);
      }
    } else {
      return this.analyzeFallback(answers, ocrText);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();

