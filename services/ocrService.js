/**
 * OCR Service for extracting text from documents using Azure Document Intelligence
 * CRASH-SAFE: Never throws errors, returns empty string on failure
 */

const axios = require('axios');

class OCRService {
  constructor() {
    const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
    const key = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

    if (endpoint && key) {
      this.config = {
        endpoint: endpoint.replace(/\/$/, ''), // Remove trailing slash
        key: key
      };
    } else {
      this.config = null;
    }
  }

  /**
   * Checks if Azure Document Intelligence is configured
   */
  isConfigured() {
    return this.config !== null;
  }

  /**
   * Extracts text from a document file
   * CRASH-SAFE: Wrapped in try/catch, always returns string (empty on error)
   */
  async extractText(file, mimeType) {
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
          maxRedirects: 0,
          timeout: 30000 // 30 second timeout
        }
      );

      // Get operation location from response headers
      const operationLocation = analyzeResponse.headers['operation-location'];
      if (!operationLocation) {
        console.error('No operation-location header in response');
        return '';
      }

      // Step 2: Poll for results
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
        
        try {
          const resultResponse = await axios.get(resultUrl, {
            headers: {
              'Ocp-Apim-Subscription-Key': this.config.key
            },
            timeout: 10000
          });

          const status = resultResponse.data?.status;
          
          if (status === 'succeeded') {
            // Extract text from content
            const content = resultResponse.data?.analyzeResult?.content || '';
            return content || '';
          }
          
          if (status === 'failed') {
            console.error('Document analysis failed:', resultResponse.data?.error);
            return '';
          }
          
          attempts++;
        } catch (pollError) {
          console.error('Error polling OCR result:', pollError.message);
          attempts++;
        }
      }

      console.warn('OCR analysis timed out after maximum attempts');
      return '';

    } catch (error) {
      console.error('OCR extraction error:', {
        message: error.message,
        status: error.response?.status
      });
      return ''; // Return empty string on error, let AI service work with answers only
    }
  }

  /**
   * Extracts text from multiple files
   * CRASH-SAFE: Handles errors gracefully
   */
  async extractTextFromFiles(files) {
    try {
      if (!files || !Array.isArray(files) || files.length === 0) {
        return '';
      }

      const texts = await Promise.all(
        files.map(file => {
          try {
            return this.extractText(file.buffer, file.mimetype);
          } catch (error) {
            console.error('Error extracting text from file:', error.message);
            return '';
          }
        })
      );
      
      return texts.filter(text => text && text.length > 0).join('\n\n---\n\n');
    } catch (error) {
      console.error('Error in extractTextFromFiles:', error.message);
      return '';
    }
  }
}

// Export singleton instance
module.exports = new OCRService();

