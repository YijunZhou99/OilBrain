export type ViewType = 'chat' | 'documents' | 'settings';

// --- Chat ---

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  citations?: Citation[];
  web_citations?: WebCitation[];
}

export interface Citation {
  doc_id: string;
  doc_name: string;
  page?: number;
  snippet?: string;
}

export interface WebCitation {
  url: string;
  title: string;
  snippet: string;
}

export interface ChatRequest {
  message: string;
  history: ChatHistoryMessage[];
  api_key?: string;
  llm_model?: string;
  citations_enabled?: boolean;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  web_citations: WebCitation[];
}

// --- Documents ---

export interface DocumentResponse {
  id: string;
  name: string;
  source_type: 'EIA' | 'OPEC' | 'Other';
  upload_date: string;
  status: 'processing' | 'ready' | 'error';
  size_bytes: number;
  chunk_count: number;
}

// --- Settings ---

export interface UserSettings {
  llm_model: string;
  api_key: string;
  citations_enabled: boolean;
}
