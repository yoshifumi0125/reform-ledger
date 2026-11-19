import { ExpenseCategory, Project, ExpenseReceiptItem } from '../types';

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
  items: ExpenseReceiptItem[];
  confidence: number;
  isAiPowered?: boolean;
}

// リフォーム業者の代表的な実務レシートパターン（コーナンPRO、カインズ、モノタロウ、タイムズ駐車場、産廃等）
const REFORM_RECEIPT_TEMPLATES = [
  {
    vendor: 'コーナンPRO 世田谷八幡山店',
    category: 'material' as ExpenseCategory,
    accountTitle: '材料費（仕入高）',
    subAccountTitle: 'コーナンPRO',
    items: [
      { name: '吉野石膏 タイガーボード 12.5mm 3×6', quantity: 24, unitPrice: 820, price: 19680 },
      { name: '乾燥野縁材 30×40×3985 6本束', quantity: 6, unitPrice: 3480, price: 20880 },
      { name: 'コーススレッド ラッパ 28mm 1800本箱', quantity: 2, unitPrice: 1680, price: 3360 },
      { name: '養生ボード 青ベニ 900×1800 3mm', quantity: 10, unitPrice: 1100, price: 11000 },
      { name: 'セメダイン 変成シリコンシール ホワイト', quantity: 10, unitPrice: 620, price: 6200 },
    ],
    amount: 61120,
    taxRate: 0.1,
    memo: '石膏ボード12.5mm、野縁木材、コーススレッド、青ベニ養生、コーキング',
  },
  {
    vendor: 'カインズホーム 南砂町SUNAMO店',
    category: 'material' as ExpenseCategory,
    accountTitle: '材料費（仕入高）',
    subAccountTitle: 'カインズ',
    items: [
      { name: 'サンゲツ ベンリダイン 内装CF専用接着剤 3kg', quantity: 2, unitPrice: 3680, price: 7360 },
      { name: 'サンゲツ ソフト巾木 Rアリ 60mm 25m巻', quantity: 2, unitPrice: 2680, price: 5360 },
      { name: '床見切り材 アルミアングル 2000mm ブロンズ', quantity: 3, unitPrice: 1480, price: 4440 },
    ],
    amount: 17160,
    taxRate: 0.1,
    memo: 'CF用ボンド、ソフト巾木、床見切り材',
  },
  {
    vendor: 'タイムズ24 新宿西口第3駐車場',
    category: 'parking' as ExpenseCategory,
    accountTitle: '旅費交通費',
    subAccountTitle: 'タイムズ24',
    items: [{ name: '現場駐車料金 08:20〜18:00 (ハイエース作業車)', quantity: 1, unitPrice: 3800, price: 3800 }],
    amount: 3800,
    taxRate: 0.1,
    memo: '現場車両駐車料金（コインパーキング終日）',
  },
  {
    vendor: 'モノタロウ Web建材通販',
    category: 'tools' as ExpenseCategory,
    accountTitle: '消耗品費',
    subAccountTitle: 'モノタロウ',
    items: [
      { name: 'マキタ 充電式マルノコ用プレミアムタフコーティング刃 165mm', quantity: 2, unitPrice: 3980, price: 7960 },
      { name: '3M 防じんマスク 排気弁付 8805-DS2 10枚箱', quantity: 2, unitPrice: 2850, price: 5700 },
      { name: '日東電工 さくら養生テープ 50mm×25m 30巻入箱', quantity: 1, unitPrice: 6200, price: 6200 },
    ],
    amount: 19860,
    taxRate: 0.1,
    memo: 'マルノコ替刃165mm、3M防塵マスクDS2、さくら養生テープ箱',
  },
  {
    vendor: '首都高速道路 ETC利用照会サービス',
    category: 'transport' as ExpenseCategory,
    accountTitle: '旅費交通費',
    subAccountTitle: '首都高速',
    items: [{ name: 'ETC通行料 用賀〜富ヶ谷ランプ往復', quantity: 1, unitPrice: 2140, price: 2140 }],
    amount: 2140,
    taxRate: 0.1,
    memo: '資材・残材運搬往復 ETC高速通行料金',
  },
  {
    vendor: '三共産廃クリーンセンター（持込処分）',
    category: 'disposal' as ExpenseCategory,
    accountTitle: '外注費（産廃処分費）',
    subAccountTitle: '産業廃棄物',
    items: [{ name: '既設洗面台・内装解体ガラ混載 1.0立米処分', quantity: 1, unitPrice: 22000, price: 22000 }],
    amount: 24200,
    taxRate: 0.1,
    memo: '既設住宅設備・内装石膏ボード解体ガラ処分（マニフェストD票受領）',
  },
];

