import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Building2, 
  Tag, 
  Calendar, 
  CreditCard, 
  AlertCircle,
  FileText,
  ChevronRight,
  ArrowRight,
  Plus,
  Trash2
} from 'lucide-react';
import { ExpenseItem, Project, ExpenseCategory, YayoiApiConfig } from '../types';
import { OcrService, OcrParsedResult } from '../services/ocrService';
import { compressImage } from '../services/imageCompressor';

interface ReceiptScannerProps {
  projects: Project[];
  yayoiConfig: YayoiApiConfig;
  onAddExpense: (expense: ExpenseItem) => void;
  onNavigateList?: () => void;
  onClose?: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  projects,
  yayoiConfig: _yayoiConfig,
  onAddExpense,
  onNavigateList,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<OcrParsedResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // 編集フォームのステート
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [taxRate, setTaxRate] = useState<number>(0.1);
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [accountTitle, setAccountTitle] = useState('材料費（仕入高）');
  const [subAccountTitle, setSubAccountTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'business_card' | 'cash' | 'owner_advance' | 'bank_transfer'>('business_card');
  const [memo, setMemo] = useState('');
  const [autoSyncToYayoi, setAutoSyncToYayoi] = useState(false);

  // 画像アップロード処理（Canvas圧縮 ＆ AI解析）
  const handleImageUpload = async (file: File) => {
    try {
      setIsAnalyzing(true);
      setStatusMessage('スマホ写真を高速最適化中...');
      const compressedDataUrl = await compressImage(file);
      setSelectedImage(compressedDataUrl);
      await analyzeImage(compressedDataUrl);
    } catch (err) {
      console.error(err);
      setStatusMessage('画像の処理に失敗しました。');
      setIsAnalyzing(false);
    }
  };

  // サンプルレシートでのクイックテスト（デモ用）
  const handleSampleReceipt = (sampleType: string) => {
    const inProgressProject = projects.find(p => p.status === 'in_progress') || projects[0];
    const sample = OcrService.getSampleReceiptData(sampleType, inProgressProject);

    const placeholderUrl = `https://placehold.co/400x600/f8fafc/0f172a?text=Receipt+${encodeURIComponent(sampleType)}`;
    setSelectedImage(placeholderUrl);
    setParsedResult(sample);

    setVendor(sample.vendor);
    setDate(sample.date);
    setAmount(sample.amount);
    setTaxRate(sample.taxRate);
    setCategory(sample.category);
    setAccountTitle(sample.accountTitle);
    setSubAccountTitle(sample.subAccountTitle);
    setSelectedProjectId(sample.recommendedProjectId || (projects[0]?.id || ''));
    setMemo(sample.memo);

    setStatusMessage(`サンプルデータ（${sample.vendor}）を読み込みました。`);
  };

  // OCR解析実行
  const analyzeImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setStatusMessage('Gemini AIでレシート画像をスキャン中...（店舗名、日付、品目、金額、税率を検出）');

    try {
      const result = await OcrService.analyzeReceiptImage(dataUrl, projects);
      setParsedResult(result);
      
      setVendor(result.vendor);
      setDate(result.date);
      setAmount(result.amount);
      setTaxRate(result.taxRate);
      setCategory(result.category);
      setAccountTitle(result.accountTitle);
      setSubAccountTitle(result.subAccountTitle);
      setSelectedProjectId(result.recommendedProjectId || (projects[0]?.id || ''));
      setMemo(result.memo);

      setStatusMessage('Gemini AI解析が完了しました！内容を確認・必要に応じて現場を紐付けてください。');
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'NO_API_KEY') {
        setStatusMessage('Gemini APIキーが未設定です。右上の設定アイコンからGoogle AI Studioキーを入力するとAIが自動認識します。手動でも入力可能です。');
      } else {
        setStatusMessage('AI解析に失敗しました。手動で店舗名と金額を入力してください。');
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
      subAccountTitle: subAccountTitle || undefined,
      paymentMethod,
      memo,
      receiptImageUrl: selectedImage || undefined,
      yayoiSynced: false,
      receiptItems: parsedResult?.items || [],
    };

    onAddExpense(newExpense);
    if (onNavigateList) {
      onNavigateList();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* ページタイトル */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span>AIレシート・領収書 OCR読取</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            カメラ撮影または画像アップロードで、店舗名・金額・税率・現場をスマート自動判定
          </p>
        </div>
      </div>

      {/* 取込エリア（撮影 ＆ ドラッグ＆ドロップ） */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
        <div className="max-w-md mx-auto">
          {selectedImage ? (
            <div className="mb-6 relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner max-h-72 flex items-center justify-center bg-slate-900/5">
              <img
                src={selectedImage}
                alt="レシート画像プレビュー"
                className="max-h-72 object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  setParsedResult(null);
                  setVendor('');
                  setAmount('');
                }}
                className="absolute top-3 right-3 bg-white/90 hover:bg-white text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs shadow-md backdrop-blur-sm cursor-pointer transition"
              >
                写真を再選択
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 cursor-pointer transition bg-slate-50/50 hover:bg-emerald-50/20 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                レシート・領収書を撮影または選択
              </h3>
              <p className="text-xs text-slate-400 mb-5">
                PNG, JPG, HEIC形式に対応 ｜ スマホカメラでの直接撮影もOK
              </p>

              <div className="flex items-center justify-center space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition text-xs sm:text-sm cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-slate-900" />
                  <span>カメラを起動</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl shadow-xs transition text-xs sm:text-sm cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>ファイル選択</span>
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
            }}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0]);
            }}
          />
        </div>
      </div>

      {/* 解析ステータス */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl flex items-center space-x-2.5 text-xs sm:text-sm font-semibold ${
          isAnalyzing ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          {isAnalyzing ? (
            <Sparkles className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 編集・確定フォーム */}
      {(parsedResult || selectedImage) && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>OCR検出結果の確認 ＆ 現場紐付け</span>
            <span className="text-xs font-normal text-slate-400">修正が必要な項目は直接編集できます</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 店舗名 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">店舗・購入先</label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="例: コーナンPRO 港北インター店"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
            </div>

            {/* 金額 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">支払総額 (税込)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">¥</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>
            </div>

            {/* 取引日 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">取引日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
            </div>

            {/* 現場・案件選択 */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                紐付ける現場案件 <span className="text-emerald-600 font-bold">（★粗利管理に直結）</span>
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="">一般管理費（現場指定なし）</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    【{p.client}】{p.name} （請負額: ¥{p.contractAmount.toLocaleString()}）
                  </option>
                ))}
              </select>
            </div>

            {/* 勘定科目 */}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">弥生会計 借方科目</label>
              <select
                value={accountTitle}
                onChange={(e) => setAccountTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="材料費（仕入高）">材料費（仕入高）</option>
                <option value="旅費交通費">旅費交通費（駐車場等）</option>
                <option value="外注費">外注費（応援人工・産廃）</option>
                <option value="消耗品費">消耗品費（養生テープ等）</option>
                <option value="車両費">車両費（ガソリン・高速代）</option>
                <option value="通信費">通信費</option>
              </select>
            </div>
          </div>

          {/* 品目明細（OCR検出された品目リスト） */}
          {parsedResult?.items && parsedResult.items.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 mb-2">OCR認識された購入品目明細:</h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                {parsedResult.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                    <span>{item.name}</span>
                    <span className="font-bold">¥{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                キャンセル
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl shadow-xs transition text-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>この内容で支出に登録する</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
