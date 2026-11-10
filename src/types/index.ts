// 型定義: 下請けリフォーム業者向け現場収支管理 & 弥生会計連携

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'invoiced' | 'paid';

export interface Project {
  id: string;
  name: string;             // 工事名（例: 渋谷区代官山 K様邸 内装・水回り改修）
  client: string;           // 元請会社名（例: 住友林業ホームテック、武蔵野工務店）
  contractAmount: number;   // 請負金額（税込売上）
  taxRate: number;          // 消費税率（通常10%）
  status: ProjectStatus;
  startDate: string;        // 着工日
  endDate: string;          // 完工予定日 / 完工日
  paymentDueDate?: string;  // 入金予定日
  notes?: string;
  category: 'interior' | 'plumbing' | 'carpentry' | 'exterior' | 'full_renovation'; // 工種
}

export type ExpenseCategory = 
  | 'material'    // 材料費・資材費（石膏ボード、金物、クロス、塗料など）
  | 'subcontract' // 外注費（応援大工、電気屋、解体屋などの人工）
  | 'parking'     // 駐車場代（現場コインパーキング）
  | 'transport'   // 高速道路・燃料・交通費
  | 'disposal'    // 産廃処理・残材処分費
  | 'tools'       // 工具備品・消耗品費
  | 'other';      // 雑費・その他現場経費

export interface ExpenseItem {
  id: string;
  projectId?: string;        // 現場ID（未紐付けの場合は一般経費）
  date: string;             // 発生日
  vendor: string;           // 支払先・店舗名（コーナン、カインズ、モノタロウ等）
  category: ExpenseCategory;
  accountTitle: string;     // 弥生会計勘定科目（材料費、外注費、旅費交通費、消耗品費など）
  subAccountTitle?: string; // 補助科目（現場名、店名など）
  amount: number;           // 支払金額（税込）
  taxRate: number;          // 8% or 10%
  taxAmount: number;        // 税額
  paymentMethod: 'cash' | 'business_card' | 'bank_transfer' | 'owner_advance'; // 支払方法（事業主借/現金/カード/振込）
  receiptImageUrl?: string; // レシート画像（Base64 or URL）
  receiptItems?: { name: string; quantity: number; unitPrice: number; price: number }[];
  memo: string;
  yayoiSynced: boolean;     // 弥生会計への送信完了フラグ
  yayoiSyncedAt?: string;   // 送信日時
  yayoiJournalId?: string;  // 弥生仕訳ID
}

export interface LaborRecord {
  id: string;
  projectId: string;        // 現場ID
  date: string;
  craftsmanName: string;    // 職人名（例: 佐藤棟梁、山田クロス）
  tradeType: string;        // 職種（大工、電気工、内装工、解体工など）
  manDays: number;          // 人工数（1.0人工、0.5人工、1.5人工など）
  dailyRate: number;        // 日当単価
  totalAmount: number;      // 合計支払額 (manDays * dailyRate)
  withholdingTax: number;   // 源泉徴収税額（10.21%など）
  netPayment: number;       // 差引支払額
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
  defaultDebitAccount: string;  // デフォルト借方科目
  defaultCreditAccount: string; // デフォルト貸方科目（事業主借 / 現金 / 普通預金）
  yayoiType: 'online' | 'desktop'; // 弥生会計オンライン or 弥生会計デスクトップ
}

export interface YayoiSyncLog {
  id: string;
  timestamp: string;
  type: 'api_export' | 'csv_download' | 'auth_refresh';
  count: number;
  totalAmount: number;
  status: 'success' | 'failed' | 'pending';
  responseMessage: string;
  details?: string;
}

export interface MonthlySummary {
  totalSales: number;           // 売上合計（請求確定）
  paidSales: number;            // 入金済売上
  pendingSales: number;         // 未回収売上（売掛金）
  totalMaterialCost: number;    // 材料費合計
  totalLaborCost: number;       // 外注人工費合計
  totalDirectExpenses: number;  // 現場直課経費（駐車場・高速等）
  totalGeneralExpenses: number; // 一般管理費
  grossProfit: number;          // 粗利益 (売上 - 直接原価)
  grossProfitMargin: number;    // 粗利率 (%)
  netProfit: number;            // 純利益
}
