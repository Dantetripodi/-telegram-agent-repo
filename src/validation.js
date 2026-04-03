const GENERIC_NOISE = new Set([
  "respuesta",
  "resources",
  "resource",
  "repo",
  "repos",
  "nota",
  "note",
  "hola",
  "ok",
  "test",
  "prueba"
]);

export function validateInputForSaving(rawInput) {
  const text = String(rawInput || "").trim();

  if (!text) {
    return { ok: false, reason: "empty", message: "No habia contenido para guardar." };
  }

  if (text.startsWith("/")) {
    return {
      ok: false,
      reason: "command",
      message: "Ese mensaje parece un comando. Si queres ayuda, usa /help."
    };
  }

  const words = text
    .toLowerCase()
    .replace(/https?:\/\/[^\s]+/g, "")
    .split(/[^a-z0-9áéíóúñ_-]+/i)
    .filter(Boolean);

  if (words.length === 1 && GENERIC_NOISE.has(words[0])) {
    return {
      ok: false,
      reason: "noise",
      message: "Ese mensaje es demasiado corto o ambiguo. Sumale contexto para que valga la pena guardarlo."
    };
  }

  if (words.length <= 2 && words.every((word) => GENERIC_NOISE.has(word))) {
    return {
      ok: false,
      reason: "noise",
      message: "Eso parece ruido o una prueba. Mandame algo con mas contexto para guardarlo."
    };
  }

  return { ok: true };
}
