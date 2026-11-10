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
  AlertCircle, 
  Download, 
  Settings, 
  Key, 
  Server, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Database,
  ExternalLink,
  X
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
  const [activeTab, setActiveTab] = useState<'sync' | 'csv' | 'settings' | 'logs'>('sync');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<YayoiSyncLog[]>(() => StorageService.getYayoiLogs());

  // 設定フォーム
  const [clientId, setClientId] = useState(yayoiConfig.clientId);
  const [clientSecret, setClientSecret] = useState(yayoiConfig.clientSecret);
  const [companyId, setCompanyId] = useState(yayoiConfig.companyId);
  const [defaultCreditAccount, setDefaultCreditAccount] = useState(yayoiConfig.defaultCreditAccount);
  const [defaultDebitAccount, setDefaultDebitAccount] = useState(yayoiConfig.defaultDebitAccount);

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
        
        // 仕訳IDのマッピング
        const mapping: Record<string, string> = {};
        const syncedIds: string[] = [];
        res.assignedJournalIds?.forEach((item) => {
          mapping[item.expenseId] = item.journalId;
          syncedIds.push(item.expenseId);
        });

        onBulkSyncComplete(syncedIds, mapping);
        setLogs(StorageService.getYayoiLogs());
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
      alert('弥生IDアカウントとのOAuth2.0認証が完了しました！');
    } catch (e) {
      alert('認証エラーが発生しました。');
    } finally {
      setIsSyncing(false);
    }
  };

  // 設定保存
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: YayoiApiConfig = {
      ...yayoiConfig,
      clientId,
      clientSecret,
      companyId,
      defaultCreditAccount,
      defaultDebitAccount,
    };
    onUpdateConfig(updated);
    StorageService.saveYayoiConfig(updated);
    alert('弥生会計API連携設定を保存しました。');
  };

  // 弥生CSVダウンロード
  const handleDownloadCsv = () => {
    const csv = YayoiExportService.generateYayoiCsv(expenses, projects);
    const dateStr = new Date().toISOString().split('T')[0];
    YayoiExportService.downloadCsv(csv, `弥生会計仕訳日記帳_${dateStr}.csv`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
        
        {/* モーダルヘッダー */}
        <div className="modal-header" style={{ backgroundColor: 'var(--yayoi-bg)', borderBottom: '1px solid var(--yayoi-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 8, 
              backgroundColor: 'var(--yayoi)', 
              color: '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#9a3412', margin: 0 }}>
                弥生会計 連携ハブ（Yayoi API / CSV）
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#c2410c', margin: 0 }}>
                下請け現場のレシート経費を弥生会計オンラインへ直接API連携＆自動仕訳
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a3412' }}>
            <X size={20} />
          </button>
        </div>

        {/* タブナビゲーション */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.5rem', backgroundColor: '#ffffff' }}>
          {[
            { id: 'sync', label: 'API一括送信' },
            { id: 'csv', label: '弥生仕訳CSV出力' },
            { id: 'settings', label: 'API接続設定' },
            { id: 'logs', label: '連携ログ履歴' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--yayoi)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--yayoi)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {tab.label}
              {tab.id === 'sync' && unsyncedExpenses.length > 0 && (
                <span style={{ marginLeft: 6, backgroundColor: 'var(--yayoi)', color: '#ffffff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: 8 }}>
                  {unsyncedExpenses.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* モーダル本文 */}
        <div className="modal-body" style={{ minHeight: 340 }}>
          
          {/* TAB 1: API一括送信 */}
          {activeTab === 'sync' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* 接続ステータスカード */}
              <div style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: yayoiConfig.isConnected ? 'var(--success-bg)' : '#fef2f2',
                border: `1px solid ${yayoiConfig.isConnected ? 'var(--success-border)' : '#fecaca'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {yayoiConfig.isConnected ? (
                    <CheckCircle2 size={20} color="var(--success)" />
                  ) : (
                    <AlertCircle size={20} color="var(--danger)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: yayoiConfig.isConnected ? '#065f46' : '#991b1b' }}>
                      {yayoiConfig.isConnected ? '弥生会計オンライン API接続中' : '弥生会計API未接続'}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: yayoiConfig.isConnected ? '#047857' : '#b91c1c' }}>
                      事業所ID: {yayoiConfig.companyId} ｜ 認証方式: OAuth 2.0 (SmartConnect)
                    </div>
                  </div>
                </div>

                {!yayoiConfig.isConnected ? (
                  <button className="btn btn-yayoi btn-sm" onClick={handleOAuthConnect}>
                    弥生IDで認証する
                  </button>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    有効期限: {yayoiConfig.tokenExpiresAt?.split('T')[0]}
                  </span>
                )}
              </div>

              {/* 未送信サマリー */}
              <div className="card" style={{ backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>弥生会計へ未送信のレシート経費</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                      {unsyncedExpenses.length} 件 ｜ ¥{totalUnsyncedAmount.toLocaleString()}
                    </div>
                  </div>

                  <button 
                    className="btn btn-yayoi btn-lg"
                    onClick={handleStartApiSync}
                    disabled={isSyncing || unsyncedExpenses.length === 0 || !yayoiConfig.isConnected}
                  >
                    <RefreshCw size={18} className={isSyncing ? 'spin-animation' : ''} style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }} />
                    <span>{isSyncing ? '弥生APIへ送信中...' : '弥生会計へ一括送信'}</span>
                  </button>
                </div>
              </div>

              {syncResult && (
                <div style={{
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: syncResult.startsWith('エラー') ? '#fef2f2' : 'var(--success-bg)',
                  border: `1px solid ${syncResult.startsWith('エラー') ? '#fecaca' : 'var(--success-border)'}`,
                  fontSize: '0.85rem',
                  color: syncResult.startsWith('エラー') ? '#991b1b' : '#065f46',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle2 size={16} />
                  <span>{syncResult}</span>
                </div>
              )}

              {/* 未送信リストプレビュー */}
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  送信対象の仕訳（スマート取引取込形式）:
                </h4>
                {unsyncedExpenses.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    すべてのレシート・経費が弥生会計へ送信済みです
                  </p>
                ) : (
                  <div className="data-table-container" style={{ maxHeight: 220, overflowY: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>日付</th>
                          <th>借方勘定科目</th>
                          <th>補助科目/店名</th>
                          <th>金額</th>
                          <th>貸方科目</th>
                          <th>摘要</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unsyncedExpenses.map((exp) => (
                          <tr key={exp.id}>
                            <td>{exp.date}</td>
                            <td style={{ fontWeight: 600 }}>{exp.accountTitle}</td>
                            <td>{exp.subAccountTitle || exp.vendor}</td>
                            <td className="amount-text" style={{ fontWeight: 700 }}>¥{exp.amount.toLocaleString()}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{yayoiConfig.defaultCreditAccount}</td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{exp.memo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: 弥生仕訳CSV出力 */}
          {activeTab === 'csv' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card" style={{ backgroundColor: '#f8fafc' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Database size={18} color="var(--primary)" />
                  弥生会計 仕訳日記帳 CSVインポート機能
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  弥生会計デスクトップ版（プロフェッショナル / スタンダード）または弥生会計オンラインにそのままドラッグ＆ドロップで取り込める、弥生公式仕様（25列形式）の仕訳CSVを生成・出力します。
                </p>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={handleDownloadCsv}>
                    <Download size={16} />
                    <span>弥生仕訳CSVをダウンロード ({expenses.length}件)</span>
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                <strong>弥生会計への取込手順:</strong>
                <ol style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', lineHeight: 1.8 }}>
                  <li>上のボタンから「弥生会計仕訳データ.csv」をダウンロードします。</li>
                  <li>弥生会計を起動し、メニューバーの <strong>「ファイル」 &gt; 「インポート」</strong> を選択します。</li>
                  <li>取込形式で <strong>「仕訳日記帳」</strong> を選び、ダウンロードしたCSVファイルを指定してインポートします。</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 3: API設定 */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">弥生会計種別</label>
                  <select 
                    className="form-select"
                    value={yayoiConfig.yayoiType}
                    onChange={(e) => onUpdateConfig({ ...yayoiConfig, yayoiType: e.target.value as any })}
                  >
                    <option value="online">弥生会計 オンライン / 弥生青色申告 オンライン（スマート取引取込API）</option>
                    <option value="desktop">弥生会計 デスクトップ版（弥生ドライブ / CSVインポート連携）</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Client ID (APIキー)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={clientId} 
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Client Secret (シークレット)</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={clientSecret} 
                    onChange={(e) => setClientSecret(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">事業所ID (Company ID)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={companyId} 
                    onChange={(e) => setCompanyId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">デフォルト貸方科目（個人事業主向け）</label>
                  <select 
                    className="form-select"
                    value={defaultCreditAccount}
                    onChange={(e) => setDefaultCreditAccount(e.target.value)}
                  >
                    <option value="事業主借">事業主借（個人の財布・個人クレカ立替の定番）</option>
                    <option value="現金">事業用現金（現金出納帳）</option>
                    <option value="未払金">未払金（事業用クレジットカード）</option>
                    <option value="普通預金">普通預金（事業用口座）</option>
                  </select>
                </div>

              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  設定を保存
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: 連携ログ */}
          {activeTab === 'logs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                弥生会計APIとの通信履歴（最新50件）
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>日時</th>
                      <th>送信種別</th>
                      <th>件数</th>
                      <th>合計金額</th>
                      <th>ステータス</th>
                      <th>弥生APIレスポンス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{log.timestamp}</td>
                        <td>
                          {log.type === 'api_export' && 'スマート取引取込API'}
                          {log.type === 'csv_download' && '仕訳CSV出力'}
                        </td>
                        <td style={{ fontWeight: 600 }}>{log.count} 件</td>
                        <td className="amount-text">¥{log.totalAmount.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${log.status === 'success' ? 'badge-paid' : 'badge-in_progress'}`}>
                            {log.status === 'success' ? '成功 (200 OK)' : '失敗'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{log.responseMessage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* モーダルフッター */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
};
