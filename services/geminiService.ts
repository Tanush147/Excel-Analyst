import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisPlan, SheetSchema, AnalysisResult, AggregationType, FilterOperator } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateExecutionPlan = async (
  question: string,
  schema: SheetSchema[]
): Promise<AnalysisPlan> => {
  const modelId = "gemini-2.5-flash";

  const schemaDescription = schema.map(s => 
    `Sheet: "${s.sheetName}"\nColumns: ${s.columns.join(', ')}\nSample Data: ${JSON.stringify(s.sample)}`
  ).join('\n\n');

  const prompt = `
    You are a data analyst. Convert the user's natural language question into a structured execution plan for an Excel workbook.
    
    Workbook Schema:
    ${schemaDescription}

    User Question: "${question}"

    Instructions:
    1. Identify the most relevant sheet.
    2. Identify any necessary filters based on the question.
    3. Identify the aggregation method (SUM, AVERAGE, COUNT, MIN, MAX) and the target column. If the user wants to see rows, use 'list'.
    4. Return ONLY a valid JSON object matching the requested schema.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sheetName: { type: Type.STRING, description: "The exact name of the sheet to use" },
          reasoning: { type: Type.STRING, description: "Brief explanation of why this plan was chosen" },
          filters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                column: { type: Type.STRING },
                operator: { type: Type.STRING, enum: Object.values(FilterOperator) },
                value: { type: Type.STRING }
              }
            }
          },
          aggregation: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: Object.values(AggregationType) },
              column: { type: Type.STRING }
            }
          },
          limit: { type: Type.NUMBER, description: "Limit for list operations" }
        },
        required: ["sheetName", "aggregation", "reasoning"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No plan generated");
  }

  return JSON.parse(response.text) as AnalysisPlan;
};

export const generateNaturalLanguageResponse = async (
  question: string,
  result: AnalysisResult
): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  const prompt = `
    You are a helpful data analyst assistant. 
    User Question: "${question}"
    
    We executed a data query plan.
    Plan Reasoning: "${result.meta.generatedPlan.reasoning}"
    Records Scanned: ${result.meta.recordCount}
    
    Calculated Result:
    ${JSON.stringify(result.answer, null, 2)}
    
    Please provide a friendly, concise, natural language answer to the user's question based on this result. 
    If the result is a list of rows, summarize them briefly or present them in a readable markdown table.
    Do not mention the internal "plan" or technical details unless relevant to explaining the answer.
  `;

  const response = await ai.models.generateContent({
    model: modelId,
    contents: prompt,
  });

  return response.text || "I processed the data but couldn't generate a summary.";
};