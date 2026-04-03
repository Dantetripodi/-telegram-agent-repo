import { classifyInput } from "./classifier.js";
import { saveItem } from "./storage.js";
import { validateInputForSaving } from "./validation.js";

export async function ingestMessage(payload) {
  const rawInput = buildRawInput(payload);

  if (!rawInput) {
    throw new Error("No hay contenido para procesar");
  }

  const validation = validateInputForSaving(rawInput);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const classification = await classifyInput(rawInput);
  const uniqueSeed = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const item = {
    id: `itm_${uniqueSeed}`,
    shortId: uniqueSeed.slice(-6),
    createdAt: new Date().toISOString(),
    source: payload.source || "whatsapp",
    inputType: payload.inputType || "text",
    rawInput,
    ...classification
  };

  await saveItem(item);

  return {
    item,
    reply: buildReply(item)
  };
}

export async function ingestBatch(payload) {
  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  const results = [];

  for (const message of messages) {
    if (!message || typeof message !== "string" || !message.trim()) {
      continue;
    }

    try {
      const result = await ingestMessage({
        text: message.trim(),
        source: payload.source || "web-ui-batch"
      });
      results.push(result);
    } catch {
      continue;
    }
  }

  return {
    count: results.length,
    results,
    reply:
      results.length > 0
        ? `Listo, procese ${results.length} mensajes y ya quedaron guardados.`
        : "No habia mensajes validos para procesar."
  };
}

function buildRawInput(payload) {
  if (payload.text) {
    return payload.text;
  }

  if (payload.audioTranscript) {
    return payload.audioTranscript;
  }

  return "";
}

function buildReply(item) {
  const parts = [`Listo, lo guarde como ${humanizeCategory(item.category)}`];

  if (item.category === "resource" && item.resourceType) {
    parts[0] += ` tipo ${item.resourceType}`;
  }

  parts.push(`ID: ${item.shortId}`);

  if (item.tags.length > 0) {
    parts.push(`Tags: ${item.tags.slice(0, 4).join(", ")}`);
  }

  if (item.suggestedNextAction) {
    parts.push(`Siguiente paso sugerido: ${item.suggestedNextAction}`);
  }

  return `${parts.join(". ")}.`;
}

function humanizeCategory(category) {
  return {
    task: "tarea",
    idea: "idea",
    reminder: "recordatorio",
    follow_up: "seguimiento",
    note: "nota",
    resource: "recurso"
  }[category] || category;
}
