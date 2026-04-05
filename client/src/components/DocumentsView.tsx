import { useState, useEffect, useMemo, useCallback } from 'react';
import { FileText, FileUp, CheckCircle2, AlertCircle, Loader2, Filter, Database, Trash2, Eye, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { DocumentResponse } from '../types';
import { listDocuments, deleteDocument, getDocumentFileUrl } from '../services/api';

const POLL_INTERVAL_MS = 3000;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const SOURCE_TYPE_FILTERS = ['All', 'EIA', 'OPEC', 'Other'] as const;
type FilterType = (typeof SOURCE_TYPE_FILTERS)[number];

interface DocumentsViewProps {
  onDeleteRequest: (id: string) => void;
  pendingDeleteId: string | null;
  onDeleteConfirmed: () => void;
  newDocument: DocumentResponse | null;
  onNewDocumentConsumed: () => void;
}

export default function DocumentsView({
  onDeleteRequest,
  pendingDeleteId,
  onDeleteConfirmed,
  newDocument,
  onNewDocumentConsumed,
}: DocumentsViewProps) {
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [filterSource, setFilterSource] = useState<FilterType>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch {
      // silently retain previous state
    }
  }, []);

  useEffect(() => {
    fetchDocuments().finally(() => setIsLoading(false));
  }, [fetchDocuments]);

  const hasProcessing = documents.some((d) => d.status === 'processing');

  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(fetchDocuments, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [hasProcessing, fetchDocuments]);

  // Incorporate a newly uploaded document from App shell
  useEffect(() => {
    if (!newDocument) return;
    setDocuments((prev) => [newDocument, ...prev]);
    onNewDocumentConsumed();
  }, [newDocument, onNewDocumentConsumed]);

  // Execute confirmed delete
  useEffect(() => {
    if (!pendingDeleteId) return;
    deleteDocument(pendingDeleteId)
      .then(() => {
        setDocuments((prev) => prev.filter((d) => d.id !== pendingDeleteId));
      })
      .catch(() => {
        // deletion failed — keep doc in list
      })
      .finally(onDeleteConfirmed);
  }, [pendingDeleteId, onDeleteConfirmed]);

  const filteredDocuments = useMemo(() => {
    if (filterSource === 'All') return documents;
    return documents.filter((doc) => doc.source_type === filterSource);
  }, [documents, filterSource]);

  return (
    <>
    <motion.div
      key="documents"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="p-8 h-full overflow-y-auto"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Knowledge Base</h2>
            <p className="text-sm text-gray-500 mt-1">Manage and monitor your ingested industry reports.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value as FilterType)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-accent/20 appearance-none cursor-pointer"
              >
                {SOURCE_TYPE_FILTERS.map((f) => (
                  <option key={f} value={f}>{f === 'All' ? 'All Sources' : f}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium">
              <Database size={16} className="text-gray-400" />
              <span>{filteredDocuments.length} Reports</span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-gray-300 animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Document Name</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Source Category</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date Added</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded text-gray-500">
                            <FileText size={16} />
                          </div>
                          <span className="text-sm font-medium text-brand-primary">{doc.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            doc.source_type === 'OPEC'
                              ? 'bg-blue-50 text-blue-600'
                              : doc.source_type === 'EIA'
                              ? 'bg-orange-50 text-orange-600'
                              : 'bg-gray-50 text-gray-600'
                          }`}
                        >
                          {doc.source_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(doc.upload_date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {doc.status === 'ready' ? (
                            <>
                              <CheckCircle2 size={14} className="text-green-500" />
                              <span className="text-xs text-green-600 font-medium">Ready</span>
                            </>
                          ) : doc.status === 'processing' ? (
                            <>
                              <Loader2 size={14} className="text-blue-500 animate-spin" />
                              <span className="text-xs text-blue-600 font-medium">Indexing</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle size={14} className="text-red-500" />
                              <span className="text-xs text-red-600 font-medium">Error</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatBytes(doc.size_bytes)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {doc.status === 'ready' && (
                            <button
                              onClick={async () => {
                                setPreviewDocId(doc.id);
                                const res = await fetch(getDocumentFileUrl(doc.id));
                                const blob = await res.blob();
                                setPreviewBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(blob); });
                              }}
                              className="p-2 text-gray-400 hover:text-brand-accent"
                              title="Preview document"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteRequest(doc.id)}
                            className="p-2 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDocuments.length === 0 && (
              <div className="text-center py-20 bg-white border border-dashed border-gray-200 rounded-xl mt-4">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                  <FileUp size={24} />
                </div>
                <h3 className="text-lg font-medium">No reports found</h3>
                <p className="text-sm text-gray-500 mt-1">Try changing your filter or uploading a new report.</p>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>

    {previewDocId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {documents.find((d) => d.id === previewDocId)?.name ?? 'Document Preview'}
            </span>
            <button
              onClick={() => { setPreviewDocId(null); if (previewBlobUrl) { URL.revokeObjectURL(previewBlobUrl); setPreviewBlobUrl(null); } }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
          {previewBlobUrl ? (
            <embed
              src={previewBlobUrl}
              type="application/pdf"
              className="flex-1 w-full rounded-b-xl"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <Loader2 size={24} className="animate-spin" />
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
