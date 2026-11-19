import React from 'react';
import { 
  Project, 
  ExpenseItem, 
  LaborRecord, 
  MonthlySummary 
} from '../types';
import { 
  Building2,
  TrendingUp, 
  Layers, 
  CheckCircle, 
  Receipt, 
  Sparkles,
  RefreshCw,
  PlusCircle,
  ShoppingBag,
  Users,
  ArrowRight,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { QuickScanCard } from './QuickScanCard';

interface DashboardProps {
  projects: Project[];
  expenses: ExpenseItem[];
  laborRecords: LaborRecord[];
  currentMonth: string;
  onOpenScanner: () => void;
  onOpenYayoiSync: () => void;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
  onAddExpense: (expense: ExpenseItem) => void;
  onOpenSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  expenses,
  laborRecords,
  currentMonth,
  onOpenScanner,
  onOpenYayoiSync,
  onSelectProject,
  onNewProject,
  onAddExpense,
  onOpenSettings,
}) => {
  const [year, month] = currentMonth.split('-').map(Number);
  const formattedMonth = `${year}年${month}月`;

  // 今月の集計計算
  const summary: MonthlySummary = React.useMemo(() => {
    let totalSales = 0;
    let paidSales = 0;
    let pendingSales = 0;

    projects.forEach((p) => {
      totalSales += p.contractAmount;
      if (p.status === 'paid') {
        paidSales += p.contractAmount;
      } else if (p.status === 'invoiced' || p.status === 'completed') {
        pendingSales += p.contractAmount;
      }
    });

    let totalMaterialCost = 0;
    let totalDirectExpenses = 0;
    let totalGeneralExpenses = 0;

    // 当月の支出を集計（未指定または当月に合致するもの）
    const monthlyExpenses = expenses.filter((e) => !currentMonth || e.date.startsWith(currentMonth));

    monthlyExpenses.forEach((e) => {
      if (e.category === 'material') {
        totalMaterialCost += e.amount;
      } else if (e.category === 'subcontract' || e.category === 'disposal') {
        totalDirectExpenses += e.amount;
      } else if (e.projectId) {
        totalDirectExpenses += e.amount;
      } else {
        totalGeneralExpenses += e.amount;
      }
    });

    let totalLaborCost = 0;
    laborRecords.forEach((l) => {
      totalLaborCost += l.totalAmount;
    });

    const totalDirectCost = totalMaterialCost + totalLaborCost + totalDirectExpenses;
    const grossProfit = totalSales - totalDirectCost;
    const grossProfitMargin = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const netProfit = grossProfit - totalGeneralExpenses;

    return {
      totalSales,
      paidSales,
      pendingSales,
      totalMaterialCost,
      totalLaborCost,
      totalDirectExpenses,
      totalGeneralExpenses,
      grossProfit,
      grossProfitMargin,
      netProfit,
    };
  }, [projects, expenses, laborRecords]);

  // 未送信の弥生会計データ
  const unsyncedExpenses = expenses.filter((e) => !e.yayoiSynced);
  const unsyncedAmount = unsyncedExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 現場ごとの原価・粗利計算マップ
  const projectStats = React.useMemo(() => {
    return projects.map((p) => {
      const pExpenses = expenses.filter((e) => e.projectId === p.id);
      const pLabor = laborRecords.filter((l) => l.projectId === p.id);

      const material = pExpenses.filter((e) => e.category === 'material').reduce((s, e) => s + e.amount, 0);
      const parking = pExpenses.filter((e) => e.category === 'parking').reduce((s, e) => s + e.amount, 0);
      const disposal = pExpenses.filter((e) => e.category === 'disposal').reduce((s, e) => s + e.amount, 0);
      const otherExpenses = pExpenses.filter((e) => e.category !== 'material' && e.category !== 'parking' && e.category !== 'disposal').reduce((s, e) => s + e.amount, 0);
      const labor = pLabor.reduce((s, l) => s + l.totalAmount, 0);

      const totalCost = material + parking + disposal + otherExpenses + labor;
      const profit = p.contractAmount - totalCost;
      const margin = p.contractAmount > 0 ? (profit / p.contractAmount) * 100 : 0;

      return {
        project: p,
        material,
        labor,
        parking,
        disposal,
        otherExpenses,
        totalCost,
        profit,
        margin,
        expenseCount: pExpenses.length,
      };
    });
  }, [projects, expenses, laborRecords]);

  // 最近のレシート・支出（最大5件）
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* 1. レシート・領収書 クイックスキャンカード */}
      <QuickScanCard 
        projects={projects}
        onSuccess={onAddExpense}
        onOpenSettings={onOpenSettings}
      />

      {/* 2. 弥生会計 未同期アラートバナー */}
      {unsyncedExpenses.length > 0 && (
        <div className="bg-orange-50 border border-orange-200/80 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-orange-950">
                弥生会計への未送信経費が {unsyncedExpenses.length} 件（計 ¥{unsyncedAmount.toLocaleString()}）あります
              </div>
              <p className="text-xs text-orange-800 mt-0.5 font-medium">
                スマート取引取込APIへワンクリックで自動仕訳送信できます
              </p>
            </div>
          </div>
          <button
            onClick={onOpenYayoiSync}
            className="inline-flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow-sm transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>弥生会計へ一括送信</span>
          </button>
        </div>
      )}

      {/* 3. ヒーローグラデーションカード（深みのあるエメラルド×ティールグラデーション） */}
      <div 
        style={{ background: 'linear-gradient(135deg, #047857 0%, #0d9488 50%, #0f766e 100%)' }}
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-bold tracking-wider text-emerald-100 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <span>{formattedMonth} 現場収支・粗利益概況</span>
            </span>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-bold text-white border border-white/20">
              施工案件 {projects.filter(p => p.status === 'in_progress').length} 件進行中
            </span>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-4 mt-3">
            <div>
              <span className="text-xs font-semibold text-emerald-100 block">現場粗利益（純益）</span>
              <div className="flex items-baseline space-x-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-200">¥</span>
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                  {summary.grossProfit.toLocaleString()}
                </span>
              </div>
            </div>

            {/* 粗利率バッジ */}
            <div className="bg-black/15 backdrop-blur-md border border-white/25 px-5 py-3 rounded-2xl text-right">
              <span className="text-xs font-bold text-emerald-200 block">総合粗利率</span>
              <span className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {summary.grossProfitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 請負売上 vs 投入原価のサマリーバー */}
          <div className="mt-6 pt-5 border-t border-emerald-400/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-emerald-100 font-semibold block">請負売上合計</span>
              <strong className="text-base sm:text-lg font-black text-white">
                ¥{summary.totalSales.toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="text-emerald-100 font-semibold block">現場投入原価</span>
              <strong className="text-base sm:text-lg font-black text-rose-200">
                ¥{(summary.totalMaterialCost + summary.totalLaborCost + summary.totalDirectExpenses).toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="text-emerald-100 font-semibold block">入金済売上</span>
              <strong className="text-base sm:text-lg font-black text-emerald-100">
                ¥{summary.paidSales.toLocaleString()}
              </strong>
            </div>
            <div>
              <span className="text-emerald-100 font-semibold block">請求中・未回収</span>
              <strong className="text-base sm:text-lg font-black text-amber-200">
                ¥{summary.pendingSales.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. サブKPIカード（4枚グリッド） */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 請負売上 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-700">請負金額（税込）</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ¥{summary.totalSales.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-between font-semibold">
            <span className="text-emerald-700">入金: ¥{summary.paidSales.toLocaleString()}</span>
            <span className="text-amber-700">未回収: ¥{summary.pendingSales.toLocaleString()}</span>
          </div>
        </div>

        {/* 現場材料費 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-700">現場材料費（仕入）</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            ¥{summary.totalMaterialCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            コーナンPRO・カインズ等での資材購入
          </div>
        </div>

        {/* 外注・応援職人人工費 */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-700">外注・応援人工費</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2">
            ¥{summary.totalLaborCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            応援職人 {laborRecords.length} 人工記録
          </div>
        </div>

        {/* 現場直接経費（駐車代・産廃） */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold text-slate-700">現場直接経費</span>
            <Receipt className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ¥{summary.totalDirectExpenses.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-medium">
            現場パーキング・産廃処理費等
          </div>
        </div>
      </div>

      {/* 5. 現場・案件別 リアルタイム収支リスト */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              <span>現場・案件別リアルタイム粗利一覧</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              案件ごとに材料費・応援人工・現場経費を集計し、黒字率を可視化
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-1.5 rounded-xl text-xs sm:text-sm transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新規現場追加</span>
          </button>
        </div>

        <div className="space-y-3">
          {projectStats.map(({ project, material, labor, parking, disposal, otherExpenses, totalCost, profit, margin, expenseCount }) => {
            const isGood = margin >= 35;
            const isWarning = margin < 25;

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="group border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 sm:p-5 transition hover:shadow-md cursor-pointer bg-white"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        project.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        project.status === 'planning' ? 'bg-amber-100 text-amber-800' :
                        project.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {project.status === 'in_progress' && '施工中'}
                        {project.status === 'planning' && '着工前'}
                        {project.status === 'completed' && '完工'}
                        {project.status === 'invoiced' && '請求済'}
                        {project.status === 'paid' && '入金済'}
                      </span>
                      <strong className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-emerald-700 transition">
                        {project.name}
                      </strong>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 font-medium">
                      元請: <span className="font-bold text-slate-700">{project.client}</span> ｜ 工期: {project.startDate} 〜 {project.endDate}
                    </div>
                  </div>

                  {/* 粗利率バッジ */}
                  <div className="text-right">
                    <div className={`text-sm sm:text-base font-black ${
                      isGood ? 'text-emerald-600' : isWarning ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      粗利: ¥{profit.toLocaleString()} ({margin.toFixed(1)}%)
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      請負金額: ¥{project.contractAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* プログレスバー & 内訳 */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                    <span>原価投入合計: ¥{totalCost.toLocaleString()} (支出{expenseCount}件)</span>
                    <span className="font-bold text-slate-800">予算消化率: {project.contractAmount > 0 ? ((totalCost / project.contractAmount) * 100).toFixed(0) : 0}%</span>
                  </div>

                  {/* カラーバー */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      title={`材料費: ¥${material.toLocaleString()}`}
                      style={{ width: `${project.contractAmount > 0 ? (material / project.contractAmount) * 100 : 0}%` }}
                      className="bg-blue-500"
                    />
                    <div
                      title={`外注人工: ¥${labor.toLocaleString()}`}
                      style={{ width: `${project.contractAmount > 0 ? (labor / project.contractAmount) * 100 : 0}%` }}
                      className="bg-purple-500"
                    />
                    <div
                      title={`現場経費: ¥${(parking + disposal + otherExpenses).toLocaleString()}`}
                      style={{ width: `${project.contractAmount > 0 ? ((parking + disposal + otherExpenses) / project.contractAmount) * 100 : 0}%` }}
                      className="bg-amber-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-semibold text-slate-600">
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      <span>材料費: ¥{material.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      <span>人工費: ¥{labor.toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      <span>経費: ¥{(parking + disposal + otherExpenses).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. 最近のレシート・支出一覧 */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>直近のレシート・支出履歴</span>
          </h3>
          <button
            onClick={onOpenScanner}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition cursor-pointer"
          >
            すべて見る →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentExpenses.map((exp) => {
            const project = projects.find((p) => p.id === exp.projectId);
            return (
              <div key={exp.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black shrink-0 text-xs">
                    {exp.category === 'material' ? '材' : exp.category === 'parking' ? '駐' : '経'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <strong className="text-sm font-bold text-slate-900">{exp.vendor}</strong>
                      {project ? (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                          {project.name}
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-md">
                          一般経費
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {exp.date} ｜ {exp.accountTitle}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm sm:text-base font-black text-slate-900">
                    ¥{exp.amount.toLocaleString()}
                  </div>
                  <div>
                    {exp.yayoiSynced ? (
                      <span className="text-[10px] text-emerald-700 font-bold inline-flex items-center space-x-0.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>弥生送信済</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-orange-600 font-bold">
                        未送信
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
