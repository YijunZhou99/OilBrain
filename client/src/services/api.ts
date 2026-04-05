import type {
  ChatRequest,
  ChatResponse,
  DocumentResponse,
  UserSettings,
} from '../types';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function sendChat(req: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function listDocuments(): Promise<DocumentResponse[]> {
  const res = await fetch(`${BASE}/api/documents`);
  if (!res.ok) throw new Error(`Failed to list documents: ${res.status}`);
  return res.json();
}

export async function uploadDocument(
  file: File,
  sourceType: 'EIA' | 'OPEC' | 'Other',
  apiKey: string,
): Promise<DocumentResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('source_type', sourceType);
  form.append('api_key', apiKey);
  const res = await fetch(`${BASE}/api/documents`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}

export async function deleteDocument(docId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/documents/${docId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export function getDocumentFileUrl(docId: string): string {
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
  return `${base}/api/documents/${docId}/file`;
}

export async function getSettings(): Promise<UserSettings> {
  const res = await fetch(`${BASE}/api/settings`);
  if (!res.ok) throw new Error(`Failed to get settings: ${res.status}`);
  return res.json();
}

export async function saveSettings(settings: UserSettings): Promise<UserSettings> {
  const res = await fetch(`${BASE}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to save settings: ${res.status}`);
  return res.json();
}
