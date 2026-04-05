import React, { useState, useEffect } from 'react';
import { ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { UserSettings } from '../types';
import { getSettings, saveSettings } from '../services/api';

const SUCCESS_DISPLAY_MS = 2000;

function AccordionSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-bold">{title}</span>
        <ChevronRight
          size={18}
          className={`text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-gray-100">{children}</div>}
    </div>
  );
}

export default function SettingsView() {
  const [form, setForm] = useState<UserSettings>({
    llm_model: 'gemini/gemini-2.0-flash',
    api_key: '',
    citations_enabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    getSettings()
      .then(setForm)
      .catch(() => {
        // keep defaults
      });
  }, []);

  const handleChange = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await saveSettings(form);
      setForm(saved);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), SUCCESS_DISPLAY_MS);
    } catch {
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="p-8 h-full overflow-y-auto"
    >
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-8">System Settings</h2>

        <div className="space-y-6">
          <AccordionSection title="Model Configuration">
            <div className="pt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">LLM Model</label>
                <input
                  type="text"
                  value={form.llm_model}
                  onChange={(e) => handleChange('llm_model', e.target.value)}
                  placeholder="gemini/gemini-2.0-flash"
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                />
                <p className="text-xs text-gray-400 mt-1.5">
                  Any LiteLLM-compatible model string. Examples: gemini/gemini-2.0-flash · groq/llama-3.3-70b-versatile · gpt-4o
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">API Key</label>
                <input
                  type="password"
                  value={form.api_key}
                  onChange={(e) => handleChange('api_key', e.target.value)}
                  placeholder="AIza... or sk-..."
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Retrieval Model</label>
                <div className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed">
                  sentence-transformers/all-minilm-l6-v2
                </div>
                <p className="text-xs text-gray-400 mt-1.5">Fixed — handled by Qdrant Cloud Inference</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Show Citations</p>
                  <p className="text-xs text-gray-500 mt-0.5">Display source references below assistant responses.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={form.citations_enabled}
                    onChange={(e) => handleChange('citations_enabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                </label>
              </div>
            </div>
          </AccordionSection>

          <AccordionSection title="Preferences">
            <div className="pt-4">
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm text-gray-500">
                Additional preferences will be available in a future update.
              </div>
            </div>
          </AccordionSection>
        </div>

        <div className="mt-8 flex items-center justify-end gap-4">
          {saveError && <p className="text-sm text-red-500">{saveError}</p>}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 text-green-600 text-sm font-medium"
              >
                <CheckCircle2 size={16} />
                Saved
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
