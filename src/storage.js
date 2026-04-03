import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "..", "data", "inbox.json");

export async function getItems() {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

export async function saveItem(item) {
  const items = await getItems();
  items.unshift(item);
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
  return item;
}

export async function searchItems(filters = {}) {
  const items = await getItems();
  return filterItemsList(items, filters);
}

export async function filterItems(filters = {}) {
  const items = await getItems();
  return filterItemsList(items, filters);
}

export async function updateItemStatus(idOrShortId, status) {
  const items = await getItems();
  const index = items.findIndex((item) => matchesId(item.id, idOrShortId));

  if (index === -1) {
    return null;
  }

  const updated = {
    ...items[index],
    status,
    updatedAt: new Date().toISOString()
  };

  items[index] = updated;
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
  return updated;
}

export async function updateItemMetadata(idOrShortId, { project, tags }) {
  const items = await getItems();
  const index = items.findIndex((item) => matchesId(item.id, idOrShortId));

  if (index === -1) {
    return null;
  }

  const normalizedTags = Array.isArray(tags)
    ? Array.from(new Set(tags.map((tag) => String(tag).trim()).filter(Boolean)))
    : items[index].tags;

  const updated = {
    ...items[index],
    project: typeof project === "string" && project.trim() ? project.trim() : items[index].project,
    tags: normalizedTags,
    updatedAt: new Date().toISOString()
  };

  items[index] = updated;
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2));
  return updated;
}

export async function findItem(idOrShortId) {
  const items = await getItems();
  return items.find((item) => matchesId(item.id, idOrShortId)) || null;
}

function filterItemsList(items, { q, category, tag, resourceType, hasLink, project, status, dateFrom, dateTo }) {
  return items.filter((item) => {
    const matchesQuery = q
      ? JSON.stringify(item).toLowerCase().includes(q.toLowerCase())
      : true;
    const matchesCategory = category ? item.category === category : true;
    const matchesTag = tag ? item.tags.includes(tag) : true;
    const matchesResourceType = resourceType ? item.resourceType === resourceType : true;
    const matchesHasLink = hasLink === "true" ? item.links.length > 0 : true;
    const matchesProject = project ? item.project.toLowerCase().includes(project.toLowerCase()) : true;
    const matchesStatus = status ? item.status === status : true;
    const matchesDateFrom = dateFrom ? isOnOrAfter(item.createdAt, dateFrom) : true;
    const matchesDateTo = dateTo ? isOnOrBefore(item.createdAt, dateTo) : true;

    return matchesQuery &&
      matchesCategory &&
      matchesTag &&
      matchesResourceType &&
      matchesHasLink &&
      matchesProject &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo;
  });
}

export async function getStats() {
  const items = await getItems();
  const resourceBreakdown = {
    repo: 0,
    documentation: 0,
    tool: 0,
    article: 0,
    video: 0,
    reference: 0
  };

  const categoryBreakdown = {
    task: 0,
    idea: 0,
    reminder: 0,
    follow_up: 0,
    note: 0,
    resource: 0
  };

  for (const item of items) {
    categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + 1;
    if (item.resourceType) {
      resourceBreakdown[item.resourceType] = (resourceBreakdown[item.resourceType] || 0) + 1;
    }
  }

  return {
    total: items.length,
    open: items.filter((item) => item.status === "open").length,
    done: items.filter((item) => item.status === "done").length,
    archived: items.filter((item) => item.status === "archived").length,
    withLinks: items.filter((item) => item.links.length > 0).length,
    repos: items.filter((item) => item.resourceType === "repo").length,
    ideas: categoryBreakdown.idea || 0,
    followUps: categoryBreakdown.follow_up || 0,
    categoryBreakdown,
    resourceBreakdown
  };
}

function isOnOrAfter(isoString, dateString) {
  return new Date(isoString) >= new Date(`${dateString}T00:00:00`);
}

function isOnOrBefore(isoString, dateString) {
  return new Date(isoString) <= new Date(`${dateString}T23:59:59.999`);
}

function matchesId(fullId, idOrShortId) {
  return fullId === idOrShortId || fullId.endsWith(String(idOrShortId));
}
