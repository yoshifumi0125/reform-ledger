import React, { useState } from 'react';
import { 
  Project, 
  ExpenseItem, 
  LaborRecord, 
  ProjectStatus 
} from '../types';
import { 
  Layers, 
  PlusCircle, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Receipt, 
  Users, 
  TrendingUp, 
  X,
  AlertTriangle
} from 'lucide-react';

interface ProjectsViewProps {
  projects: Project[];
  expenses: ExpenseItem[];
  laborRecords: LaborRecord[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onSelectProjectDetail: (projectId: string) => void;
  selectedProjectId?: string | null;
  onCloseDetail: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  expenses,
  laborRecords,
  onAddProject,
  onUpdateProject: _onUpdateProject,
  onSelectProjectDetail,
  selectedProjectId,
  onCloseDetail,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  // 新規現場フォームステート
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [contractAmount, setContractAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<Project['category']>('interior');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // フィルタリング
  const filteredProjects = projects.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  // 新規現場作成
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !client || contractAmount === '' || Number(contractAmount) <= 0) {
      alert('工事名、元請会社、有効な請負金額は必須です。');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      client,
      contractAmount: Number(contractAmount),
      taxRate: 0.1,
      status,
      startDate,
      endDate: endDate || startDate,
      paymentDueDate: paymentDueDate || undefined,
      notes: notes || undefined,
      category,
    };

    onAddProject(newProject);
    setShowNewModal(false);

    setName('');
    setClient('');
    setContractAmount('');
    setNotes('');
  };

  // 選択中の詳細現場
  const activeDetailProject = projects.find((p) => p.id === selectedProjectId);
  const projectExpenses = expenses.filter((e) => e.projectId === selectedProjectId);
  const projectLabor = laborRecords.filter((l) => l.projectId === selectedProjectId);

  const detailMaterial = projectExpenses.filter((e) => e.category === 'material').reduce((s, e) => s + e.amount, 0);
  const detailLabor = projectLabor.reduce((s, l) => s + l.totalAmount, 0);
  const detailOther = projectExpenses.filter((e) => e.category !== 'material').reduce((s, e) => s + e.amount, 0);
  const detailTotalCost = detailMaterial + detailLabor + detailOther;
  const detailProfit = activeDetailProject ? activeDetailProject.contractAmount - detailTotalCost : 0;
  const detailMargin = activeDetailProject && activeDetailProject.contractAmount > 0 
    ? (detailProfit / activeDetailProject.contractAmount) * 100 
    : 0;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 画面ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <span>現場・工事案件台帳</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            請負金額と現場投入原価（材料・人工・経費）を対比し、現場別粗利を徹底管理
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>新規現場の登録</span>
        </button>
      </div>

