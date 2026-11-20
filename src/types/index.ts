// 型定義: 下請けリフォーム業者向け現場収支管理 & 弥生会計API連携（実務完全準拠）

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'invoiced' | 'paid';

export type TradeCategory = 
  | 'full_renovation' // 全面リノベーション・大規模改修
  | 'carpentry'       // 木工事・大工造作
  | 'interior'        // 内装工事（クロス・CF・フロアタイル・塩ビシート）
  | 'plumbing'        // 水回り設備工事（キッチン・ユニットバス・洗面・トイレ・給排水配管）
  | 'electrical'      // 電気・空調設備工事（配線・分電盤・エアコン・換気扇・照明）
  | 'exterior'        // 外壁塗装・屋根葺き替え・シーリング防水
  | 'demolition'      // 解体・ハツリ・間取り撤去
  | 'fixtures';       // 建具・サッシ・建具調整

export interface Project {
  id: string;
  name: string;             // 工事名（例: 渋谷区代官山 K様邸 内装・水回り改修）
  client: string;           // 元請会社名（例: 大和リビング、タマック工務店）
  contractAmount: number;   // 請負金額（税込売上）
  taxRate: number;          // 消費税率（通常10%）
  status: ProjectStatus;
  startDate: string;        // 着工日
  endDate: string;          // 完工予定日 / 完工日
  invoicedDate?: string;    // 請求書発行日
  paymentDueDate?: string;  // 入金期日
  notes?: string;           // 現場特記事項（支給品・駐車場所・鍵の所在など）
  category: TradeCategory;  // 主要工種
}

export type ExpenseCategory = 
  | 'material'    // 材料費・資材費（石膏ボード、金物、クロス、塗料、配管継手など）
  | 'subcontract' // 外注費（応援大工、電気屋、解体屋、シール屋などの人工・下請費）
  | 'parking'     // 現場駐車場代（コインパーキング）
  | 'transport'   // 高速道路・燃料・現場移動交通費
  | 'disposal'    // 産廃処理・残材処分費（コンテナ・持込マニフェスト）
  | 'tools'       // 工具備品・消耗品費（チップソー替刃、養生テープ、防塵マスク）
  | 'other';      // 雑費・その他現場直接経費

export interface ExpenseReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  price: number;
}

export interface ExpenseItem {
  id: string;
  projectId?: string;        // 現場ID（未紐付けの場合は一般共通経費）
  date: string;             // 発生日
  vendor: string;           // 支払先・店舗名（コーナンPRO、カインズ、モノタロウ、タイムズ等）
  category: ExpenseCategory;
  accountTitle: string;     // 弥生会計勘定科目（材料費（仕入高）、外注費、旅費交通費、消耗品費など）
  subAccountTitle?: string; // 弥生会計補助科目（店名・現場名など）
  amount: number;           // 支払総額（税込）
  taxRate: number;          // 10% または 8%（軽減税率）
  taxAmount: number;        // 内消費税額
  paymentMethod: 'business_card' | 'owner_advance' | 'cash' | 'bank_transfer'; // 支払元（未払金/事業主借/現金/普通預金）
  receiptImageUrl?: string; // レシート画像（Base64 DataURL）
  receiptItems?: ExpenseReceiptItem[]; // OCR認識された明細
  memo: string;
  yayoiSynced: boolean;     // 弥生会計への送信完了フラグ
  yayoiSyncedAt?: string;   // 送信日時
  yayoiJournalId?: string;  // 弥生仕訳ID（例: YY-202611-0082）
}

export interface LaborRecord {
  id: string;
  projectId: string;        // 現場ID
  date: string;             // 稼働日
  craftsmanName: string;    // 職人名・屋号（例: 佐藤棟梁、山田クロス、鈴木電工）
  tradeType: string;        // 職種（大工、電気工、内装工、解体工、塗装工など）
  manDays: number;          // 人工数（0.25人工、0.5人工、1.0人工、1.5人工、2.0人工など）
  dailyRate: number;        // 日当単価（税込）
  totalAmount: number;      // 日当総額 (manDays * dailyRate)
  withholdingTax: number;   // 源泉所得税（10.21%自動計算）
  netPayment: number;       // 差引手取振込額 (totalAmount - withholdingTax)
  status: 'scheduled' | 'worked' | 'paid';
  yayoiSynced: boolean;
}

export interface YayoiApiConfig {
  clientId: string;
  clientSecret: string;
  companyId: string;
  isConnected: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  autoSync: boolean;
  defaultDebitAccount: string;  // デフォルト借方科目（材料費（仕入高））
  defaultCreditAccount: string; // デフォルト貸方科目（事業主借 / 未払金 / 現金 / 普通預金）
  yayoiType: 'online' | 'desktop'; // 弥生会計オンライン or デスクトップ
}

export interface YayoiSyncLog {
  id: string;
  timestamp: string;
  type: 'api_export' | 'csv_download' | 'auth_refresh';
  count: number;
  totalAmount: number;
  status: 'success' | 'failed' | 'pending' | 'error';
  responseMessage: string;
  message?: string;
  details?: string;
  itemCount?: number;
}

export interface MonthlySummary {
  totalSales: number;           // 請負売上合計
  paidSales: number;            // 入金済売上
  pendingSales: number;         // 請求中・未回収
  totalMaterialCost: number;    // 現場材料費合計
  totalLaborCost: number;       // 外注応援人工費合計
  totalDirectExpenses: number;  // 現場直接経費（パーキング・産廃・高速等）
  totalGeneralExpenses: number; // 一般管理費・現場未指定経費
  totalAllExpenses: number;     // 全支出・経費総合計
  grossProfit: number;          // 現場粗利益
  grossProfitMargin: number;    // 粗利率 (%)
  netProfit: number;            // 差引純利益
}
