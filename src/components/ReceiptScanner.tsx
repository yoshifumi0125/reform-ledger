import React, { useState, useRef } from 'react';
import { 
  Camera, 
  UploadCloud, 
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
  ArrowRight
} from 'lucide-react';
import { ExpenseItem, Project, ExpenseCategory, YayoiApiConfig } from '../types';
import { OcrService, OcrParsedResult } from '../services/ocrService';
import { YayoiApiService } from '../services/yayoiApi';

interface ReceiptScannerProps {
  projects: Project[];
  yayoiConfig: YayoiApiConfig;
  onAddExpense: (expense: ExpenseItem) => void;
  onClose?: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  projects,
  yayoiConfig,
  onAddExpense,
  onClose,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<OcrParsedResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編集フォームのステート
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0.1);
  const [category, setCategory] = useState<ExpenseCategory>('material');
  const [accountTitle, setAccountTitle] = useState('材料費（仕入高）');
  const [subAccountTitle, setSubAccountTitle] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'business_card' | 'cash' | 'owner_advance' | 'bank_transfer'>('business_card');
  const [memo, setMemo] = useState('');
  const [autoSyncToYayoi, setAutoSyncToYayoi] = useState(false);

  // 画像アップロード処理
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedImage(dataUrl);
      await analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // サンプルレシートでのクイックテスト
  const handleSampleReceipt = async (sampleType: string) => {
    // 仮想のレシート画像データURL
    const placeholderUrl = `https://placehold.co/400x600/f8fafc/0f172a?text=Receipt+${encodeURIComponent(sampleType)}`;
    setSelectedImage(placeholderUrl);
    await analyzeImage(placeholderUrl);
  };

  // OCR解析実行
  const analyzeImage = async (dataUrl: string) => {
    setIsAnalyzing(true);
    setStatusMessage('レシート・領収書をOCRスキャン中...（店舗名、日付、品目、金額、税率を検出）');

    try {
      const result = await OcrService.analyzeReceiptImage(dataUrl, projects);
      setParsedResult(result);
      
      // フォームへ反映
      setVendor(result.vendor);
      setDate(result.date);
      setAmount(result.amount);
      setTaxRate(result.taxRate);
      setCategory(result.category);
      setAccountTitle(result.accountTitle);
      setSubAccountTitle(result.subAccountTitle);
      setSelectedProjectId(result.recommendedProjectId || '');
      setMemo(result.memo);

      setStatusMessage('OCR解析が完了しました！内容を確認・必要に応じて現場を紐付けてください。');
    } catch (err) {
      console.error(err);
      setStatusMessage('解析中にエラーが発生しました。手動で入力してください。');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // カテゴリ変更時に勘定科目を自動変更
  const handleCategoryChange = (newCat: ExpenseCategory) => {
    setCategory(newCat);
    setAccountTitle(OcrService.getSuggestedAccountTitle(newCat));
  };

  // 現場変更時にメモ欄に現場名を付与
  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    if (projId) {
      const p = projects.find((x) => x.id === projId);
      if (p) {
        const prefix = `【${p.name.slice(0, 12)}】`;
        if (!memo.startsWith('【')) {
          setMemo(`${prefix} ${memo}`);
        }
      }
    }
  };

  // 登録処理
  const handleSave = async () => {
    if (!vendor || !amount) {
      alert('店舗名と金額は必須です。');
      return;
    }

    const taxAmount = Math.round((amount * taxRate) / (1 + taxRate));
    const newId = `exp-${Date.now()}`;

    let synced = false;
    let syncedAt: string | undefined = undefined;
    let yayoiJournalId: string | undefined = undefined;

    // もし弥生会計即時送信がONなら
    if (autoSyncToYayoi && yayoiConfig.isConnected) {
      try {
        const tempExpense: ExpenseItem = {
          id: newId,
          projectId: selectedProjectId || undefined,
          date,
          vendor,
          category,
          accountTitle,
          subAccountTitle,
          amount,
          taxRate,
          taxAmount,
          paymentMethod,
          memo,
          receiptImageUrl: selectedImage || undefined,
          receiptItems: parsedResult?.items,
          yayoiSynced: false,
        };
        const res = await YayoiApiService.syncExpensesToYayoi([tempExpense], yayoiConfig);
        if (res.success && res.assignedJournalIds?.[0]) {
          synced = true;
          syncedAt = new Date().toISOString();
          yayoiJournalId = res.assignedJournalIds[0].journalId;
        }
      } catch (e) {
        console.error('Yayoi auto sync error:', e);
      }
    }

    const newExpense: ExpenseItem = {
      id: newId,
      projectId: selectedProjectId || undefined,
      date,
      vendor,
      category,
      accountTitle,
      subAccountTitle,
      amount,
      taxRate,
      taxAmount,
      paymentMethod,
      memo,
      receiptImageUrl: selectedImage || undefined,
      receiptItems: parsedResult?.items,
      yayoiSynced: synced,
      yayoiSyncedAt: syncedAt,
      yayoiJournalId,
    };

    onAddExpense(newExpense);

    alert(`経費を登録しました！${synced ? '（弥生会計への仕訳送信も完了しました）' : ''}`);

    // リセット
    setSelectedImage(null);
    setParsedResult(null);
    setStatusMessage(null);
    if (onClose) onClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 説明ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={22} color="var(--primary)" />
            レシート・領収書かんたん読取（receipt-app OCR）
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            コーナン・カインズ・駐車場等のレシートをスマホ撮影するだけで、金額・品目を自動抽出し現場に紐付けます。
          </p>
        </div>

        {/* クイックサンプルトリガー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            試す（サンプル）:
          </span>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handleSampleReceipt('コーナンPRO（建材・ボード）')}
          >
            コーナンPRO
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handleSampleReceipt('タイムズ駐車場')}
          >
            タイムズ駐車場
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handleSampleReceipt('モノタロウ（刃物・マスク）')}
          >
            モノタロウ
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedImage ? '1fr 1.2fr' : '1fr', gap: '1.5rem' }}>
        
        {/* レシート画像アップロード / プレビュー エリア */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImageUpload(e.target.files[0]);
              }
            }}
          />

          {!selectedImage ? (
            <div 
              style={{
                width: '100%',
                border: '2px dashed var(--border-dark)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: '#f8fafc',
                transition: 'all 0.2s ease'
              }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleImageUpload(e.dataTransfer.files[0]);
                }
              }}
            >
              <div style={{ 
                width: 56, 
                height: 56, 
                borderRadius: '50%', 
                backgroundColor: 'var(--primary-light)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <UploadCloud size={28} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                レシート写真を撮影 または ここにドロップ
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                JPEG, PNG, HEIC対応 ｜ スマホカメラで直接撮影可能
              </p>
              <button className="btn btn-primary btn-sm">
                <Camera size={16} />
                写真を選択・撮影
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '100%', maxHeight: 420, overflow: 'hidden', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textAlign: 'center', backgroundColor: '#0f172a' }}>
                <img 
                  src={selectedImage} 
                  alt="Receipt Preview" 
                  style={{ maxHeight: 400, maxWidth: '100%', objectFit: 'contain' }} 
                />
                
                {/* スキャン中のアニメーションオーバーレイ */}
                {isAnalyzing && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(30, 58, 138, 0.4)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}>
                    <RefreshCw size={36} className="spin-animation" style={{ animation: 'spin 1.2s linear infinite' }} />
                    <span style={{ marginTop: '0.75rem', fontWeight: 700, fontSize: '0.95rem' }}>
                      AI OCR 解析中...
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', width: '100%' }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1 }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera size={14} />
                  別の写真に変更
                </button>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => analyzeImage(selectedImage)}
                  disabled={isAnalyzing}
                >
                  <Sparkles size={14} color="var(--primary)" />
                  再解析
                </button>
              </div>
            </div>
          )}

          {statusMessage && (
            <div style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isAnalyzing ? 'var(--primary-light)' : 'var(--success-bg)',
              color: isAnalyzing ? 'var(--primary)' : 'var(--success)',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%'
            }}>
              {isAnalyzing ? <RefreshCw size={14} /> : <CheckCircle2 size={14} />}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* OCR解析結果・手動調整・現場紐付けフォーム */}
        {selectedImage && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="var(--primary)" />
                解析結果・現場紐付け
              </h3>
              <span className="badge badge-in_progress">
                AI自動推論済
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">
                  関連する現場（案件）
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: '0.5rem' }}>
                    ※現場に紐付けることで粗利がリアルタイム計算されます
                  </span>
                </label>
                <select 
                  className="form-select"
                  value={selectedProjectId}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  style={{ fontWeight: 600, borderColor: selectedProjectId ? 'var(--primary)' : 'var(--border)' }}
                >
                  <option value="">現場未指定（一般管理費・車両等）</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.status === 'in_progress' ? '施工中' : p.status}] {p.name} ({p.client})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">購入店・支払先</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={vendor} 
                  onChange={(e) => setVendor(e.target.value)} 
                  placeholder="例: コーナンPRO 世田谷店" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">取引日付</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">支払金額 (税込)</label>
                <input 
                  type="number" 
                  className="form-input amount-text" 
                  value={amount || ''} 
                  onChange={(e) => setAmount(Number(e.target.value))} 
                  style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">消費税率</label>
                <select 
                  className="form-select" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                >
                  <option value={0.1}>10% 標準税率（資材・工具・駐車場）</option>
                  <option value={0.08}>8% 軽減税率（現場差し入れ飲食料品）</option>
                  <option value={0}>0% 対象外</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">経費種別</label>
                <select 
                  className="form-select" 
                  value={category} 
                  onChange={(e) => handleCategoryChange(e.target.value as ExpenseCategory)}
                >
                  <option value="material">材料費・資材費（ボード・木材・金物など）</option>
                  <option value="subcontract">外注費（応援人工・電気・設備等）</option>
                  <option value="parking">現場駐車場代（コインパーキング）</option>
                  <option value="transport">交通費・高速道路ETC・燃料代</option>
                  <option value="disposal">産廃処分費（解体ガラ持込等）</option>
                  <option value="tools">工具・消耗品費（ビット・丸ノコ刃・養生）</option>
                  <option value="other">その他現場雑費</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  弥生勘定科目
                  <span style={{ fontSize: '0.75rem', color: 'var(--yayoi)', marginLeft: '0.35rem' }}>弥生連動</span>
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={accountTitle} 
                  onChange={(e) => setAccountTitle(e.target.value)} 
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">支払元（貸方科目）</label>
                <select 
                  className="form-select" 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                >
                  <option value="business_card">事業用クレジットカード（未払金）</option>
                  <option value="owner_advance">事業主借（個人立替・個人の財布・個人カード）</option>
                  <option value="cash">事業用現金（現金出納帳）</option>
                  <option value="bank_transfer">銀行口座引落（普通預金）</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">摘要・工事メモ</label>
                <textarea 
                  className="form-textarea" 
                  rows={2} 
                  value={memo} 
                  onChange={(e) => setMemo(e.target.value)} 
                  placeholder="例: 石膏ボード12.5mm、コーススレッド、養生テープ" 
                />
              </div>
            </div>

            {/* 検出された品目明細プレビュー */}
            {parsedResult?.items && parsedResult.items.length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  OCR検出明細（{parsedResult.items.length}件）:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.78rem' }}>
                  {parsedResult.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{it.name} × {it.quantity}</span>
                      <span className="amount-text">¥{it.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 弥生会計即時送信チェックボックス */}
            {yayoiConfig.isConnected && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'var(--yayoi-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--yayoi-border)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input 
                  type="checkbox" 
                  id="autoYayoi" 
                  checked={autoSyncToYayoi} 
                  onChange={(e) => setAutoSyncToYayoi(e.target.checked)} 
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="autoYayoi" style={{ fontSize: '0.825rem', color: '#9a3412', cursor: 'pointer', fontWeight: 600 }}>
                  登録と同時に弥生会計オンラインへ仕訳送信する
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={handleSave}>
                <CheckCircle2 size={18} />
                <span>現場経費として登録</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
