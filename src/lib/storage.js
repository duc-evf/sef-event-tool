const STORAGE_KEY = 'sef-event-tool';
let saveTimeout = null;

function getStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, lastSaved: new Date().toISOString() }));
}

export function loadState() {
  return getStore();
}

export function saveState(state) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => setStore(state), 500);
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getApiKey() {
  return localStorage.getItem('sef-anthropic-key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('sef-anthropic-key', key);
}

export function getOpenAiKey() {
  return localStorage.getItem('sef-openai-key') || '';
}

export function setOpenAiKey(key) {
  localStorage.setItem('sef-openai-key', key);
}

export function getAiProvider() {
  return localStorage.getItem('sef-ai-provider') || 'anthropic';
}

export function setAiProvider(provider) {
  localStorage.setItem('sef-ai-provider', provider);
}

export function getBraveKey() {
  return localStorage.getItem('sef-brave-key') || '';
}

export function setBraveKey(key) {
  localStorage.setItem('sef-brave-key', key);
}

export function getStakeholderDb() {
  try {
    const raw = localStorage.getItem('sefmap_stakeholder_db');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStakeholderDb(records) {
  localStorage.setItem('sefmap_stakeholder_db', JSON.stringify(records));
  localStorage.setItem('sefmap_stakeholder_db_updated', new Date().toISOString());
}

export function getStakeholderDbMeta() {
  const updated = localStorage.getItem('sefmap_stakeholder_db_updated');
  const raw = localStorage.getItem('sefmap_stakeholder_db');
  let count = 0;
  try { count = raw ? JSON.parse(raw).length : 0; } catch { /* */ }
  return { count, updated };
}

export function getBraveUsage() {
  try {
    const raw = localStorage.getItem('brave_api_usage');
    const data = raw ? JSON.parse(raw) : {};
    const thisMonth = new Date().toISOString().slice(0, 7);
    if (data.month !== thisMonth) return { month: thisMonth, count: 0 };
    return data;
  } catch {
    return { month: new Date().toISOString().slice(0, 7), count: 0 };
  }
}

export function incrementBraveUsage() {
  const usage = getBraveUsage();
  usage.count += 1;
  localStorage.setItem('brave_api_usage', JSON.stringify(usage));
  return usage.count;
}
