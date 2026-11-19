import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  Building2, 
  Plus, 
  Layers,
  AlertCircle,
  Settings
} from 'lucide-react';
import { ExpenseItem, Project, ExpenseCategory, YayoiApiConfig } from '../types';
import { OcrService } from '../services/ocrService';
import { compressImage } from '../services/imageCompressor';

interface QuickScanCardProps {
  projects: Project[];
  yayoiConfig?: YayoiApiConfig;
  onSuccess: (expense: ExpenseItem) => void;
  onOpenSettings?: () => void;
}

export const QuickScanCard: React.FC<QuickScanCardProps> = ({
  projects,
  onSuccess,
  onOpenSettings,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<{ type: 'info' | 'warning' | 'error'; message: string } | null>(null);
  const [isAiExtracted, setIsAiExtracted] = useState(false);

  // フォームステート
  const [imageData, setImageData] = useState<string | null>(null);
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [accountTitle, setAccountTitle] = useState('材料費（仕入高）');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [memo, setMemo] = useState('');

  // ファイル処理（画像圧縮 ＆ AI解析）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setAiNotice(null);
    setIsAiExtracted(false);

    try {
      setIsAnalyzing(true);
      setIsOpenForm(true);

      // スマホ撮影写真の高速圧縮（最大1200px、800KB以下へ）
      const compressedDataUrl = await compressImage(file);
      setImageData(compressedDataUrl);

      // Gemini APIキーの有無確認
      const apiKey = OcrService.getGeminiApiKey();
      if (!apiKey) {
        setIsAnalyzing(false);
        setAiNotice({
          type: 'warning',
          message: 'Gemini APIキーが未設定です。右上の⚙️設定からGoogle AI Studioキーを入力するとAIがレシートを自動認識します。手動での入力も可能です。',
        });
        setVendor('');
        setAmount('');
        setMemo('写真から登録');
        setSelectedProjectId(projects.find(p => p.status === 'in_progress')?.id || projects[0]?.id || '');
        return;
      }

      // AI解析実行
      await analyzeImage(compressedDataUrl);
    } catch (err) {
      console.error('画像処理・解析エラー:', err);
      setIsAnalyzing(false);
      setAiNotice({
        type: 'error',
        message: 'AI解析に失敗しました。手動で店舗名と金額を入力してください。',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // サンプルレシートテスト（デモ用）
  const handleQuickSample = (sampleName: string) => {
    setAiNotice(null);
    const inProgressProject = projects.find(p => p.status === 'in_progress') || projects[0];
    const sample = OcrService.getSampleReceiptData(sampleName, inProgressProject);

    const placeholderUrl = `https://placehold.co/400x600/f8fafc/0f172a?text=${encodeURIComponent(sampleName)}`;
    setImageData(placeholderUrl);
    setIsOpenForm(true);
    setIsAiExtracted(false);

    setVendor(sample.vendor);
    setDate(sample.date);
    setAmount(sample.amount);
    setCategory(sample.category);
    setAccountTitle(sample.accountTitle);
    setSelectedProjectId(sample.recommendedProjectId || (projects[0]?.id || ''));
    setMemo(sample.memo);
  };

  // OCR解析
  const analyzeImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    try {
      const result = await OcrService.analyzeReceiptImage(dataUrl, projects);
      setVendor(result.vendor);
      setDate(result.date);
      setAmount(result.amount);
      setCategory(result.category);
      setAccountTitle(result.accountTitle);
      setSelectedProjectId(result.recommendedProjectId || (projects[0]?.id || ''));
      setMemo(result.memo);
      setIsAiExtracted(true);
      setAiNotice({
        type: 'info',
        message: `Gemini AIが「${result.vendor}」（¥${result.amount.toLocaleString()}）を自動認識しました！`,
      });
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'NO_API_KEY') {
        setAiNotice({
          type: 'warning',
          message: 'Gemini APIキーが未設定です。設定からAPIキーを登録するとAI自動認識が有効になります。',
        });
      } else {
        setAiNotice({
          type: 'error',
          message: 'AI解析に失敗しました。手動で金額と店舗名を入力してください。',
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor || amount === '' || Number(amount) <= 0) {
      alert('店舗名と有効な金額を入力してください。');
      return;
    }

    const numAmount = Number(amount);
    const taxRate = 0.1;
    const taxAmount = Math.round(numAmount - numAmount / (1 + taxRate));

    const newExpense: ExpenseItem = {
      id: `exp_${Date.now()}`,
      projectId: selectedProjectId || undefined,
      date,
      vendor,
      amount: numAmount,
      taxRate,
      taxAmount,
      category,
      accountTitle,
      paymentMethod: 'business_card',
      memo: memo || `${vendor}にて購入`,
      receiptImageUrl: imageData || undefined,
      yayoiSynced: false,
      receiptItems: [],
    };

    onSuccess(newExpense);
    setIsOpenForm(false);
    setImageData(null);
    setVendor('');
    setAmount('');
    setMemo('');
    setAiNotice(null);
    setIsAiExtracted(false);
    setSuccessNotice(`「${vendor}」の支出（¥${numAmount.toLocaleString()}）を登録しました！現場投入原価と合計に即時反映されました。`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 transition hover:shadow-md">
      {/* 完了通知 */}
      {successNotice && (
        <div className="mb-3 bg-emerald-50 border border-emerald-300 text-emerald-900 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* トップ見出し & クイック撮影ボタン群 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center font-bold">
            <Camera className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              レシート・領収書 クイックスキャン
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              スマホ撮影またはファイルドロップで店舗・金額・現場を自動判定
            </p>
          </div>
        </div>

        {/* 撮影・選択ボタン */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* カメラ起動 */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-sm transition text-xs sm:text-sm cursor-pointer"
          >
            <Camera className="w-4 h-4 text-slate-950" />
            <span>写真を撮る</span>
          </button>

          {/* ファイル選択 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-2.5 rounded-xl transition text-xs sm:text-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-700" />
            <span>画像選択</span>
          </button>

          {/* 隠しインプット */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 展開フォーム（画像選択または撮影後） */}
      {isOpenForm && (
        <form onSubmit={handleSave} className="mt-4 pt-4 border-t border-slate-200 space-y-4 animate-fade-in">
          {/* AI解析中表示 */}
          {isAnalyzing && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 px-4 py-3 rounded-xl flex items-center space-x-2.5 text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
              <span>Gemini AIがレシート画像を解析中... 店舗・金額・品目を抽出しています</span>
            </div>
          )}

          {/* AI通知（成功 / キー未設定 / エラー） */}
          {aiNotice && (
            <div className={`p-3 rounded-xl text-xs sm:text-sm flex items-start justify-between gap-2 ${
              aiNotice.type === 'info'
                ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                : aiNotice.type === 'warning'
                ? 'bg-amber-50 border border-amber-300 text-amber-950 font-medium'
                : 'bg-rose-50 border border-rose-300 text-rose-950 font-medium'
            }`}>
              <div className="flex items-start space-x-2">
                <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                  aiNotice.type === 'info' ? 'text-emerald-600' : aiNotice.type === 'warning' ? 'text-amber-600' : 'text-rose-600'
                }`} />
                <span>{aiNotice.message}</span>
              </div>
              {aiNotice.type === 'warning' && onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="shrink-0 inline-flex items-center space-x-1 bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold px-2.5 py-1 rounded-lg text-xs transition cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>APIキー設定</span>
                </button>
              )}
            </div>
          )}

          {isAiExtracted && (
            <div className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-800 text-[11px] font-black px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>AI自動読取 完了</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 店舗名 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">店舗・購入先</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="例: コーナンPRO"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">支払総額 (税込)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-sm font-bold">¥</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            {/* 日付 */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">取引日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
            </div>

            {/* 現場紐付け */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">紐付け先現場</label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-bold text-slate-900"
              >
                <option value="">一般経費（現場なし）</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    【{p.client}】{p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setIsOpenForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5 transition cursor-pointer"
            >
              キャンセル
            </button>

            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl shadow-sm transition text-sm cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>現場収支に登録する</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
