# Tax Filing Mistake Checker - Backend API

A **STABLE, CRASH-RESISTANT** Node.js backend API for analyzing tax filing data and detecting potential mistakes. Built for Microsoft Imagine Cup–level projects with reliability as the top priority.

## 🎯 Project Overview

This backend provides a single API endpoint (`POST /api/analyze`) that:
- Accepts tax filing data from a question wizard (JSON)
- Optionally processes uploaded documents (salary slips, Form 26AS) using OCR
- Analyzes the data using Azure OpenAI (if configured) or returns mock results
- Returns a structured JSON response with risk level and detected issues

**Purpose:** Act as decision-support tool, NOT tax filing or advice.

## 🛡️ Stability Features

- ✅ **Never crashes** - All errors are caught and handled gracefully
- ✅ **Fallback to mock** - If Azure AI fails, returns mock result automatically
- ✅ **OCR optional** - If OCR fails, continues without OCR text
- ✅ **Input validation** - Invalid requests return clean 400 errors
- ✅ **No stack traces** - Never exposes internal errors to clients
- ✅ **Always valid JSON** - Every response is guaranteed valid JSON
- ✅ **Process-level protection** - Handles uncaught exceptions and unhandled rejections

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
PORT=3000

# Azure OpenAI (optional - leave empty to use mock responses)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name

# Azure Document Intelligence (optional - leave empty to skip OCR)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-key-here

# Set to true to always use mock responses (recommended for demos)
USE_MOCK_AI=true
```

**Note:** 
- If Azure keys are not provided OR `USE_MOCK_AI=true`, the API will return mock responses automatically.
- **For Imagine Cup demo:** Set `USE_MOCK_AI=true` for maximum reliability.

### 3. Run Server

```bash
node index.js
```

Or:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## 📡 API Endpoints

### Health Check

```
GET /
```

Returns server status and available endpoints.

**Response:**
```json
{
  "status": "ok",
  "message": "Tax Filing Mistake Checker API",
  "version": "1.0.0",
  "endpoints": {
    "analyze": "POST /api/analyze"
  }
}
```

### Analyze Tax Filing

```
POST /api/analyze
```

Analyzes tax filing data and returns detected issues.

#### Request Format

**Content-Type:** `multipart/form-data` (recommended if uploading files) or `application/json`

**Body Fields:**
- `answers` (required): JSON string or object containing question wizard answers
- `salarySlip` (optional): PDF, PNG, or JPG file (max 5MB)
- `form26as` (optional): PDF, PNG, or JPG file (max 5MB)

#### Example Request (cURL)

**With files (multipart/form-data):**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "answers={\"itrForm\":\"ITR-1\",\"hasCapitalGains\":true,\"hraClaimed\":true}" \
  -F "salarySlip=@/path/to/salary-slip.pdf" \
  -F "form26as=@/path/to/form26as.pdf"
```

**Without files (application/json):**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "itrForm": "ITR-1",
      "hasCapitalGains": true,
      "hraClaimed": true,
      "section80C": 200000
    }
  }'
```

#### Response Format

```json
{
  "riskLevel": "MEDIUM",
  "summary": "Based on the provided information, several potential issues were identified...",
  "detectedIssues": [
    {
      "id": "i1",
      "title": "Possible Wrong ITR Form Selected",
      "short": "Capital gains detected but ITR-1 selected. ITR-2 or ITR-3 may be required.",
      "long": "You have indicated capital gains in your responses, but ITR-1 was selected..."
    },
    {
      "id": "i2",
      "title": "Missing TDS Information",
      "short": "Form 26AS not uploaded. TDS verification recommended.",
      "long": "Form 26AS contains details of all tax deducted at source..."
    }
  ]
}
```

**Risk Levels:**
- `LOW`: Minor issues or no issues detected
- `MEDIUM`: Some potential issues found
- `HIGH`: Significant issues that need attention

#### Error Responses

**400 Bad Request:**
```json
{
  "error": "Something went wrong. Please try again."
}
```

**500 Internal Server Error:**
```json
{
  "error": "Something went wrong. Please try again."
}
```

*Note: Error messages are intentionally generic for security. Check server logs for details.*

## 🔧 Azure Configuration

### Azure OpenAI Setup

1. Create an Azure OpenAI resource in the Azure Portal
2. Deploy a model (e.g., GPT-4, GPT-3.5-turbo)
3. Get your endpoint URL (format: `https://your-resource.openai.azure.com/`)
4. Get your API key from the Azure Portal
5. Note your deployment name

Add these to your `.env` file:
```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
```

### Azure Document Intelligence Setup

1. Create an Azure Document Intelligence (Form Recognizer) resource
2. Get your endpoint URL (format: `https://your-resource.cognitiveservices.azure.com/`)
3. Get your API key from the Azure Portal

Add these to your `.env` file:
```env
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your-api-key
```

## 🚀 Deployment to Azure App Service

### Prerequisites

- Azure account
- GitHub repository with this code

