import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white border border-gray-100 rounded-2xl w-full max-w-md p-6 shadow-2xl"
      >
        <div className="flex items-center gap-4 text-red-500 mb-4">
          <div className="p-3 bg-red-50 rounded-full">
            <Trash2 size={24} />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
        </div>

        <p className="text-gray-600 mb-8">
          Are you sure you want to delete this document? This action cannot be undone and the data will be removed from the knowledge base.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </div>
  );
}
