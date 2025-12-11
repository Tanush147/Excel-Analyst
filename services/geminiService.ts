import { AnalysisPlan, SheetSchema, AnalysisResult, AggregationType, FilterOperator } from "../types";

const API_KEY = import.meta.env.VITE_API_KEY;
const MODEL_ID = "mistralai/devstral-2512:free";
const API_BASE_URL = "https://openrouter.ai/api/v1";

async function callOpenRouter(messages: Array<{ role: string; content: string }>, responseFormat?: { type: string; schema: any }): Promise<string> {
  const body: any = {
    model: MODEL_ID,
    messages: messages,
  };

  if (responseFormat && responseFormat.type) {
    body.response_format = { type: responseFormat.type };
  }

  console.log('🔵 OpenRouter Request:', {
    model: MODEL_ID,
    messageCount: messages.length,
    hasResponseFormat: !!responseFormat
  });

  try {
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Excel AI Analyst"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔴 OpenRouter API Error:', response.status, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🟢 OpenRouter Response:', data);

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('🔴 No content in response:', data);
      throw new Error("No content in API response");
    }

    return content;
  } catch (error) {
    console.error('🔴 OpenRouter Call Failed:', error);
    throw error;
  }
}

export const generateExecutionPlan = async (
  question: string,
  schema: SheetSchema[]
): Promise<AnalysisPlan> => {
  const schemaDescription = schema.map(s =>
    `Sheet: "${s.sheetName}"\nColumns: ${s.columns.join(', ')}\nSample Data: ${JSON.stringify(s.sample)}`
  ).join('\n\n');

  const jsonSchema = {
    type: "object",
    properties: {
      sheetName: { type: "string", description: "The exact name of the sheet to use" },
      reasoning: { type: "string", description: "Brief explanation of why this plan was chosen" },
      filters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            column: { type: "string" },
            operator: { type: "string", enum: Object.values(FilterOperator) },
            value: { type: "string" }
          }
        }
      },
      aggregation: {
        type: "object",
        properties: {
          type: { type: "string", enum: Object.values(AggregationType) },
          column: { type: "string" }
        }
      },
      limit: { type: "number", description: "Limit for list operations" }
    },
    required: ["sheetName", "aggregation", "reasoning"]
  };

  const prompt = `You are a data analyst. Convert the user's natural language question into a structured execution plan for an Excel workbook.

Workbook Schema:
${schemaDescription}

User Question: "${question}"

Instructions:
1. Identify the most relevant sheet.
2. Identify any necessary filters based on the question.
3. Identify the aggregation method (SUM, AVERAGE, COUNT, MIN, MAX) and the target column. If the user wants to see rows, use 'list'.
4. Return ONLY a valid JSON object matching the requested schema.

The JSON schema you must follow:
${JSON.stringify(jsonSchema, null, 2)}`;

  const responseText = await callOpenRouter(
    [{ role: "user", content: prompt }],
    { type: "json_object", schema: undefined }
  );

  return JSON.parse(responseText) as AnalysisPlan;
};

export const generateNaturalLanguageResponse = async (
  question: string,
  result: AnalysisResult
): Promise<string> => {
  const prompt = `You are a helpful data analyst assistant. 
User Question: "${question}"

We executed a data query plan.
Plan Reasoning: "${result.meta.generatedPlan.reasoning}"
Records Scanned: ${result.meta.recordCount}

Calculated Result:
${JSON.stringify(result.answer, null, 2)}

Please provide a friendly, concise, natural language answer to the user's question based on this result. 
If the result is a list of rows, summarize them briefly or present them in a readable markdown table.
Do not mention the internal "plan" or technical details unless relevant to explaining the answer.`;

  const responseText = await callOpenRouter([
    { role: "user", content: prompt }
  ]);

  return responseText || "I processed the data but couldn't generate a summary.";
};