export const OcrService = {
  // Gemini APIキーの取得
  getGeminiApiKey(): string | null {
    if (typeof window !== 'undefined') {
      const localKey = localStorage.getItem('gemini_api_key');
      if (localKey && localKey.trim()) return localKey.trim();
    }
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && typeof envKey === 'string' && envKey.trim()) return envKey.trim();
    return null;
  },

  // サンプル試用データ（デモ用）
  getSampleReceiptData(sampleName?: string, inProgressProject?: Project): OcrParsedResult {
    let template = REFORM_RECEIPT_TEMPLATES[0];
    if (sampleName) {
      const found = REFORM_RECEIPT_TEMPLATES.find((t) => sampleName.includes(t.subAccountTitle) || sampleName.includes(t.vendor));
      if (found) template = found;
    } else {
      template = REFORM_RECEIPT_TEMPLATES[Math.floor(Math.random() * REFORM_RECEIPT_TEMPLATES.length)];
    }

    const today = new Date().toISOString().split('T')[0];
    const taxAmount = Math.round((template.amount * template.taxRate) / (1 + template.taxRate));

    return {
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
        ? `【${inProgressProject.name.slice(0, 16)}】${template.memo}`
        : template.memo,
      items: template.items,
      confidence: 0.95,
      isAiPowered: false,
    };
  },

  // レシート・領収書のAI OCR画像解析
  async analyzeReceiptImage(
    imageDataUrl: string,
    activeProjects: Project[]
  ): Promise<OcrParsedResult> {
    const apiKey = this.getGeminiApiKey();

    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    // 進行中現場の自動選定（粗利に即時反映させるため）
    const inProgressProject = activeProjects.find((p) => p.status === 'in_progress') || activeProjects[0];

    // Gemini Vision API 呼び出し
    const aiResult = await this.callGeminiVisionApi(imageDataUrl, apiKey, inProgressProject);
    if (!aiResult) {
      throw new Error('AI_PARSE_FAILED');
    }

    return {
      ...aiResult,
      recommendedProjectId: inProgressProject ? inProgressProject.id : undefined,
      isAiPowered: true,
      confidence: 0.98,
    };
  },

  // Gemini Vision REST API 呼び出し（複数モデルの自動フォールバック）
  async callGeminiVisionApi(
    imageDataUrl: string,
    apiKey: string,
    inProgressProject?: Project
  ): Promise<OcrParsedResult | null> {
    // Base64データとMIMEタイプの抽出
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;

    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `
あなたはリフォーム下請け業者・建築職人専用の経理AIアシスタントです。
提供されたレシート・領収書画像から、以下の項目を正確に抽出し、指定のJSON形式で出力してください。

【抽出・推論項目】
1. vendor: 店舗名・会社名（例: コーナンPRO、カインズ、タイムズ、モノタロウ、三共産廃、ENEOS等）
2. date: 取引日 (YYYY-MM-DD形式)
3. amount: 最終支払総額 (税込の数値)
4. taxRate: 消費税率 (0.1 または 0.08)
5. taxAmount: 内消費税額 (数値)
6. category: 費目分類 ("material" | "subcontract" | "parking" | "transport" | "disposal" | "tools" | "other")
   - 木材、ボード、ビス、配管、電材、塗料、クロス、接着剤 -> "material"
   - コインパーキング駐車料金 -> "parking"
   - ガソリン代、ETC高速代 -> "transport"
   - 産廃処理費、ゴミ処分持込 -> "disposal"
   - 丸ノコ替刃、ビット、養生テープ、防塵マスク、工具 -> "tools"
7. accountTitle: 弥生会計借方勘定科目（"材料費（仕入高）", "旅費交通費", "外注費", "消耗品費", "車両費", "雑費" から1つ）
8. subAccountTitle: 補助科目（店名など）
9. memo: 摘要（購入した主要品目の要約）
10. items: 各購入明細の配列 [{ "name": "品名", "quantity": 数量, "unitPrice": 単価, "price": 小計 }]

必ず以下のJSON形式のみを出力してください（Markdownのバッククォートなし）:
{
  "vendor": "店舗名",
  "date": "YYYY-MM-DD",
  "amount": 12345,
  "taxRate": 0.1,
  "taxAmount": 1122,
  "category": "material",
  "accountTitle": "材料費（仕入高）",
  "subAccountTitle": "コーナンPRO",
  "memo": "主要資材一式",
  "items": [
    { "name": "品名", "quantity": 1, "unitPrice": 1000, "price": 1000 }
  ]
}
`;

    // 安定して動作する現行 Gemini モデル候補順
    const modelsToTry = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const requestBody = {
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          console.warn(`モデル ${model} での呼び出し失敗 (${res.status})、次のモデルを試行します`);
          continue;
        }

        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) continue;

        const cleanJson = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
          vendor: parsed.vendor || '店舗名不明',
          date: parsed.date || new Date().toISOString().split('T')[0],
          amount: Number(parsed.amount) || 0,
          taxRate: Number(parsed.taxRate) || 0.1,
          taxAmount: Number(parsed.taxAmount) || Math.round((Number(parsed.amount) || 0) * 0.1 / 1.1),
          category: parsed.category || 'material',
          accountTitle: parsed.accountTitle || '材料費（仕入高）',
          subAccountTitle: parsed.subAccountTitle || parsed.vendor || '',
          memo: inProgressProject 
            ? `【${inProgressProject.name.slice(0, 16)}】${parsed.memo || ''}`
            : parsed.memo || '',
          items: Array.isArray(parsed.items) ? parsed.items : [],
          confidence: 0.99,
          isAiPowered: true,
        };
      } catch (err) {
        console.warn(`モデル ${model} 例外発生:`, err);
      }
    }

    return null;
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
