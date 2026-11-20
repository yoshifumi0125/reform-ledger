import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Key, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Trash2
} from 'lucide-react';
import { OcrService } from '../services/ocrService';

interface SettingsModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState(() => OcrService.getGeminiApiKey() || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onSaved();
      onClose();
    }, 1000);
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    onSaved();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 flex items-end sm:items-center justify-center animate-fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up">
        {/* ヘッダー（固定） */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                AIレシート解析設定（Gemini API）
              </h3>
              <p className="text-xs text-slate-500">Google AI Studio の無料キーで高精度OCR解析</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* スクロールボディ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {savedSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Gemini APIキーを保存しました！</span>
            </div>
          )}

          <form id="settings-form" onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Google Gemini API Key</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-700 hover:underline flex items-center space-x-0.5"
                >
                  <span>無料キーを取得</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                ※APIキーを設定すると、スマホカメラで撮った実際の現場レシート（コーナンPRO・カインズ・モノタロウ・駐車場等）をGoogle Gemini 2.5 Flashが品目・金額・税率までリアルタイム自動解析します。
                未設定の場合でも、リフォーム実務用の高精度スマート推論エンジンが自動動作します。
              </p>
            </div>
          </form>
        </div>

        {/* フッター（固定） */}
        <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/60">
          {apiKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center space-x-1 text-xs text-rose-600 hover:text-rose-700 font-bold transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>キーを削除</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
            >
              閉じる
            </button>
            <button
              type="submit"
              form="settings-form"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer"
            >
              設定を保存
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
