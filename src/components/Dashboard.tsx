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
  Wallet, 
  Layers, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Receipt, 
  Sparkles,
  RefreshCw,
  PlusCircle,
  Truck,
  HardHat,
  ShoppingBag
} from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  expenses: ExpenseItem[];
  laborRecords: LaborRecord[];
  onOpenScanner: () => void;
  onOpenYayoiSync: () => void;
  onSelectProject: (projectId: string) => void;
  onNewProject: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  projects,
  expenses,
  laborRecords,
  onOpenScanner,
  onOpenYayoiSync,
  onSelectProject,
  onNewProject,
}) => {
  // 今月（進行中・今月関連）の集計計算
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

    expenses.forEach((e) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 弥生会計 未同期アラートバナー */}
      {unsyncedExpenses.length > 0 && (
        <div style={{
          backgroundColor: 'var(--yayoi-bg)',
          border: '1px solid var(--yayoi-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              backgroundColor: '#fed7aa', 
              color: 'var(--yayoi)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <RefreshCw size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '0.95rem' }}>
                弥生会計への未送信経費が {unsyncedExpenses.length} 件（計 ¥{unsyncedAmount.toLocaleString()}）あります
              </div>
              <div style={{ fontSize: '0.825rem', color: '#c2410c' }}>
                レシート読取済の経費をスマート取引取込APIへワンクリックで自動送信できます
              </div>
            </div>
          </div>
          <button className="btn btn-yayoi" onClick={onOpenYayoiSync}>
            <RefreshCw size={16} />
            <span>弥生会計へ一括送信</span>
          </button>
        </div>
      )}

      {/* トップ KPI メトリクス */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* 売上（請負金額合計） */}
        <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>請負売上合計 (税込)</span>
            <Building2 size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            ¥{summary.totalSales.toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>
              入金済: ¥{summary.paidSales.toLocaleString()}
            </span>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>
              請求中/未回収: ¥{summary.pendingSales.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 現場直接原価 */}
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>現場原価合計</span>
            <ShoppingBag size={18} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: '#b91c1c' }}>
            ¥{(summary.totalMaterialCost + summary.totalLaborCost + summary.totalDirectExpenses).toLocaleString()}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>材料: ¥{summary.totalMaterialCost.toLocaleString()}</span>
            <span>人工: ¥{summary.totalLaborCost.toLocaleString()}</span>
            <span>経費: ¥{summary.totalDirectExpenses.toLocaleString()}</span>
          </div>
        </div>

        {/* 粗利益 ＆ 粗利率 */}
        <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', color: 'var(--text-muted)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>粗利益（現場純益）</span>
            <span style={{ 
              fontSize: '0.8rem', 
              fontWeight: 700, 
              color: 'var(--success)', 
              backgroundColor: 'var(--success-bg)',
              padding: '0.15rem 0.5rem',
              borderRadius: 6 
            }}>
              粗利率 {summary.grossProfitMargin.toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--success)' }}>
            ¥{summary.grossProfit.toLocaleString()}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            一般管理費控除後 純利: <strong style={{ color: 'var(--text-main)' }}>¥{summary.netProfit.toLocaleString()}</strong>
          </div>
        </div>

        {/* クイックアクションカード */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.6rem', backgroundColor: '#f8fafc' }}>
          <button className="btn btn-primary" onClick={onOpenScanner} style={{ width: '100%' }}>
            <Receipt size={16} />
            <span>レシート撮影・読取</span>
          </button>
          <button className="btn btn-secondary" onClick={onNewProject} style={{ width: '100%' }}>
            <PlusCircle size={16} />
            <span>新規現場（案件）登録</span>
          </button>
        </div>

      </div>

      {/* 現場（案件）別 粗利・収支リスト */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={18} color="var(--primary)" />
              現場・案件別のリアルタイム収支と粗利率
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              下請けリフォームでは、現場ごとに資材・外注人工・駐車場等の実原価を把握することが黒字化の鉄則です
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onNewProject}>
            <PlusCircle size={14} />
            現場を追加
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {projectStats.map(({ project, material, labor, parking, disposal, otherExpenses, totalCost, profit, margin, expenseCount }) => {
            const isGoodMargin = margin >= 35;
            const isWarningMargin = margin < 25;

            return (
              <div 
                key={project.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => onSelectProject(project.id)}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge badge-${project.status}`}>
                        {project.status === 'in_progress' && '施工中'}
                        {project.status === 'planning' && '着工前'}
                        {project.status === 'completed' && '完工'}
                        {project.status === 'invoiced' && '請求済'}
                        {project.status === 'paid' && '入金済'}
                      </span>
                      <strong style={{ fontSize: '0.975rem', color: 'var(--text-main)' }}>
                        {project.name}
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      元請: <strong>{project.client}</strong> ｜ 工期: {project.startDate} 〜 {project.endDate}
                    </div>
                  </div>

                  {/* 粗利率バッジ */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 700, 
                      color: isGoodMargin ? 'var(--success)' : isWarningMargin ? 'var(--danger)' : 'var(--warning)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      justifyContent: 'flex-end'
                    }}>
                      粗利: ¥{profit.toLocaleString()} ({margin.toFixed(1)}%)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      請負額: ¥{project.contractAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* コストバー & 内訳 */}
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    <span>原価投入状況: 計 ¥{totalCost.toLocaleString()} (レシート{expenseCount}件)</span>
                    <span>予算比消化率: {project.contractAmount > 0 ? ((totalCost / project.contractAmount) * 100).toFixed(0) : 0}%</span>
                  </div>

                  {/* プログレスバー */}
                  <div style={{ height: 8, width: '100%', backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
                    <div 
                      title={`材料費: ¥${material.toLocaleString()}`}
                      style={{ 
                        width: `${project.contractAmount > 0 ? (material / project.contractAmount) * 100 : 0}%`, 
                        backgroundColor: '#3b82f6' 
                      }} 
                    />
                    <div 
                      title={`外注人工: ¥${labor.toLocaleString()}`}
                      style={{ 
                        width: `${project.contractAmount > 0 ? (labor / project.contractAmount) * 100 : 0}%`, 
                        backgroundColor: '#8b5cf6' 
                      }} 
                    />
                    <div 
                      title={`経費(駐車/産廃等): ¥${(parking + disposal + otherExpenses).toLocaleString()}`}
                      style={{ 
                        width: `${project.contractAmount > 0 ? ((parking + disposal + otherExpenses) / project.contractAmount) * 100 : 0}%`, 
                        backgroundColor: '#f59e0b' 
                      }} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.75rem' }}>
                    <span style={{ color: '#2563eb' }}>● 材料費: ¥{material.toLocaleString()}</span>
                    <span style={{ color: '#7c3aed' }}>● 外注人工: ¥{labor.toLocaleString()}</span>
                    <span style={{ color: '#d97706' }}>● 現場経費: ¥{(parking + disposal + otherExpenses).toLocaleString()}</span>
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