      {/* ステータスフィルターピル */}
      <div className="flex space-x-2 overflow-x-auto pb-1 text-xs">
        {[
          { key: 'all', label: 'すべて' },
          { key: 'in_progress', label: '施工中' },
          { key: 'planning', label: '着工前' },
          { key: 'completed', label: '完工' },
          { key: 'invoiced', label: '請求済' },
          { key: 'paid', label: '入金済' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilterStatus(item.key)}
            className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
              filterStatus === item.key
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 現場カードグリッド（receiptスタイルの角丸カード） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((p) => {
          const pExpenses = expenses.filter((e) => e.projectId === p.id);
          const pLabor = laborRecords.filter((l) => l.projectId === p.id);

          const mat = pExpenses.filter((e) => e.category === 'material').reduce((s, e) => s + e.amount, 0);
          const lab = pLabor.reduce((s, l) => s + l.totalAmount, 0);
          const oth = pExpenses.filter((e) => e.category !== 'material').reduce((s, e) => s + e.amount, 0);
          const totalCost = mat + lab + oth;
          const profit = p.contractAmount - totalCost;
          const margin = p.contractAmount > 0 ? (profit / p.contractAmount) * 100 : 0;

          const isGood = margin >= 35;
          const isWarning = margin < 25;

          return (
            <div
              key={p.id}
              onClick={() => onSelectProjectDetail(p.id)}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 p-5 transition hover:shadow-md cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md inline-block mb-1 ${
                      p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      p.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      p.status === 'paid' ? 'bg-teal-100 text-teal-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {p.status === 'in_progress' ? '施工中' : p.status === 'completed' ? '完工' : p.status === 'paid' ? '入金済' : p.status === 'invoiced' ? '請求済' : '着工前'}
                    </span>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition">
                      {p.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <div className={`text-base font-extrabold ${isGood ? 'text-emerald-600' : isWarning ? 'text-rose-600' : 'text-amber-600'}`}>
                      粗利: ¥{profit.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 font-bold">
                      粗利率: {margin.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-4">
                  元請: <span className="font-semibold text-slate-700">{p.client}</span> ｜ 工期: {p.startDate} 〜 {p.endDate}
                </div>

                {/* コスト投入状況 */}
                <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>請負金額: ¥{p.contractAmount.toLocaleString()}</span>
                    <span>投入原価: ¥{totalCost.toLocaleString()}</span>
                  </div>

                  {/* カラープログレスバー */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      title={`材料費: ¥${mat.toLocaleString()}`}
                      style={{ width: `${p.contractAmount > 0 ? (mat / p.contractAmount) * 100 : 0}%` }}
                      className="bg-blue-500"
                    />
                    <div
                      title={`外注人工: ¥${lab.toLocaleString()}`}
                      style={{ width: `${p.contractAmount > 0 ? (lab / p.contractAmount) * 100 : 0}%` }}
                      className="bg-purple-500"
                    />
                    <div
                      title={`その他経費: ¥${oth.toLocaleString()}`}
                      style={{ width: `${p.contractAmount > 0 ? (oth / p.contractAmount) * 100 : 0}%` }}
                      className="bg-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>レシート {pExpenses.length} 件 ｜ 応援職人 {pLabor.length} 人工</span>
                <span className="text-emerald-600 font-bold group-hover:translate-x-0.5 transition">
                  収支明細を見る →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 現場詳細ドロワー／モーダル */}
      {activeDetailProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1">
                  現場収支カルテ
                </span>
                <h3 className="text-lg font-bold text-slate-800">{activeDetailProject.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">元請: {activeDetailProject.client} ｜ 工期: {activeDetailProject.startDate} 〜 {activeDetailProject.endDate}</p>
              </div>
              <button
                onClick={onCloseDetail}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 収支サマリーカード */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
              <div>
                <span className="text-[11px] text-slate-400 block">請負金額</span>
                <strong className="text-base font-extrabold text-slate-800">¥{activeDetailProject.contractAmount.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">投入原価合計</span>
                <strong className="text-base font-extrabold text-rose-600">¥{detailTotalCost.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">粗利益 (粗利率)</span>
                <strong className="text-base font-extrabold text-emerald-600">¥{detailProfit.toLocaleString()} ({detailMargin.toFixed(1)}%)</strong>
              </div>
            </div>

            {/* 原価内訳リスト */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700">現場投入原価の内訳:</h4>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
                <div className="p-3 flex justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span>材料費（仕入）:</span>
                  </span>
                  <strong className="text-slate-800">¥{detailMaterial.toLocaleString()}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    <span>外注・応援職人人工費:</span>
                  </span>
                  <strong className="text-slate-800">¥{detailLabor.toLocaleString()}</strong>
                </div>
                <div className="p-3 flex justify-between">
                  <span className="flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>現場直接経費（パーキング・産廃等）:</span>
                  </span>
                  <strong className="text-slate-800">¥{detailOther.toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onCloseDetail}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規現場登録モーダル */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <form onSubmit={handleCreateProject} className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <span>新規現場・工事案件の登録</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">工事名・案件名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 横浜市港北区 ○○様邸 キッチンリフォーム工事"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">元請会社名（発注元）</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  placeholder="例: 株式会社大和工務店"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">請負金額（税込売上）</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">¥</span>
                  <input
                    type="number"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">着工日</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">完工予定日</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ステータス</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                >
                  <option value="in_progress">施工中</option>
                  <option value="planning">着工前</option>
                  <option value="completed">完工</option>
                  <option value="invoiced">請求済</option>
                  <option value="paid">入金済</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                現場を登録する
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
