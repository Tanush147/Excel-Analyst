<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Excel AI Analyst

An intelligent Excel data analyzer powered by AI. Upload your Excel files and ask questions in natural language.

## Features

- 📊 Parse Excel/XLSX files client-side
- 🤖 Natural language queries powered by DeepSeek AI via OpenRouter
- 🔒 Secure - your data stays in your browser
- ⚡ Fast execution with structured query planning

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `VITE_API_KEY` in `.env.local` to your OpenRouter API key:
   ```
   VITE_API_KEY=your_openrouter_api_key_here
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Configuration

This app uses the **DeepSeek R1T2 Chimera** model via OpenRouter API (`tngtech/deepseek-r1t2-chimera:free`).

To use a different model, update the `MODEL_ID` constant in `services/geminiService.ts`.

