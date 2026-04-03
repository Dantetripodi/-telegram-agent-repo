const OPENAI_API_URL = "https://api.openai.com/v1/audio/transcriptions";

export async function transcribeAudioBuffer(buffer, filename = "voice.ogg") {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe";

  if (!apiKey) {
    return {
      ok: false,
      reason: "missing_api_key"
    };
  }

  const form = new FormData();
  const blob = new Blob([buffer], { type: "audio/ogg" });

  form.append("file", blob, filename);
  form.append("model", model);

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: "transcription_failed",
      detail: await response.text()
    };
  }

  const data = await response.json();
  return {
    ok: true,
    text: data.text || ""
  };
}
