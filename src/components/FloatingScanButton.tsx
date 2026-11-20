import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  Check, 
  X, 
  Building2, 
  AlertCircle,
  RefreshCw,
  Receipt
} from 'lucide-react';
import { ExpenseItem, Project, ExpenseCategory, YayoiApiConfig } from '../types';
import { OcrService } from '../services/ocrService';
import { compressImage } from '../services/imageCompressor';

interface FloatingScanButtonProps {
  projects: Project[];
  yayoiConfig?: YayoiApiConfig;
  onSuccess: (expense: ExpenseItem) => void;
  onOpenSettings?: () => void;
}

export const FloatingScanButton: React.FC<FloatingScanButtonProps> = ({
  projects,
  onSuccess,
  onOpenSettings,
}) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<{ type: 'info' | 'warning' | 'error'; message: string } | null>(null);

  // 入力・解析フォームステート
  const [imageData, setImageData] = useState<string | null>(null);
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [accountTitle, setAccountTitle] = useState('材料費（仕入高）');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [memo, setMemo] = useState('');

  // 写真撮影 or 画像選択ハンドラー
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setAiNotice(null);
    setIsOpenModal(true);
    setIsAnalyzing(true);

    try {
      // 1. スマホ撮影写真の高速圧縮
      const compressedDataUrl = await compressImage(file);
      setImageData(compressedDataUrl);

      // 2. Gemini APIキー確認
      const apiKey = OcrService.getGeminiApiKey();
      if (!apiKey) {
        setIsAnalyzing(false);
        setAiNotice({
          type: 'warning',
          message: 'Gemini APIキーが未設定です。手動で店舗名・金額を入力して保存できます。（画面上部⚙️設定から無料キーを登録するとAI自動解析が有効になります）',
        });
        setVendor('');
        setAmount('');
        setMemo('写真から登録');
        setSelectedProjectId(projects.find(p => p.status === 'in_progress')?.id || projects[0]?.id || '');
        return;
      }

      // 3. AI解析実行
      await analyzeImage(compressedDataUrl);
    } catch (err) {
      console.error('画像処理・解析エラー:', err);
      setIsAnalyzing(false);
      setAiNotice({
        type: 'error',
        message: '画像の読み込みに失敗しました。手動で入力してください。',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI解析
  const analyzeImage = async (dataUrl: string) => {
    try {
      const result = await OcrService.analyzeReceiptImage(dataUrl, projects);

      setVendor(result.vendor || '');
      setDate(result.date || new Date().toISOString().split('T')[0]);
      setAmount(result.amount || '');
      setCategory(result.category || 'material');
      setAccountTitle(result.accountTitle || '材料費（仕入高）');
      setMemo(result.memo || '');

      if (result.recommendedProjectId) {
        setSelectedProjectId(result.recommendedProjectId);
      } else {
        const inProgress = projects.find(p => p.status === 'in_progress') || projects[0];
        setSelectedProjectId(inProgress?.id || '');
      }

      setAiNotice({
        type: 'info',
        message: 'Gemini AI がレシートから店舗名・金額・日付を自動認識しました。',
      });
    } catch (err: unknown) {
      console.error('AI解析失敗:', err);
      const isNoKey = err instanceof Error && err.message === 'NO_API_KEY';
      setAiNotice({
        type: isNoKey ? 'warning' : 'error',
        message: isNoKey
          ? 'Gemini APIキーが未設定です。手動で入力できます。'
          : 'AI解析に失敗しました。手動で店舗名と金額を入力してください。',
      });
      setVendor('');
      setAmount('');
      setMemo('写真から登録');
      setSelectedProjectId(projects.find(p => p.status === 'in_progress')?.id || projects[0]?.id || '');
    }
  };

  // 登録保存
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('支払金額を入力してください。');
      return;
    }

    const newExpense: ExpenseItem = {
      id: `exp_${Date.now()}`,
      projectId: selectedProjectId || undefined,
      category,
      accountTitle,
      vendor: vendor || '店舗未記載',
      date,
      amount: Number(amount),
      taxRate: 0.1,
      taxAmount: Math.round((Number(amount) * 0.1) / 1.1),
      paymentMethod: 'business_card',
      memo,
      receiptImageUrl: imageData || undefined,
      yayoiSynced: false,
      receiptItems: [],
    };

    onSuccess(newExpense);
    setIsOpenModal(false);

    // トースト通知表示
    const targetProject = projects.find(p => p.id === selectedProjectId);
    const place = targetProject ? targetProject.name : '一般経費';
    setSuccessToast(`「${vendor || 'レシート'}（¥${Number(amount).toLocaleString()}）」を${place}に登録しました！`);
    setTimeout(() => setSuccessToast(null), 4000);

    // フォームリセット
    setImageData(null);
    setVendor('');
    setAmount('');
    setMemo('');
  };

  return (
    <>
      {/* 非表示のファイル・カメラ入力 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 画面フッターのフローティングアクションボタン（FAB） */}
      <aside aria-label="レシートクイックスキャン" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none">
        <div className="flex items-center bg-slate-900/95 hover:bg-slate-900 text-white rounded-full p-1.5 shadow-2xl backdrop-blur-md border border-orange-500/40 pointer-events-auto transition-transform hover:scale-105 active:scale-95 ring-4 ring-orange-500/20 whitespace-nowrap">
          {/* 写真撮影ボタン（オレンジグラデーション） */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm shadow-lg shadow-orange-500/30 transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white shrink-0" />
            <span className="whitespace-nowrap">写真を撮影</span>
          </button>

          {/* 区切り線 */}
          <div className="h-5 w-px bg-slate-700 mx-1 sm:mx-1.5 shrink-0" />

          {/* 画像追加ボタン */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 text-slate-200 hover:text-orange-300 font-bold px-3.5 sm:px-4 py-2.5 rounded-full text-xs sm:text-sm transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
          >
            <Upload className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="whitespace-nowrap">画像を追加</span>
          </button>
        </div>
      </aside>

      {/* 登録成功トースト通知 */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-orange-600 text-white font-bold px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs sm:text-sm animate-fade-in border border-orange-400">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* レシート確認・登録モーダル（はみ出し防止・完全Portal化） */}
      {isOpenModal && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 flex items-end sm:items-center justify-center animate-fade-in">
          <form 
            onSubmit={handleSaveExpense}
            className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up"
          >
            {/* ヘッダー（固定） */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-1.5">
                    <span>レシート・領収書を登録</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded-md">
                      AI OCR
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">店舗名・金額・現場を確認して保存</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* スクロールボディ */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* 解析中ローディング表示 */}
              {isAnalyzing && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-900">
                  <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin shrink-0" />
                  <div className="text-xs">
                    <strong className="block font-bold">Gemini AIでスキャン解析中...</strong>
                    <span className="text-emerald-700">店舗名、支払金額、取引日を自動抽出しています</span>
                  </div>
                </div>
              )}

              {/* AI通知バナー */}
              {!isAnalyzing && aiNotice && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start space-x-2.5 ${
                  aiNotice.type === 'info' ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' :
                  aiNotice.type === 'warning' ? 'bg-amber-50/80 border-amber-200 text-amber-900' :
                  'bg-rose-50/80 border-rose-200 text-rose-900'
                }`}>
                  {aiNotice.type === 'info' ? <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                  <div className="flex-1 font-medium leading-relaxed">
                    {aiNotice.message}
                    {aiNotice.type === 'warning' && onOpenSettings && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOpenModal(false);
                          onOpenSettings();
                        }}
                        className="block mt-1 font-bold text-amber-950 underline hover:text-amber-800"
                      >
                        ⚙️ Gemini APIキーを設定する →
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 画像プレビュー */}
              {imageData && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-44 bg-slate-900/5 flex items-center justify-center">
                  <img
                    src={imageData}
                    alt="レシートプレビュー"
                    className="max-h-44 object-contain"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md">
                    原本撮影済
                  </div>
                </div>
              )}

              {/* 金額入力（最重要・特大表示） */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  支払金額（税込） <span className="text-rose-500 font-black">*必須</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-black text-lg">¥</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    required
                    className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* 店舗名 ＆ 取引日 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">購入店舗・支払先</label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="例: コーナンPRO、カインズ、ウオロク"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">取引日</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                    required
                  />
                </div>
              </div>

              {/* 紐付け現場の選択 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>紐付ける現場案件</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">指定なし＝一般経費</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                >
                  <option value="">一般管理費（現場指定なし・スーパー/事務消耗品等）</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      【{p.client}】{p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 費目分類 ＆ 勘定科目 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">費目分類</label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const cat = e.target.value as ExpenseCategory;
                      setCategory(cat);
                      if (cat === 'material') setAccountTitle('材料費（仕入高）');
                      else if (cat === 'parking' || cat === 'transport') setAccountTitle('旅費交通費');
                      else if (cat === 'disposal') setAccountTitle('外注費（産廃処分）');
                      else if (cat === 'tools') setAccountTitle('消耗品費');
                      else setAccountTitle('雑費');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                  >
                    <option value="material">材料費（資材・建材）</option>
                    <option value="parking">現場駐車代（パーキング）</option>
                    <option value="disposal">産廃処分費</option>
                    <option value="transport">交通費・ガソリン・ETC</option>
                    <option value="tools">工具・消耗品</option>
                    <option value="other">一般経費・雑費</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">弥生 借方科目</label>
                  <input
                    type="text"
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                  />
                </div>
              </div>

              {/* 品目メモ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">購入品目・用途メモ</label>
                <input
                  type="text"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="例: 石膏ボード、CFボンド、養生テープ"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* フッター（固定） */}
            <div className="flex-shrink-0 p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end space-x-3 bg-slate-50/60">
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isAnalyzing || !amount || Number(amount) <= 0}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-black px-6 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-md shadow-orange-500/20 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>この内容で登録する</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </>
  );
};
