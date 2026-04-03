import { ingestMessage } from "./agent.js";
import { getItems, searchItems, updateItemStatus } from "./storage.js";
import { transcribeAudioBuffer } from "./transcription.js";

const TELEGRAM_API = "https://api.telegram.org";

export async function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    console.log("Telegram desactivado: falta TELEGRAM_BOT_TOKEN en variables de entorno o en .env");
    return;
  }

  console.log("Telegram polling activado");

  try {
    const me = await getMe(token);
    console.log(`Bot conectado como @${me.username}`);
  } catch (error) {
    console.error("No se pudo validar el bot de Telegram:", error.message);
    return;
  }

  let offset = 0;

  while (true) {
    try {
      const updates = await getUpdates(token, offset);

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(token, update);
      }
    } catch (error) {
      console.error("Error en polling de Telegram:", error.message);
      await delay(3000);
    }
  }
}

async function getUpdates(token, offset) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/getUpdates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      offset,
      timeout: 20,
      allowed_updates: ["message"]
    })
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || "No se pudieron obtener updates");
  }

  return data.result || [];
}

async function getMe(token) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/getMe`);
  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || "Token invalido o bot inaccesible");
  }

  return data.result;
}

async function handleUpdate(token, update) {
  const message = update.message;

  if (!message || !message.chat) {
    return;
  }

  const text = message.text?.trim();
  const voice = message.voice;

  if (voice) {
    await handleVoiceMessage(token, message);
    return;
  }

  if (!text) {
    await sendMessage(
      token,
      message.chat.id,
      "Por ahora proceso texto y notas de voz. Si queres, mandame tareas, ideas, recordatorios o links."
    );
    return;
  }

  if (text === "/start") {
    await sendMessage(
      token,
      message.chat.id,
      "Inbox Agent listo. Mandame texto o links y los guardo como tarea, idea, seguimiento, nota o recurso."
    );
    return;
  }

  if (text === "/help") {
    await sendMessage(
      token,
      message.chat.id,
      "Comandos:\n/start\n/help\n/items\n/items open\n/items done\n/resources\n/resources repo\n/resources documentation\n/today\n/search texto\n/done 123456\n/archive 123456\n/open 123456\n\nEjemplos:\n- Guardar este repo para auth https://github.com/example/repo\n- Idea: hacer una app para ordenar links\n- Recordame hablar con Nico el viernes"
    );
    return;
  }

  if (text.toLowerCase().startsWith("/items")) {
    const arg = text.split(" ").slice(1).join(" ").trim();
    const items = arg
      ? await searchItems({ status: arg })
      : await getItems();
    await sendMessage(
      token,
      message.chat.id,
      formatItems(items.slice(0, 8), arg ? `Items con estado ${arg}` : "Ultimos items")
    );
    return;
  }

  if (text.toLowerCase().startsWith("/resources")) {
    const arg = text.split(" ").slice(1).join(" ").trim();
    const resources = await searchItems({
      category: "resource",
      resourceType: arg || undefined
    });
    await sendMessage(
      token,
      message.chat.id,
      formatItems(resources.slice(0, 8), arg ? `Recursos tipo ${arg}` : "Ultimos recursos")
    );
    return;
  }

  if (text === "/today") {
    const items = await getItems();
    const today = items.filter((item) => isToday(item.createdAt)).slice(0, 8);
    await sendMessage(token, message.chat.id, formatItems(today, "Guardado hoy"));
    return;
  }

  if (text.toLowerCase().startsWith("/search ")) {
    const query = text.slice(8).trim();
    const results = await searchItems({ q: query });
    await sendMessage(token, message.chat.id, formatItems(results.slice(0, 8), `Resultados para "${query}"`));
    return;
  }

  if (text.toLowerCase().startsWith("/done ")) {
    const id = text.slice(6).trim();
    await handleStatusUpdate(token, message.chat.id, id, "done");
    return;
  }

  if (text.toLowerCase().startsWith("/archive ")) {
    const id = text.slice(9).trim();
    await handleStatusUpdate(token, message.chat.id, id, "archived");
    return;
  }

  if (text.toLowerCase().startsWith("/open ")) {
    const id = text.slice(6).trim();
    await handleStatusUpdate(token, message.chat.id, id, "open");
    return;
  }

  if (text.startsWith("/")) {
    await sendMessage(
      token,
      message.chat.id,
      "No reconozco ese comando. Usa /help para ver los comandos disponibles."
    );
    return;
  }

  try {
    const result = await ingestMessage({
      text,
      source: "telegram"
    });

    await sendMessage(token, message.chat.id, result.reply);
  } catch (error) {
    await sendMessage(token, message.chat.id, error.message || "No pude guardar ese mensaje.");
  }
}

async function handleVoiceMessage(token, message) {
  const filePath = await getFilePath(token, message.voice.file_id);
  const buffer = await downloadFile(token, filePath);
  const transcript = await transcribeAudioBuffer(buffer, `${message.voice.file_unique_id || "voice"}.ogg`);

  if (!transcript.ok) {
    await sendMessage(
      token,
      message.chat.id,
      "Recibi la nota de voz, pero no la pude transcribir. Para activarlo, agregá OPENAI_API_KEY. Mientras tanto, mandamela en texto."
    );
    return;
  }

  const result = await ingestMessage({
    audioTranscript: transcript.text,
    source: "telegram",
    inputType: "audio"
  });

  await sendMessage(
    token,
    message.chat.id,
    `Transcribi tu audio: "${cropText(transcript.text, 120)}"\n\n${result.reply}`
  );
}

async function getFilePath(token, fileId) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/getFile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ file_id: fileId })
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.description || "No se pudo obtener el archivo de audio");
  }

  return data.result.file_path;
}

async function downloadFile(token, filePath) {
  const response = await fetch(`${TELEGRAM_API}/file/bot${token}/${filePath}`);
  if (!response.ok) {
    throw new Error("No se pudo descargar el audio de Telegram");
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function handleStatusUpdate(token, chatId, id, status) {
  const updated = await updateItemStatus(id, status);

  if (!updated) {
    await sendMessage(token, chatId, `No encontre ningun item con ID ${id}. Usa /items o /search para verlo.`);
    return;
  }

  await sendMessage(
    token,
    chatId,
    `Actualice el item ${updated.shortId} a estado ${updated.status}.\n[${updated.category}${updated.resourceType ? `/${updated.resourceType}` : ""}] ${updated.summary}`
  );
}

async function sendMessage(token, chatId, text) {
  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.description || "No se pudo enviar mensaje");
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatItems(items, title) {
  if (!items || items.length === 0) {
    return `${title}:\nNo encontre nada todavia.`;
  }

  return `${title}:\n${items
    .map((item, index) => {
      const main = `${index + 1}. (#${item.shortId || item.id.slice(-6)}) [${item.status}] [${item.category}${item.resourceType ? `/${item.resourceType}` : ""}] ${item.summary}`;
      const extra = item.links[0]?.url ? `\n${item.links[0].url}` : "";
      return `${main}${extra}`;
    })
    .join("\n\n")}`;
}

function isToday(isoString) {
  const itemDate = new Date(isoString);
  const today = new Date();

  return (
    itemDate.getFullYear() === today.getFullYear() &&
    itemDate.getMonth() === today.getMonth() &&
    itemDate.getDate() === today.getDate()
  );
}

function cropText(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}
