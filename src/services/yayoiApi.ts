import { ExpenseItem, YayoiApiConfig, YayoiSyncLog } from '../types';
import { StorageService } from './storage';

export interface YayoiApiResponse {
  success: boolean;
  message: string;
  syncedCount: number;
  totalAmount: number;
  assignedJournalIds?: { expenseId: string; journalId: string }[];
  rawResponse?: unknown;
}

export const YayoiApiService = {
  // 弥生会計APIとの接続テスト
  async testConnection(config: YayoiApiConfig): Promise<{ success: boolean; message: string }> {
    // 弥生APIのOAuth2認証エンドポイント検証シミュレーション
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (!config.clientId || !config.clientSecret) {
      return {
        success: false,
        message: 'Client ID または Client Secret が未設定です。弥生開発者ポータルで発行されたキーを入力してください。',
      };
    }

    if (!config.isConnected) {
      return {
        success: false,
        message: '弥生IDアカウントとのOAuth認証が未完了です。「弥生IDで認証する」を実行してください。',
      };
    }

    return {
      success: true,
      message: `弥生会計オンライン (事業所ID: ${config.companyId || 'corp_001'}) とのOAuth2.0 APIセッションは正常です。`,
    };
  },

  // 未送信の経費データを弥生会計（スマート取引取込API）へ一括送信
  async syncExpensesToYayoi(
    expenses: ExpenseItem[],
    config: YayoiApiConfig
  ): Promise<YayoiApiResponse> {
    if (!config.isConnected) {
      throw new Error('弥生会計APIと接続されていません。設定画面で認証を完了してください。');
    }

    const unSyncedExpenses = expenses.filter((e) => !e.yayoiSynced);
    if (unSyncedExpenses.length === 0) {
      return {
        success: true,
        message: '送信対象の未連携データはありません。すべての仕訳が連携済みです。',
        syncedCount: 0,
        totalAmount: 0,
      };
    }

    // ネットワークリクエストシミュレーション (1.2秒)
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // 弥生スマートコネクト API ペイロード構築
    const yayoiPayload = {
      sourceApp: 'ReformLedgerPro',
      companyId: config.companyId,
      journals: unSyncedExpenses.map((exp) => ({
        transactionDate: exp.date,
        debitAccount: exp.accountTitle,
        debitSubAccount: exp.subAccountTitle || exp.vendor,
        debitAmount: exp.amount,
        debitTaxType: exp.taxRate === 0.08 ? 'TAX_IN_8_REDUCED' : 'TAX_IN_10',
        creditAccount: config.defaultCreditAccount || '事業主借',
        creditAmount: exp.amount,
        summary: exp.memo,
        receiptAttached: !!exp.receiptImageUrl,
        sourceExpenseId: exp.id,
      })),
    };

    const now = new Date().toISOString();
    const timestampStr = new Date().toLocaleString('ja-JP');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    const assignedJournalIds = unSyncedExpenses.map((exp, idx) => ({
      expenseId: exp.id,
      journalId: `YY-${exp.date.replace(/-/g, '').slice(0, 6)}-${randomSuffix + idx}`,
    }));

    const totalAmount = unSyncedExpenses.reduce((sum, item) => sum + item.amount, 0);

    // ログ記録
    const log: YayoiSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: timestampStr,
      type: 'api_export',
      count: unSyncedExpenses.length,
      totalAmount,
      status: 'success',
      responseMessage: `弥生会計オンラインへ ${unSyncedExpenses.length} 件（計 ¥${totalAmount.toLocaleString()}）の仕訳送信に成功しました。`,
      details: JSON.stringify({ payloadCount: yayoiPayload.journals.length, status: 200 }),
    };
    StorageService.addYayoiLog(log);

    return {
      success: true,
      message: `弥生会計オンラインへ ${unSyncedExpenses.length} 件（計 ¥${totalAmount.toLocaleString()}）の仕訳を正常に送信しました。`,
      syncedCount: unSyncedExpenses.length,
      totalAmount,
      assignedJournalIds,
      rawResponse: { status: 200, syncTime: now },
    };
  },

  // 弥生ID認証シミュレーション
  async simulateOAuthLogin(): Promise<{ accessToken: string; expiresAt: string; companyId: string }> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    return {
      accessToken: 'yayoi_oauth_' + Math.random().toString(36).substring(2),
      expiresAt: expires,
      companyId: 'reform_renov_tokyo_01',
    };
  },
};
