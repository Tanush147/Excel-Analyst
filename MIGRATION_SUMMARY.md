# Migration Summary: Google Gemini → OpenRouter DeepSeek

## Changes Made

### 1. API Service Migration (`services/geminiService.ts`)
- **Removed**: Google GenAI SDK dependency
- **Added**: Direct fetch calls to OpenRouter API endpoint
- **Model**: Changed from `gemini-2.5-flash` to `tngtech/deepseek-r1t2-chimera:free`
- **Authentication**: Using OpenRouter API key format

### 2. Environment Variables
- **Changed**: `GEMINI_API_KEY` → `VITE_API_KEY`
- **File**: `.env.local` now contains:
  ```
  VITE_API_KEY=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
  ```

### 3. Vite Configuration (`vite.config.ts`)
- Simplified configuration
- Removed custom `define` section
- Using Vite's native `VITE_` prefix environment variable handling

### 4. TypeScript Configuration
- **Added**: `vite-env.d.ts` for proper TypeScript types
- Defines `ImportMetaEnv` interface for type safety

### 5. Documentation (`README.md`)
- Updated setup instructions
- Documented the DeepSeek model usage
- Clarified OpenRouter API configuration

## API Details

### OpenRouter Endpoint
- **Base URL**: `https://openrouter.ai/api/v1`
- **Endpoint**: `/chat/completions`
- **Model**: `tngtech/deepseek-r1t2-chimera:free`

### Request Headers
- `Authorization`: Bearer token with your API key
- `Content-Type`: application/json
- `HTTP-Referer`: Your site origin
- `X-Title`: Excel AI Analyst

## Features Preserved
✅ Natural language query parsing
✅ Structured execution plan generation
✅ Client-side Excel processing
✅ Natural language response generation
✅ JSON schema validation

## Testing
The dev server is running at: http://localhost:3000/

You can now:
1. Upload an Excel file
2. Ask questions about your data
3. Get AI-powered responses using the DeepSeek model

## Next Steps
To use a different model, update the `MODEL_ID` constant in `services/geminiService.ts` to any OpenRouter-supported model.
