import { classifyWithLlm } from "./llm-classifier.js";

const CATEGORY_KEYWORDS = {
  task: ["hacer", "tengo que", "pendiente", "resolver", "armar", "implementar"],
  idea: ["idea", "podria", "capaz", "se me ocurre", "estaria bueno"],
  reminder: ["recordame", "acordate", "no olvidar", "mañana", "viernes", "lunes"],
  follow_up: ["seguimiento", "follow up", "hablar con", "escribirle a", "responderle a"],
  note: ["nota", "anotar", "dato", "me di cuenta"],
  resource: ["repo", "github", "link", "articulo", "documentacion", "tool", "tutorial", "guia", "docs", "referencia"]
};

const STOPWORDS = new Set([
  "este",
  "esta",
  "para",
  "como",
  "con",
  "por",
  "una",
  "que",
  "del",
  "las",
  "los",
  "despues",
  "quiero",
  "usar",
  "guardar",
  "este",
  "repo",
  "link",
  "todos",
  "todas",
  "respuesta",
  "resources",
  "resource",
  "cosa",
  "cosas"
]);

export async function classifyInput(rawText) {
  const llmResult = await tryLlm(rawText);
  if (llmResult) {
    return normalizeLlmResult(rawText, llmResult);
  }

  const normalizedText = normalizeText(rawText);
  const links = extractLinks(rawText);
  const resourceType = detectResourceType(links, normalizedText);
  const category = detectCategory(normalizedText, links, resourceType);
  const tags = buildTags(normalizedText, links, category, resourceType);
  const summary = buildSummary(normalizedText, category, resourceType);
  const suggestedNextAction = buildSuggestedNextAction(category, resourceType, tags);

  return {
    normalizedText,
    category,
    resourceType,
    summary,
    project: detectProject(normalizedText),
    tags,
    priority: detectPriority(normalizedText),
    status: "open",
    followUpDate: detectFollowUpDate(normalizedText),
    links,
    suggestedNextAction
  };
}

async function tryLlm(rawText) {
  try {
    return await classifyWithLlm(rawText);
  } catch {
    return null;
  }
}

function normalizeLlmResult(rawText, result) {
  const normalizedText = normalizeText(rawText);
  const links = Array.isArray(result.links) && result.links.length > 0
    ? result.links
    : extractLinks(rawText);

  return {
    normalizedText,
    category: result.category || "note",
    resourceType: result.resourceType || null,
    summary: result.summary || buildSummary(normalizedText, result.category || "note", result.resourceType || null),
    project: result.project || detectProject(normalizedText),
    tags: Array.isArray(result.tags) && result.tags.length > 0
      ? Array.from(new Set(result.tags))
      : buildTags(normalizedText, links, result.category || "note", result.resourceType || null),
    priority: result.priority || detectPriority(normalizedText),
    status: "open",
    followUpDate: result.followUpDate || detectFollowUpDate(normalizedText),
    links,
    suggestedNextAction:
      result.suggestedNextAction ||
      buildSuggestedNextAction(result.category || "note", result.resourceType || null, result.tags || [])
  };
}

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractLinks(text) {
  const matches = text.match(/https?:\/\/[^\s]+/g) || [];
  return matches.map((url) => ({
    url,
    kind: detectLinkKind(url)
  }));
}

function detectLinkKind(url) {
  if (/github\.com\/[^/]+\/[^/]+/i.test(url)) {
    return "github_repo";
  }

  if (/github\.com\/[^/]+\/[^/]+\/issues|github\.com\/[^/]+\/[^/]+\/pull/i.test(url)) {
    return "github_work_item";
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    return "video";
  }

  if (/docs|documentation|developer|api|reference|readme/i.test(url)) {
    return "documentation";
  }

  if (/figma\.com|dribbble\.com|behance\.net|mobbin\.com/i.test(url)) {
    return "design_reference";
  }

  if (/npmjs\.com|pypi\.org|hub\.docker\.com|chromewebstore\.google\.com/i.test(url)) {
    return "tool_listing";
  }

  if (/medium\.com|substack\.com|dev\.to|hashnode\.com/i.test(url)) {
    return "article";
  }

  return "generic_link";
}

function detectResourceType(links, normalizedText) {
  if (links.some((link) => link.kind === "github_repo")) {
    return "repo";
  }

  if (links.some((link) => link.kind === "tool_listing")) {
    return "tool";
  }

  if (links.some((link) => link.kind === "video")) {
    return "video";
  }

  if (links.some((link) => link.kind === "documentation")) {
    return "documentation";
  }

  if (links.some((link) => link.kind === "article")) {
    return "article";
  }

  if (/\btool\b|\bherramienta\b|\bapp\b|\bplugin\b|\bsaas\b/i.test(normalizedText)) {
    return "tool";
  }

  if (/\bdocs?\b|\bdocumentacion\b|\bguia\b|\bmanual\b|\breferencia\b|\bapi\b/i.test(normalizedText)) {
    return "documentation";
  }

  if (links.length > 0) {
    return "reference";
  }

  return null;
}

