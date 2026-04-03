import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPT_PATH = path.join(__dirname, "..", "config", "system-prompt-v1.md");

export async function classifyWithLlm(rawText) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return null;
  }

  const systemPrompt = await fs.readFile(PROMPT_PATH, "utf8");
  const userPrompt = buildUserPrompt(rawText);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fallo la clasificacion LLM: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = extractText(data);

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildUserPrompt(rawText) {
  return [
    "Clasifica este mensaje y devolve solo JSON valido.",
    "Usa este esquema exacto:",
    '{"category":"task|idea|reminder|follow_up|note|resource","resourceType":"repo|article|video|tool|documentation|reference|null","summary":"string","project":"string","tags":["string"],"priority":"high|normal|low","followUpDate":"string|null","suggestedNextAction":"string","links":[{"url":"string","kind":"string"}]}',
    `Mensaje: ${rawText}`
  ].join("\n");
}

function extractText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      } else if (content.text?.value) {
        parts.push(content.text.value);
      }
    }
  }

  return parts.join("\n").trim();
}
