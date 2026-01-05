/**
 * OCR Service for extracting text from documents using Azure Document Intelligence
 * Falls back gracefully if Azure services are not configured
 */

import axios, { AxiosError } from 'axios';
import { AzureDocIntelligenceConfig } from '../utils/types';

/**
 * Extracts text from a document using Azure Document Intelligence
 * 
 * Azure Document Intelligence REST API pattern:
 * POST {endpoint}/formrecognizer/documentModels/prebuilt-read/analyze?api-version=2023-07-31
 * 
 * Headers:
 *   Ocp-Apim-Subscription-Key: {key}
 *   Content-Type: application/pdf or image/png or image/jpeg
 * 
 * Body: Binary file content
 * 
 * Then poll GET {endpoint}/formrecognizer/documentModels/prebuilt-read/analyzeResults/{resultId}
 * until status is "succeeded", then extract text from result
 */
export class OCRService {
  private config: AzureDocIntelligenceConfig | null = null;

  constructor() {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (endpoint && key) {
      this.config = {
        endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
        key: key
      };
    }
  }

  /**
   * Checks if Azure Document Intelligence is configured
   */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Extracts text from a document file
   * @param file - The file buffer to process
   * @param mimeType - The MIME type of the file
   * @returns Extracted text or empty string if OCR fails or is not configured
   */
  async extractText(file: Buffer, mimeType: string): Promise<string> {
    if (!this.config) {
      console.log('Azure Document Intelligence not configured, skipping OCR');
      return '';
    }

    try {
      // Azure Document Intelligence API endpoint
      const apiVersion = '2023-07-31';
      const analyzeUrl = `${this.config.endpoint}/formrecognizer/documentModels/prebuilt-read/analyze?api-version=${apiVersion}`;

      // Step 1: Submit document for analysis
      const analyzeResponse = await axios.post(
        analyzeUrl,
        file,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.key,
            'Content-Type': mimeType
          },
          maxRedirects: 0
        }
      );

      // Get operation location from response headers
      const operationLocation = analyzeResponse.headers['operation-location'];
      if (!operationLocation) {
        console.error('No operation-location header in response');
        return '';
      }

      // Step 2: Poll for results (simplified - in production, implement proper polling with retries)
      let resultId = operationLocation.split('/').pop()?.split('?')[0];
      if (!resultId) {
        console.error('Could not extract result ID from operation location');
        return '';
      }

      const resultUrl = `${this.config.endpoint}/formrecognizer/documentModels/prebuilt-read/analyzeResults/${resultId}?api-version=${apiVersion}`;
      
      // Poll up to 10 times with 1 second delay
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const resultResponse = await axios.get(resultUrl, {
          headers: {
            'Ocp-Apim-Subscription-Key': this.config.key
          }
        });

        const status = resultResponse.data.status;
        
        if (status === 'succeeded') {
          // Extract text from all pages
          const pages = resultResponse.data.analyzeResult?.pages || [];
          const content = resultResponse.data.analyzeResult?.content || '';
          
          // Return the full content text
          return content || '';
        }
        
        if (status === 'failed') {
          console.error('Document analysis failed:', resultResponse.data.error);
          return '';
        }
        
        attempts++;
      }

      console.warn('OCR analysis timed out after maximum attempts');
      return '';

    } catch (error) {
      const axiosError = error as AxiosError;
      console.error('OCR extraction error:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      return ''; // Return empty string on error, let AI service work with answers only
    }
  }

  /**
   * Extracts text from multiple files
   * @param files - Array of file objects with buffer and mimetype
   * @returns Combined extracted text from all files
   */
  async extractTextFromFiles(files: Array<{ buffer: Buffer; mimetype: string }>): Promise<string> {
    const texts = await Promise.all(
      files.map(file => this.extractText(file.buffer, file.mimetype))
    );
    
    return texts.filter(text => text.length > 0).join('\n\n---\n\n');
  }
}

// Export singleton instance
export const ocrService = new OCRService();