function detectCategory(normalizedText, links, resourceType) {
  if (resourceType || links.length > 0) {
    return "resource";
  }

  if (containsKeyword(normalizedText, CATEGORY_KEYWORDS.idea)) {
    return "idea";
  }

  if (containsKeyword(normalizedText, CATEGORY_KEYWORDS.follow_up)) {
    return "follow_up";
  }

  if (containsKeyword(normalizedText, CATEGORY_KEYWORDS.reminder)) {
    return "reminder";
  }

  if (containsKeyword(normalizedText, CATEGORY_KEYWORDS.task)) {
    return "task";
  }

  if (containsKeyword(normalizedText, CATEGORY_KEYWORDS.note)) {
    return "note";
  }

  return "note";
}

function containsKeyword(text, keywords) {
  return keywords.some((keyword) => text.toLowerCase().includes(keyword));
}

function buildTags(normalizedText, links, category, resourceType) {
  const tags = new Set([category]);

  if (resourceType) {
    tags.add(resourceType);
  }

  for (const link of links) {
    tags.add(link.kind);
    const repoMatch = link.url.match(/github\.com\/([^/]+)\/([^/?#]+)/i);
    if (repoMatch) {
      tags.add(repoMatch[1].toLowerCase());
      tags.add(repoMatch[2].replace(/\.git$/i, "").toLowerCase());
    }
  }

  const words = normalizedText
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, "")
    .split(/[^a-z0-9áéíóúñ_-]+/i)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
    .slice(0, 4);

  for (const word of words) {
    tags.add(word);
  }

  return Array.from(tags);
}

function buildSummary(normalizedText, category, resourceType) {
  const withoutLinks = normalizedText.replace(/https?:\/\/[^\s]+/g, "").trim();

  if (category === "resource" && resourceType === "repo") {
    return crop(cleanLeadIn(withoutLinks), 90) || "Repo guardado para revisar despues";
  }

  if (category === "resource" && resourceType === "documentation") {
    return crop(cleanLeadIn(withoutLinks), 90) || "Documentacion guardada";
  }

  if (category === "resource" && resourceType === "tool") {
    return crop(cleanLeadIn(withoutLinks), 90) || "Herramienta guardada";
  }

  if (category === "task") {
    return crop(cleanLeadIn(withoutLinks), 90) || "Tarea guardada";
  }

  if (category === "idea") {
    return crop(cleanLeadIn(withoutLinks), 90) || "Idea guardada";
  }

  if (category === "follow_up") {
    return crop(withoutLinks, 90) || "Seguimiento guardado";
  }

  if (category === "reminder") {
    return crop(withoutLinks, 90) || "Recordatorio guardado";
  }

  return crop(withoutLinks, 90) || "Nota guardada";
}

function crop(text, max) {
  if (!text) {
    return "";
  }

  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function cleanLeadIn(text) {
  return text
    .replace(/^guardar(me)?\s*/i, "")
    .replace(/^idea:\s*/i, "")
    .replace(/^nota:\s*/i, "")
    .replace(/^recordame\s*/i, "")
    .replace(/^tengo que\s*/i, "")
    .trim();
}

function detectProject(normalizedText) {
  const match = normalizedText.match(/proyecto\s+([a-z0-9_-]+)/i);
  if (match) {
    return match[1];
  }

  const aboutMatch = normalizedText.match(/\bpara\s+([a-z0-9_-]{3,})/i);
  return aboutMatch ? aboutMatch[1].toLowerCase() : "sin-proyecto";
}

function detectPriority(normalizedText) {
  if (/\burgente\b|\bhoy\b|\bya\b/i.test(normalizedText)) {
    return "high";
  }

  if (/\bdespues\b|\bluego\b/i.test(normalizedText)) {
    return "low";
  }

  return "normal";
}

function detectFollowUpDate(normalizedText) {
  const match = normalizedText.match(/\b(hoy|mañana|viernes|lunes|martes|miercoles|miércoles|jueves|sabado|sábado|domingo)\b/i);
  return match ? match[1].toLowerCase() : null;
}

function buildSuggestedNextAction(category, resourceType, tags) {
  if (category === "resource" && resourceType === "repo") {
    return "Revisar si el repo te sirve para reutilizar codigo o ideas";
  }

  if (category === "resource" && resourceType === "documentation") {
    return "Anotar que parte de la documentacion te interesaba para recuperarla rapido";
  }

  if (category === "resource" && resourceType === "tool") {
    return "Definir si queres probar la herramienta, guardarla o descartarla";
  }

  if (category === "follow_up") {
    return "Definir un momento concreto para retomar este seguimiento";
  }

  if (category === "task") {
    return "Convertir esta tarea en un siguiente paso mas chico si hace falta";
  }

  if (category === "idea") {
    return "Evaluar si vale la pena bajarla a un MVP";
  }

  if (tags.includes("documentation")) {
    return "Revisar si la documentacion responde lo que estabas buscando";
  }

  return "Mantenerlo disponible para recuperarlo despues";
}
