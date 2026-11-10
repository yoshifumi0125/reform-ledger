import React, { useState } from 'react';
import { 
  ExpenseItem, 
  Project, 
  ExpenseCategory, 
  YayoiApiConfig 
} from '../types';
import { 
  Receipt, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Trash2, 
  Edit3, 
  ExternalLink,
  Tag,
  Plus
} from 'lucide-react';
import { YayoiExportService } from '../services/yayoiExport';
import { YayoiApiService } from '../services/yayoiApi';

interface ExpensesListProps {
  expenses: ExpenseItem[];
  projects: Project[];
  yayoiConfig: YayoiApiConfig;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onOpenScanner: () => void;
  onOpenYayoiSync: () => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  projects,
  yayoiConfig,
  onUpdateExpense,
  onDeleteExpense,
  onOpenScanner,
  onOpenYayoiSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedYayoiFilter, setSelectedYayoiFilter] = useState('all');
  const [previewReceipt, setPreviewReceipt] = useState<ExpenseItem | null>(null);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // フィルタリング
  const filteredExpenses = expenses.filter((item) => {
    // 検索語句
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchVendor = item.vendor.toLowerCase().includes(q);
      const matchMemo = item.memo.toLowerCase().includes(q);
      const matchAccount = item.accountTitle.toLowerCase().includes(q);
      if (!matchVendor && !matchMemo && !matchAccount) return false;
    }

    // 現場フィルター
    if (selectedProjectFilter !== 'all') {
      if (selectedProjectFilter === 'unassigned') {
        if (item.projectId) return false;
      } else if (item.projectId !== selectedProjectFilter) {
        return false;
      }
    }

    // カテゴリフィルター
    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) {
      return false;
    }

    // 弥生フィルター
    if (selectedYayoiFilter === 'unsynced' && item.yayoiSynced) return false;
    if (selectedYayoiFilter === 'synced' && !item.yayoiSynced) return false;

    return true;
  });

  const unsyncedCount = expenses.filter((e) => !e.yayoiSynced).length;
  const filteredTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // CSVダウンロード
  const handleDownloadCsv = () => {
    const csvContent = YayoiExportService.generateYayoiCsv(filteredExpenses, projects);
    const dateStr = new Date().toISOString().split('T')[0];
    YayoiExportService.downloadCsv(csvContent, `弥生会計仕訳データ_${dateStr}.csv`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 上部ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={22} color="var(--primary)" />
            経費・レシート一覧（弥生仕訳台帳）
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            取り込んだレシート・経費を現場ごとに確認し、弥生会計へAPI送信またはCSV出力できます
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadCsv}>
            <Download size={15} />
            <span>弥生形式CSV出力</span>
          </button>
          <button className="btn btn-yayoi btn-sm" onClick={onOpenYayoiSync}>
            <RefreshCw size={15} />
            <span>弥生会計API同期 ({unsyncedCount}件)</span>
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenScanner}>
            <Plus size={15} />
            <span>レシート取込</span>
          </button>
        </div>
      </div>

      {/* フィルター＆検索バー */}
      <div className="card" style={{ padding: '0.85rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          
          {/* キーワード検索 */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="店舗名・品目・メモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          {/* 現場フィルター */}
          <div>
            <select 
              className="form-select"
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
            >
              <option value="all">すべての現場</option>
              <option value="unassigned">現場未指定（一般管理）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name.slice(0, 16)}...
                </option>
              ))}
            </select>
          </div>

          {/* カテゴリフィルター */}
          <div>
            <select 
              className="form-select"
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="all">すべての費目</option>
              <option value="material">材料費（仕入高）</option>
              <option value="parking">現場駐車場代</option>
              <option value="transport">交通費・高速・燃料</option>
              <option value="disposal">産廃処分費</option>
              <option value="tools">消耗品費・工具</option>
            </select>
          </div>

          {/* 弥生連携ステータス */}
          <div>
            <select 
              className="form-select"
              value={selectedYayoiFilter}
              onChange={(e) => setSelectedYayoiFilter(e.target.value)}
            >
              <option value="all">弥生連携: すべて</option>
              <option value="unsynced">未送信のみ ({unsyncedCount}件)</option>
              <option value="synced">送信済のみ</option>
            </select>
          </div>

        </div>

        {/* 絞り込みサマリー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span>該当件数: <strong>{filteredExpenses.length} 件</strong></span>
          <span>合計金額: <strong className="amount-text" style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>¥{filteredTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* 経費テーブル */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>発生日</th>
              <th>現場（工事名）</th>
              <th>店舗・購入先</th>
              <th>勘定科目</th>
              <th>支払金額 (税込)</th>
              <th>支払元</th>
              <th>弥生会計連携</th>
              <th>摘要 / メモ</th>
              <th style={{ textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  該当する経費データがありません
                </td>
              </tr>
            ) : (
              filteredExpenses.map((item) => {
                const project = item.projectId ? projectMap.get(item.projectId) : undefined;

                return (
                  <tr key={item.id}>
                    <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {item.date}
                    </td>

                    <td style={{ maxWidth: 180 }}>
                      {project ? (
                        <div title={project.name}>
                          <span style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.825rem' }}>
                            {project.name.length > 18 ? project.name.slice(0, 18) + '...' : project.name}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: '0.78rem' }}>現場未指定</span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{item.vendor}</div>
                      {item.receiptImageUrl && (
                        <button 
                          onClick={() => setPreviewReceipt(item)}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--primary)', 
                            fontSize: '0.725rem', 
                            cursor: 'pointer', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 2,
                            padding: 0 
                          }}
                        >
                          <ExternalLink size={11} /> レシート写真
                        </button>
                      )}
                    </td>

                    <td>
                      <span style={{ fontSize: '0.825rem' }}>{item.accountTitle}</span>
                    </td>

                    <td className="amount-text" style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                      ¥{item.amount.toLocaleString()}
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', marginLeft: '0.25rem' }}>
                        ({item.taxRate * 100}%)
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.paymentMethod === 'business_card' && 'カード'}
                      {item.paymentMethod === 'owner_advance' && '事業主借'}
                      {item.paymentMethod === 'cash' && '現金'}
                      {item.paymentMethod === 'bank_transfer' && '口座振込'}
                    </td>

                    <td>
                      {item.yayoiSynced ? (
                        <span className="badge badge-yayoi-synced" title={`送信済: ${item.yayoiJournalId || ''}`}>
                          <CheckCircle2 size={12} />
                          連携済
                        </span>
                      ) : (
                        <span className="badge badge-yayoi-unsynced">
                          <Clock size={12} />
                          未送信
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.memo}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => onDeleteExpense(item.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '0.25rem' }}
                        title="削除"
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-light)')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* レシート画像プレビューモーダル */}
      {previewReceipt && (
        <div className="modal-overlay" onClick={() => setPreviewReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {previewReceipt.vendor}（¥{previewReceipt.amount.toLocaleString()}）
              </h3>
              <button onClick={() => setPreviewReceipt(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <img 
                src={previewReceipt.receiptImageUrl} 
                alt="Receipt" 
                style={{ maxWidth: '100%', maxHeight: 450, borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} 
              />
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'left' }}>
                <div><strong>取引日:</strong> {previewReceipt.date}</div>
                <div><strong>摘要:</strong> {previewReceipt.memo}</div>
                <div><strong>弥生仕訳ID:</strong> {previewReceipt.yayoiJournalId || '未同期'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
