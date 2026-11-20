import React, { useState } from 'react';
import { createPortal } from 'react-dom';
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
  Trash2, 
  ExternalLink,
  Plus,
  Image as ImageIcon,
  Calendar,
  X,
  Building2,
  Tag
} from 'lucide-react';
import { YayoiExportService } from '../services/yayoiExport';

interface ExpensesListProps {
  expenses: ExpenseItem[];
  projects: Project[];
  yayoiConfig: YayoiApiConfig;
  currentMonth?: string;
  onUpdateExpense: (expense: ExpenseItem) => void;
  onDeleteExpense: (id: string) => void;
  onOpenScanner: () => void;
  onOpenYayoiSync: () => void;
}

export const ExpensesList: React.FC<ExpensesListProps> = ({
  expenses,
  projects,
  yayoiConfig: _yayoiConfig,
  currentMonth,
  onUpdateExpense: _onUpdateExpense,
  onDeleteExpense,
  onOpenScanner,
  onOpenYayoiSync,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectFilter, setSelectedProjectFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [selectedYayoiFilter, setSelectedYayoiFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<ExpenseItem | null>(null);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // フィルタリング処理（月選択にも連動）
  const filteredExpenses = expenses.filter((item) => {
    // 月フィルタ（指定されている場合）
    if (currentMonth && !item.date.startsWith(currentMonth)) return false;

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

  const unsyncedCount = filteredExpenses.filter((e) => !e.yayoiSynced).length;
  const filteredTotal = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  // CSVダウンロード
  const handleDownloadCsv = () => {
    const csvContent = YayoiExportService.generateYayoiCsv(filteredExpenses, projects);
    const dateStr = new Date().toISOString().split('T')[0];
    YayoiExportService.downloadCsv(csvContent, `弥生会計仕訳データ_${dateStr}.csv`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 画面ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>支出・レシート一覧（弥生仕訳台帳）</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            OCR読取した経費を現場ごとに管理 ＆ 弥生会計オンラインへ直接同期
          </p>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCsv}
            className="inline-flex items-center space-x-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>弥生CSV出力</span>
          </button>
          <button
            onClick={onOpenYayoiSync}
            className="inline-flex items-center space-x-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-bold px-3 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>弥生同期 ({unsyncedCount}件)</span>
          </button>
          <button
            onClick={onOpenScanner}
            className="inline-flex items-center space-x-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>レシート取込</span>
          </button>
        </div>
      </div>

      {/* フィルター＆検索カード */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* キーワード検索 */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="店舗名・品目・メモで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* 現場フィルター */}
          <div>
            <select
              value={selectedProjectFilter}
              onChange={(e) => setSelectedProjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
            >
              <option value="all">すべての現場</option>
              <option value="unassigned">現場未指定（一般管理費）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  【{p.client}】{p.name}
                </option>
              ))}
            </select>
          </div>

          {/* カテゴリフィルター */}
          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
            >
              <option value="all">すべての費目</option>
              <option value="material">材料費（仕入高）</option>
              <option value="parking">現場駐車場代</option>
              <option value="transport">交通費・高速代</option>
              <option value="disposal">産廃処分費</option>
              <option value="tools">消耗品費・工具</option>
            </select>
          </div>

          {/* 弥生連携ステータス */}
          <div>
            <select
              value={selectedYayoiFilter}
              onChange={(e) => setSelectedYayoiFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
            >
              <option value="all">弥生連携: すべて</option>
              <option value="unsynced">未送信のみ ({unsyncedCount}件)</option>
              <option value="synced">送信済のみ</option>
            </select>
          </div>
        </div>

        {/* 絞り込みサマリー */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <span>表示件数: <strong className="text-slate-800">{filteredExpenses.length} 件</strong></span>
          <span>合計金額: <strong className="text-base font-extrabold text-slate-900">¥{filteredTotal.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* レシートカード一覧（receiptスタイルのカードデザイン） */}
      <div className="space-y-3">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600">該当するレシート・支出がありません</p>
            <p className="text-xs text-slate-400 mt-1">「レシート取込」から新しいレシートを撮影または登録してください。</p>
          </div>
        ) : (
          filteredExpenses.map((item) => {
            const project = item.projectId ? projectMap.get(item.projectId) : undefined;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedReceipt(item)}
                className="group bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 p-4 sm:p-5 transition hover:shadow-sm cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* 左側: 店舗名・日付・現場・科目 */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold shrink-0 text-xs">
                      {item.category === 'material' ? '材' : item.category === 'parking' ? '駐' : item.category === 'disposal' ? '廃' : '経'}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition">
                          {item.vendor}
                        </strong>

                        {/* 現場バッジ */}
                        {project ? (
                          <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                            {project.name}
                          </span>
                        ) : (
                          <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                            一般経費
                          </span>
                        )}

                        {/* 弥生連携ステータスバッジ */}
                        {item.yayoiSynced ? (
                          <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>弥生送信済</span>
                          </span>
                        ) : (
                          <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md font-bold">
                            弥生未送信
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.date}</span>
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{item.accountTitle}</span>
                        {item.memo && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">{item.memo}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右側: 金額 ＆ 削除アクション */}
                  <div className="flex items-center space-x-4 ml-auto">
                    <div className="text-right">
                      <div className="text-lg sm:text-xl font-extrabold text-slate-800">
                        ¥{item.amount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        内税: ¥{item.taxAmount.toLocaleString()} ({item.taxRate * 100}%)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteExpense(item.id);
                      }}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="この支出を削除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* レシート詳細モーダル（画像 ＆ 仕訳プレビュー） */}
      {selectedReceipt && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden animate-slide-up">
            {/* ヘッダー（固定） */}
            <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 p-4 sm:p-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>レシート詳細 ＆ 弥生仕訳情報</span>
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* スクロールボディ */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* レシート画像プレビュー（存在する場合） */}
              {selectedReceipt.receiptImageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 max-h-60 flex items-center justify-center bg-slate-900/5">
                  <img
                    src={selectedReceipt.receiptImageUrl}
                    alt="レシート原本"
                    className="max-h-60 object-contain"
                  />
                </div>
              )}

              {/* 詳細情報グリッド */}
              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">購入店舗</span>
                  <strong className="text-slate-800">{selectedReceipt.vendor}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">支払金額 (税込)</span>
                  <strong className="text-base font-extrabold text-emerald-600">¥{selectedReceipt.amount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">取引日</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.date}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">紐付け現場</span>
                  <span className="font-bold text-blue-600">
                    {selectedReceipt.projectId ? projectMap.get(selectedReceipt.projectId)?.name || '現場あり' : '一般管理費（現場指定なし）'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">弥生 借方科目</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.accountTitle}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400">弥生同期ステータス</span>
                  <span>
                    {selectedReceipt.yayoiSynced ? (
                      <span className="text-emerald-600 font-bold">
                        送信完了（ID: {selectedReceipt.yayoiJournalId || '自動採番'}）
                      </span>
                    ) : (
                      <span className="text-orange-600 font-bold">未送信</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* フッター（固定） */}
            <div className="flex-shrink-0 p-3 sm:p-4 border-t border-slate-100 flex justify-end bg-slate-50/60">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
