import React, { useState } from 'react';
import { 
  ExpenseItem, 
  Project, 
  YayoiApiConfig, 
  YayoiSyncLog 
} from '../types';
import { 
  RefreshCw, 
  CheckCircle2, 
  Download, 
  Settings, 
  Key, 
  ShieldCheck, 
  ArrowRight,
  Database,
  ExternalLink,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { YayoiApiService } from '../services/yayoiApi';
import { YayoiExportService } from '../services/yayoiExport';
import { StorageService } from '../services/storage';

interface YayoiSyncModalProps {
  expenses: ExpenseItem[];
  projects: Project[];
  yayoiConfig: YayoiApiConfig;
  onUpdateConfig: (config: YayoiApiConfig) => void;
  onBulkSyncComplete: (syncedExpenseIds: string[], journalMapping: Record<string, string>) => void;
  onClose: () => void;
}

export const YayoiSyncModal: React.FC<YayoiSyncModalProps> = ({
  expenses,
  projects,
  yayoiConfig,
  onUpdateConfig,
  onBulkSyncComplete,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'csv' | 'settings'>('sync');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // 設定フォーム
  const [clientId, setClientId] = useState(yayoiConfig.clientId);
  const [clientSecret, setClientSecret] = useState(yayoiConfig.clientSecret);
  const [companyId, setCompanyId] = useState(yayoiConfig.companyId);
  const [defaultCreditAccount, setDefaultCreditAccount] = useState(yayoiConfig.defaultCreditAccount);

  const unsyncedExpenses = expenses.filter((e) => !e.yayoiSynced);
  const totalUnsyncedAmount = unsyncedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 弥生会計へのワンクリックAPI送信
  const handleStartApiSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await YayoiApiService.syncExpensesToYayoi(expenses, yayoiConfig);
      if (res.success) {
        setSyncResult(res.message);
        
        const mapping: Record<string, string> = {};
        const syncedIds: string[] = [];
        res.assignedJournalIds?.forEach((item) => {
          mapping[item.expenseId] = item.journalId;
          syncedIds.push(item.expenseId);
        });

        onBulkSyncComplete(syncedIds, mapping);
      } else {
        setSyncResult(`エラー: ${res.message}`);
      }
    } catch (err: any) {
      setSyncResult(`通信エラー: ${err.message || '弥生APIへの送信に失敗しました'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 弥生ID認証シミュレーション
  const handleOAuthConnect = async () => {
    setIsSyncing(true);
    try {
      const auth = await YayoiApiService.simulateOAuthLogin();
      const updatedConfig: YayoiApiConfig = {
        ...yayoiConfig,
        isConnected: true,
        accessToken: auth.accessToken,
        tokenExpiresAt: auth.expiresAt,
        companyId: auth.companyId,
      };
      onUpdateConfig(updatedConfig);
      setCompanyId(auth.companyId);
      alert('弥生ID（スマート取引取込API）と正常に接続完了しました！');
    } catch (err) {
      console.error(err);
      alert('認証に失敗しました。');
    } finally {
      setIsSyncing(false);
    }
  };

  // CSVダウンロード
  const handleDownloadCsv = () => {
    const csv = YayoiExportService.generateYayoiCsv(expenses, projects);
    const dateStr = new Date().toISOString().split('T')[0];
    YayoiExportService.downloadCsv(csv, `弥生会計_仕訳日記帳取込用_${dateStr}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* モーダルヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-800">
                弥生会計 連携ハブ（スマート取引取込）
              </h3>
              <p className="text-xs text-slate-400">
                公式API直接送信 ＆ 仕訳日記帳インポートCSV生成
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex space-x-1 border-b border-slate-100 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('sync')}
            className={`px-4 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'sync'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            API直接一括送信 ({unsyncedExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'csv'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            仕訳CSV出力（25列形式）
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 border-b-2 transition cursor-pointer ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            API接続設定
          </button>
        </div>

        {/* タブ1: API一括送信 */}
        {activeTab === 'sync' && (
          <div className="space-y-4">
            {/* 接続状況バナー */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold text-slate-700">弥生スマート取引取込APIステータス</div>
                  <div className="text-[11px] text-slate-400">事業所ID: {companyId || '未設定'}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOAuthConnect}
                disabled={isSyncing}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-xs"
              >
                弥生ID再認証
              </button>
            </div>

            {/* 未送信サマリー */}
            <div className="bg-orange-50/60 rounded-2xl p-5 border border-orange-200 text-center space-y-2">
              <div className="text-xs font-bold text-orange-800">未送信の現場経費レシート</div>
              <div className="text-3xl font-extrabold text-orange-950">
                {unsyncedExpenses.length} <span className="text-sm font-normal">件</span>
              </div>
              <div className="text-xs text-orange-700">
                合計金額: <strong>¥{totalUnsyncedAmount.toLocaleString()}</strong>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleStartApiSync}
                  disabled={isSyncing || unsyncedExpenses.length === 0}
                  className="inline-flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold px-6 py-3 rounded-2xl text-sm transition cursor-pointer shadow-md shadow-orange-600/20 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '弥生へ仕訳送信中...' : '弥生会計へ一括自動送信する'}</span>
                </button>
              </div>
            </div>

            {/* 送信結果 */}
            {syncResult && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{syncResult}</span>
              </div>
            )}
          </div>
        )}

        {/* タブ2: CSV出力 */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex items-center space-x-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-800">弥生会計「仕訳日記帳」公式インポート準拠CSV</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    弥生会計デスクトップ版（プロ/スタンダード）およびオンライン版の両方で取り込み可能です。
                  </p>
                </div>
              </div>

              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside bg-white p-3 rounded-xl border border-slate-100">
                <li>借方科目: 材料費（仕入高）、旅費交通費、消耗品費など自動割当</li>
                <li>貸方科目: 事業主借（個人立替）/ 未払金（法人カード）に対応</li>
                <li>摘要欄: 【現場名】＋店舗名＋品目メモをフォーマット出力</li>
              </ul>

              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>弥生仕訳日記帳CSVをダウンロード ({expenses.length}件)</span>
              </button>
            </div>
          </div>
        )}

        {/* タブ3: 設定 */}
        {activeTab === 'settings' && (
          <div className="space-y-3 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">事業所ID</label>
              <input
                type="text"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="yayoi-corp-10492"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">既定の貸方科目（決済元）</label>
              <select
                value={defaultCreditAccount}
                onChange={(e) => setDefaultCreditAccount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
              >
                <option value="事業主借">事業主借（個人立替・一人親方定番）</option>
                <option value="未払金">未払金（法人ビジネスカード決済）</option>
                <option value="現金">現金（現場小口現金）</option>
                <option value="普通預金">普通預金（口座振込）</option>
              </select>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  onUpdateConfig({
                    ...yayoiConfig,
                    companyId,
                    defaultCreditAccount,
                  });
                  alert('設定を保存しました。');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                設定を保存
              </button>
            </div>
          </div>
        )}

        {/* フッター */}
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
