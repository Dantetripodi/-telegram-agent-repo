const form = document.querySelector("#ingest-form");
const messageInput = document.querySelector("#message");
const replyBox = document.querySelector("#agent-reply");
const itemsContainer = document.querySelector("#items");
const loadItemsBtn = document.querySelector("#load-items");
const searchInput = document.querySelector("#search");
const categoryInput = document.querySelector("#category");
const statusInput = document.querySelector("#status");
const resourceTypeInput = document.querySelector("#resource-type");
const hasLinkInput = document.querySelector("#has-link");
const projectInput = document.querySelector("#project");
const dateFromInput = document.querySelector("#date-from");
const dateToInput = document.querySelector("#date-to");
const searchBtn = document.querySelector("#search-btn");
const statsContainer = document.querySelector("#stats");
const quickChips = document.querySelectorAll(".quick-chip");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const text = messageInput.value.trim();
  const messages = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (messages.length === 0) {
    replyBox.textContent = "Escribí algo para que el agente lo procese.";
    return;
  }

  const endpoint = messages.length > 1 ? "/ingest/batch" : "/ingest";
  const payload =
    messages.length > 1
      ? { messages, source: "web-ui" }
      : { text: messages[0], source: "web-ui" };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  replyBox.textContent = data.reply || data.error || "No hubo respuesta del agente.";
  messageInput.value = "";
  await loadItems();
});

loadItemsBtn.addEventListener("click", () => loadItems());
searchBtn.addEventListener("click", () => loadItems());
quickChips.forEach((chip) => {
  chip.addEventListener("click", async () => {
    categoryInput.value = chip.dataset.category ?? "";
    resourceTypeInput.value = chip.dataset.resourceType ?? "";
    statusInput.value = "";
    await loadItems();
  });
});

async function loadItems() {
  const q = encodeURIComponent(searchInput.value.trim());
  const category = encodeURIComponent(categoryInput.value);
  const status = encodeURIComponent(statusInput.value);
  const resourceType = encodeURIComponent(resourceTypeInput.value);
  const hasLink = hasLinkInput.checked ? "true" : "";
  const project = encodeURIComponent(projectInput.value.trim());
  const dateFrom = encodeURIComponent(dateFromInput.value);
  const dateTo = encodeURIComponent(dateToInput.value);
  const endpoint = q || category || status || resourceType || hasLink || project || dateFrom || dateTo
    ? `/search?q=${q}&category=${category}&status=${status}&resourceType=${resourceType}&hasLink=${hasLink}&project=${project}&dateFrom=${dateFrom}&dateTo=${dateTo}`
    : "/items";

  const response = await fetch(endpoint);
  const items = await response.json();
  renderItems(items);
  await loadStats();
}

async function loadStats() {
  const response = await fetch("/stats");
  const stats = await response.json();
  renderStats(stats);
}

function renderStats(stats) {
  const cards = [
    { label: "Items totales", value: stats.total ?? 0 },
    { label: "Con links", value: stats.withLinks ?? 0 },
    { label: "Repos", value: stats.repos ?? 0 },
    { label: "Ideas", value: stats.ideas ?? 0 },
    { label: "Seguimientos", value: stats.followUps ?? 0 },
    { label: "Abiertos", value: stats.open ?? 0 },
    { label: "Hechos", value: stats.done ?? 0 },
    { label: "Archivados", value: stats.archived ?? 0 }
  ];

  statsContainer.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <span class="stat-value">${card.value}</span>
          <span class="stat-label">${card.label}</span>
        </article>
      `
    )
    .join("");
}

function renderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    itemsContainer.innerHTML = `
      <article class="empty">
        <p>No hay items para mostrar con esos filtros.</p>
      </article>
    `;
    return;
  }

  itemsContainer.innerHTML = items
    .map(
      (item) => `
        <article class="item">
          <div class="item-top">
            <span class="pill">${item.category}</span>
            ${item.resourceType ? `<span class="pill soft">${item.resourceType}</span>` : ""}
            ${item.priority === "high" ? `<span class="pill alert">high</span>` : ""}
            <span class="pill state">${item.status}</span>
            <span class="date">${new Date(item.createdAt).toLocaleString()}</span>
          </div>
          <h3>${escapeHtml(item.summary)}</h3>
          <p class="raw">${escapeHtml(item.rawInput)}</p>
          <div class="meta-grid">
            <p><strong>ID:</strong> #${escapeHtml(item.shortId || item.id.slice(-6))}</p>
            <p><strong>Proyecto:</strong> ${escapeHtml(item.project)}</p>
            <p><strong>Prioridad:</strong> ${escapeHtml(item.priority)}</p>
            <p><strong>Seguimiento:</strong> ${escapeHtml(item.followUpDate || "sin fecha")}</p>
          </div>
          <div class="tag-list">
            ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
          <div class="edit-grid">
            <label class="edit-field">
              <span>Proyecto</span>
              <input class="edit-project" data-id="${escapeAttribute(item.id)}" value="${escapeAttribute(item.project)}" />
            </label>
            <label class="edit-field">
              <span>Tags</span>
              <input class="edit-tags" data-id="${escapeAttribute(item.id)}" value="${escapeAttribute(item.tags.join(", "))}" />
            </label>
            <button type="button" class="secondary meta-save-btn" data-id="${escapeAttribute(item.id)}">Guardar meta</button>
          </div>
          <div class="item-actions">
            <button type="button" class="secondary action-btn" data-id="${escapeAttribute(item.id)}" data-status="open">Open</button>
            <button type="button" class="secondary action-btn" data-id="${escapeAttribute(item.id)}" data-status="done">Done</button>
            <button type="button" class="secondary action-btn" data-id="${escapeAttribute(item.id)}" data-status="archived">Archive</button>
          </div>
          <p><strong>Siguiente paso:</strong> ${escapeHtml(item.suggestedNextAction)}</p>
          ${
            item.links.length
              ? `<div class="links"><p class="link-title">Links detectados</p>${item.links
                  .map(
                    (link) =>
                      `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.url)}</a>`
                  )
                  .join("")}</div>`
              : ""
          }
        </article>
      `
    )
    .join("");

  attachActionListeners();
  attachMetaSaveListeners();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function attachActionListeners() {
  document.querySelectorAll(".action-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const status = button.dataset.status;

      const response = await fetch(`/items/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });

      const data = await response.json();
      replyBox.textContent = data.error
        ? data.error
        : `Actualizado: #${data.shortId || data.id.slice(-6)} ahora esta en ${data.status}.`;
      await loadItems();
    });
  });
}

function attachMetaSaveListeners() {
  document.querySelectorAll(".meta-save-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;
      const project = document.querySelector(`.edit-project[data-id="${CSS.escape(id)}"]`)?.value ?? "";
      const tagsRaw = document.querySelector(`.edit-tags[data-id="${CSS.escape(id)}"]`)?.value ?? "";
      const tags = tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const response = await fetch(`/items/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ project, tags })
      });

      const data = await response.json();
      replyBox.textContent = data.error
        ? data.error
        : `Actualizado: #${data.shortId || data.id.slice(-6)} con proyecto ${data.project} y ${data.tags.length} tags.`;
      await loadItems();
    });
  });
}

loadItems();