### Steps

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/taxsafe-backend.git
   git push -u origin main
   ```

2. **Create Azure App Service**
   - Go to Azure Portal → Create Resource → Web App
   - Choose Node.js runtime stack (18 LTS or 20 LTS)
   - Select your subscription and resource group
   - Create the app service

3. **Configure Environment Variables**
   - In Azure Portal, go to your App Service → Configuration → Application settings
   - Add all environment variables from your `.env` file:
     - `PORT` (usually auto-set by Azure, but can override)
     - `AZURE_OPENAI_ENDPOINT`
     - `AZURE_OPENAI_KEY`
     - `AZURE_OPENAI_DEPLOYMENT_NAME`
     - `AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT`
     - `AZURE_DOCUMENT_INTELLIGENCE_KEY`
     - `USE_MOCK_AI` (set to `true` for demo reliability)

4. **Configure Startup Command**
   - Go to Configuration → General settings
   - Set Startup Command to: `node index.js`

5. **Deploy from GitHub**
   - Go to Deployment Center in your App Service
   - Connect your GitHub repository
   - Select the branch (usually `main`)
   - Azure will automatically deploy

6. **Verify Deployment**
   - Visit `https://your-app-name.azurewebsites.net/`
   - You should see the health check response

### Alternative: Deploy via Azure CLI

```bash
# Login to Azure
az login

# Create resource group
az group create --name taxsafe-rg --location eastus

# Create App Service plan
az appservice plan create --name taxsafe-plan --resource-group taxsafe-rg --sku B1 --is-linux

# Create web app
az webapp create --resource-group taxsafe-rg --plan taxsafe-plan --name taxsafe-backend --runtime "NODE:18-lts"

# Set environment variables
az webapp config appsettings set --resource-group taxsafe-rg --name taxsafe-backend --settings \
  PORT=3000 \
  USE_MOCK_AI=true \
  AZURE_OPENAI_ENDPOINT="your-endpoint" \
  AZURE_OPENAI_KEY="your-key" \
  AZURE_OPENAI_DEPLOYMENT_NAME="your-deployment"

# Deploy from GitHub
az webapp deployment source config --name taxsafe-backend --resource-group taxsafe-rg \
  --repo-url https://github.com/yourusername/taxsafe-backend.git \
  --branch main --manual-integration
```

## 📁 Project Structure

```
/
├── index.js                    # Main server file
├── package.json
├── .env.example
├── README.md
├── /services
│   ├── aiService.js           # Azure OpenAI integration
│   └── ocrService.js          # Azure Document Intelligence integration
├── /mock
│   └── mockResult.js         # Mock response data
├── /utils
│   ├── validateInput.js      # Input validation utilities
│   └── safeJson.js           # Safe JSON parsing
└── /middlewares
    └── errorHandler.js       # Error handling middleware
└── /routes
    └── analyze.js            # Analyze route handler
```

## 🎯 Request Handling Flow

1. **Validate input** using `validateInput.js`
   - If missing answers → return 400 with message
2. **If files present:**
   - Try OCR via `ocrService`
   - If OCR fails → log warning, continue
3. **Prepare AI payload:**
   - Combine answers + OCR text
4. **AI decision:**
   - If `USE_MOCK_AI=true` OR Azure keys missing → return `mockResult`
   - Else try Azure OpenAI
5. **Validate AI output:**
   - Must be valid JSON
   - Must contain required fields
   - If invalid → fallback to mock
6. **Return clean JSON response**

## 🛡️ Crash Safety Rules

- `process.on('uncaughtException')` handler - logs error, keeps server alive
- `process.on('unhandledRejection')` handler - logs error, keeps server alive
- All external calls wrapped in try/catch
- All async functions wrapped in error handlers
- Never throw errors to client
- Always return valid JSON

## 🎓 Imagine Cup Demo Notes

**For maximum reliability during demo:**

1. Set `USE_MOCK_AI=true` in `.env` or Azure App Service configuration
2. This ensures the backend always returns valid responses even if Azure services fail
3. Mock responses are realistic and demonstrate the system's capabilities
4. The backend will never crash, ensuring a smooth demo experience

## 🔍 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js version: `node --version` (should be 18+)
- Check for syntax errors in `index.js`

### Mock responses always returned
- Check `.env` file exists and `USE_MOCK_AI` is not set to `true`
- Verify Azure environment variables are set correctly
- Check server logs for configuration status on startup

### File upload fails
- Verify file size is under 5MB
- Check file type is PDF, PNG, or JPG
- Ensure `Content-Type` header is `multipart/form-data`

### Azure API errors
- Verify endpoint URLs are correct
- Check API keys are correct and not expired
- Verify deployment names match exactly
- Check Azure service quotas and limits
- **Solution:** Set `USE_MOCK_AI=true` to use fallback

## 📝 Development

### Scripts

- `npm start` - Start server
- `node index.js` - Start server (alternative)

### Testing with Mock Responses

To test without Azure services, set in `.env`:
```env
USE_MOCK_AI=true
```

The API will always return mock responses regardless of Azure configuration.

## ⚠️ Security Notes (Production)

This is an MVP implementation. For production:

1. **CORS:** Restrict CORS to specific frontend domains instead of `*`
2. **Rate Limiting:** Add proper rate limiting (currently basic)
3. **Authentication:** Add API key or JWT authentication
4. **Logging:** Use proper logging library (Winston) with log aggregation
5. **File Storage:** Use cloud storage (Azure Blob Storage) instead of memory storage
6. **Input Validation:** Enhance validation with more comprehensive checks
7. **HTTPS:** Always use HTTPS in production
8. **Environment Variables:** Never commit `.env` file, use Azure App Service configuration

## 📄 License

ISC

## 🆘 Support

For issues or questions, please open an issue on GitHub.

---

**Built for stability. Designed for demos. Ready for production.**
