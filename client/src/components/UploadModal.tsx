import React, { useState } from 'react';
import { Upload, FileUp, Loader2, X } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadModalProps {
  onClose: () => void;
  onUpload: (file: File, sourceType: 'EIA' | 'OPEC' | 'Other') => Promise<void>;
}

export default function UploadModal({ onClose, onUpload }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'EIA' | 'OPEC' | 'Other'>('Other');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    try {
      await onUpload(file, sourceType);
      onClose();
    } catch {
      // error is handled by the caller
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold">Upload New Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-brand-primary">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Source Category</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as 'EIA' | 'OPEC' | 'Other')}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20 cursor-pointer"
            >
              <option value="EIA">EIA</option>
              <option value="OPEC">OPEC</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">File Selection</label>
            <div className="relative group">
              <input
                type="file"
                required
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center group-hover:border-brand-accent/40 group-hover:bg-gray-50 transition-all">
                <FileUp size={32} className="mx-auto text-gray-300 mb-2 group-hover:text-brand-accent transition-colors" />
                <p className="text-sm font-medium text-gray-600">
                  {file ? file.name : 'Click to browse or drag & drop'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF or TXT up to 20MB</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full py-3 bg-brand-primary text-white rounded-xl font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              {isUploading ? 'Processing Document...' : 'Start Ingestion'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
