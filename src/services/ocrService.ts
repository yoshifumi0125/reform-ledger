import { ExpenseCategory, Project } from '../types';

export interface OcrParsedResult {
  vendor: string;
  date: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  category: ExpenseCategory;
  accountTitle: string;
  subAccountTitle: string;
  recommendedProjectId?: string;
  memo: string;
  items: { name: string; quantity: number; unitPrice: number; price: number }[];
  confidence: number;
}

// リフォーム業者の代表的なレシートパターン（コーナン、カインズ、モノタロウ、駐車場、ガソリン等）
const REFORM_RECEIPT_TEMPLATES = [
  {
    vendor: 'コーナンPRO 港北インター店',
    category: 'material' as ExpenseCategory,
    accountTitle: '材料費（仕入高）',
    subAccountTitle: 'コーナンPRO',
    items: [
      { name: '石膏ボード 9.5mm 3×6', quantity: 20, unitPrice: 650, price: 13000 },
      { name: '木割れ防止ビス 35mm', quantity: 2, unitPrice: 1280, price: 2560 },
      { name: '変成シリコンコーク ホワイト', quantity: 10, unitPrice: 580, price: 5800 },
      { name: '養生ポリフィルム 0.05×1800', quantity: 2, unitPrice: 2200, price: 4400 },
    ],
    amount: 28336,
    taxRate: 0.1,
    memo: '石膏ボード9.5mm、木割れ防止ビス、コーキング白、養生フィルム一式',
  },
  {
    vendor: 'カインズホーム 南砂町SUNAMO店',
    category: 'material' as ExpenseCategory,
    accountTitle: '材料費（仕入高）',
    subAccountTitle: 'カインズ',
    items: [
      { name: 'クッションフロア用ボンド 3kg', quantity: 1, unitPrice: 3800, price: 3800 },
      { name: 'ソフト巾木 60mm 25m巻', quantity: 2, unitPrice: 2480, price: 4960 },
      { name: 'フロアタイルカッター 替刃', quantity: 1, unitPrice: 980, price: 980 },
    ],
    amount: 10714,
    taxRate: 0.1,
    memo: '内装CF用接着剤ボンド、ソフト巾木、専用替刃',
  },
  {
    vendor: 'タイムズ24 新宿西口第2',
    category: 'parking' as ExpenseCategory,
    accountTitle: '旅費交通費',
    subAccountTitle: 'タイムズ24',
    items: [{ name: '駐車料金 08:15〜17:45 最大料金適用', quantity: 1, unitPrice: 3500, price: 3500 }],
    amount: 3500,
    taxRate: 0.1,
    memo: '現場車両駐車料金（ハイエース 終日）',
  },
  {
    vendor: 'モノタロウ （Web建材通販）',
    category: 'tools' as ExpenseCategory,
    accountTitle: '消耗品費',
    subAccountTitle: 'モノタロウ',
    items: [
      { name: 'マキタ 充電式チップソーカッタ替刃', quantity: 2, unitPrice: 4200, price: 8400 },
      { name: '3M 防塵マスク 8805-DS2 10枚入', quantity: 2, unitPrice: 2450, price: 4900 },
    ],
    amount: 14630,
    taxRate: 0.1,
    memo: 'チップソー替刃、3M防塵マスクDS2',
  },
  {
    vendor: '出光興産 セルフ調布SS',
    category: 'transport' as ExpenseCategory,
    accountTitle: '車両費',
    subAccountTitle: '出光SS',
    items: [{ name: '軽油 52.4L', quantity: 1, unitPrice: 8384, price: 8384 }],
    amount: 8384,
    taxRate: 0.1,
    memo: '現場資材運搬用トラック 軽油給油',
  },
  {
    vendor: '三興クリーン産業（産廃持込）',
    category: 'disposal' as ExpenseCategory,
    accountTitle: '外注費（産廃処理費）',
    subAccountTitle: '産業廃棄物',
    items: [{ name: '内装石膏ボード・木くず混載処分 1.2m3', quantity: 1, unitPrice: 19800, price: 19800 }],
    amount: 21780,
    taxRate: 0.1,
    memo: '内装解体ガラ処分（石膏ボード・木くずマニフェスト受領）',
  },
];

export const OcrService = {
  // レシート画像の解析シミュレーション
  async analyzeReceiptImage(
    imageDataUrl: string,
    activeProjects: Project[]
  ): Promise<OcrParsedResult> {
    // OCR解析の待ち時間シミュレーション (1.0秒)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ランダムにリフォーム業向けテンプレートを選択（実運用ではGemini Vision API / OCRバックエンドに送信）
    const templateIndex = Math.floor(Math.random() * REFORM_RECEIPT_TEMPLATES.length);
    const template = REFORM_RECEIPT_TEMPLATES[templateIndex];

    const today = new Date().toISOString().split('T')[0];
    const taxAmount = Math.round((template.amount * template.taxRate) / (1 + template.taxRate));

    // 進行中の案件があれば、自動的に候補として推薦
    const inProgressProject = activeProjects.find((p) => p.status === 'in_progress') || activeProjects[0];

    const parsed: OcrParsedResult = {
      vendor: template.vendor,
      date: today,
      amount: template.amount,
      taxRate: template.taxRate,
      taxAmount: taxAmount,
      category: template.category,
      accountTitle: template.accountTitle,
      subAccountTitle: template.subAccountTitle,
      recommendedProjectId: inProgressProject ? inProgressProject.id : undefined,
      memo: inProgressProject 
        ? `【${inProgressProject.name.slice(0, 14)}】${template.memo}`
        : template.memo,
      items: template.items,
      confidence: 0.96,
    };

    return parsed;
  },

  // 勘定科目の自動マッピング
  getSuggestedAccountTitle(category: ExpenseCategory): string {
    switch (category) {
      case 'material':
        return '材料費（仕入高）';
      case 'subcontract':
        return '外注費';
      case 'parking':
      case 'transport':
        return '旅費交通費';
      case 'disposal':
        return '外注費（産廃処分）';
      case 'tools':
        return '消耗品費';
      case 'other':
      default:
        return '雑費';
    }
  },
};
