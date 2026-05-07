// Document Store - localStorage-based storage for recent documents

export interface StoredDocument {
  id: string;
  name: string;
  type: 'pdf' | 'text' | 'image';
  date: string;
  size: string;
  preview: string;
  stats: Record<string, string | number>;
  fullData?: string; // JSON stringified analysis result (trimmed to save space)
}

const STORAGE_KEY = 'scianalyzer_documents';
const MAX_DOCUMENTS = 50;

export function getStoredDocuments(): StoredDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as StoredDocument[];
  } catch {
    return [];
  }
}

export function saveDocument(doc: Omit<StoredDocument, 'id' | 'date'>): void {
  try {
    const docs = getStoredDocuments();
    const newDoc: StoredDocument = {
      ...doc,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      date: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    // Keep only the latest MAX_DOCUMENTS
    const trimmed = docs.slice(0, MAX_DOCUMENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn('Failed to save document to localStorage:', e);
    // If storage is full, remove oldest entries and retry
    try {
      const docs = getStoredDocuments();
      const reduced = docs.slice(0, Math.floor(MAX_DOCUMENTS / 2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
    } catch {
      // Give up silently
    }
  }
}

export function deleteDocument(id: string): void {
  try {
    const docs = getStoredDocuments().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch {
    // silently fail
  }
}

export function clearAllDocuments(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently fail
  }
}

export function getStorageUsage(): { used: string; count: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '';
    const bytes = new Blob([raw]).size;
    const docs = getStoredDocuments();
    return {
      used: bytes < 1024 ? `${bytes} B` :
            bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` :
            `${(bytes / (1024 * 1024)).toFixed(1)} MB`,
      count: docs.length,
    };
  } catch {
    return { used: '0 B', count: 0 };
  }
}
