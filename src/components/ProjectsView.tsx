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
  DollarSign, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  FileText,
  AlertTriangle,
  Receipt,
  Users,
  TrendingUp,
  X
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
  onUpdateProject,
  onSelectProjectDetail,
  selectedProjectId,
  onCloseDetail,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  // 新規現場フォームステート
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [category, setCategory] = useState<Project['category']>('interior');
  const [status, setStatus] = useState<ProjectStatus>('in_progress');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
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
    if (!name || !client || !contractAmount) {
      alert('工事名、元請会社、請負金額は必須です。');
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name,
      client,
      contractAmount,
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

    // リセット
    setName('');
    setClient('');
    setContractAmount(0);
    setNotes('');
  };

  // 選択中の詳細現場
  const activeDetailProject = projects.find((p) => p.id === selectedProjectId);
  const projectExpenses = expenses.filter((e) => e.projectId === selectedProjectId);
  const projectLabor = laborRecords.filter((l) => l.projectId === selectedProjectId);

  const detailMaterial = projectExpenses.filter((e) => e.category === 'material').reduce((s, e) => s + e.amount, 0);
  const detailParking = projectExpenses.filter((e) => e.category === 'parking').reduce((s, e) => s + e.amount, 0);
  const detailDisposal = projectExpenses.filter((e) => e.category === 'disposal').reduce((s, e) => s + e.amount, 0);
  const detailOther = projectExpenses.filter((e) => e.category !== 'material' && e.category !== 'parking' && e.category !== 'disposal').reduce((s, e) => s + e.amount, 0);
  const detailLabor = projectLabor.reduce((s, l) => s + l.totalAmount, 0);
  const detailTotalCost = detailMaterial + detailParking + detailDisposal + detailOther + detailLabor;
  const detailProfit = (activeDetailProject?.contractAmount || 0) - detailTotalCost;
  const detailMargin = activeDetailProject && activeDetailProject.contractAmount > 0 
    ? (detailProfit / activeDetailProject.contractAmount) * 100 
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 上部ヘッダー & フィルター */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={22} color="var(--primary)" />
            現場・案件一覧（下請け工事管理）
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            元請けごとの請負額、材料費・外注人工・現場経費を紐付けて現場別粗利を管理します
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>
          <PlusCircle size={16} />
          <span>新規現場（工事）を追加</span>
        </button>
      </div>

      {/* ステータスフィルターバー */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { id: 'all', label: 'すべて表示' },
          { id: 'in_progress', label: '施工中' },
          { id: 'planning', label: '着工前' },
          { id: 'completed', label: '完工' },
          { id: 'invoiced', label: '請求済（入金待ち）' },
          { id: 'paid', label: '入金完了' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              border: filterStatus === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: filterStatus === tab.id ? 'var(--primary-light)' : 'var(--surface)',
              color: filterStatus === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: filterStatus === tab.id ? 700 : 500,
              fontSize: '0.825rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 現場グリッド */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
        {filteredProjects.map((proj) => {
          const pExpenses = expenses.filter((e) => e.projectId === proj.id);
          const pLabor = laborRecords.filter((l) => l.projectId === proj.id);

          const cost = pExpenses.reduce((s, e) => s + e.amount, 0) + pLabor.reduce((s, l) => s + l.totalAmount, 0);
          const profit = proj.contractAmount - cost;
          const margin = proj.contractAmount > 0 ? (profit / proj.contractAmount) * 100 : 0;

          return (
            <div 
              key={proj.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                borderColor: selectedProjectId === proj.id ? 'var(--primary)' : 'var(--border)',
                boxShadow: selectedProjectId === proj.id ? '0 0 0 2px var(--primary-light)' : 'var(--shadow-sm)'
              }}
              onClick={() => onSelectProjectDetail(proj.id)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className={`badge badge-${proj.status}`}>
                    {proj.status === 'in_progress' && '施工中'}
                    {proj.status === 'planning' && '着工前'}
                    {proj.status === 'completed' && '完工'}
                    {proj.status === 'invoiced' && '請求済'}
                    {proj.status === 'paid' && '入金済'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {proj.startDate} 〜 {proj.endDate}
                  </span>
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem', lineHeight: 1.35 }}>
                  {proj.name}
                </h3>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  元請: <strong>{proj.client}</strong>
                </div>

                {/* 収支サマリー */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>請負金額 (売上):</span>
                    <strong className="amount-text">¥{proj.contractAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>投入原価 (資材・人工):</span>
                    <span className="amount-text" style={{ color: '#b91c1c' }}>-¥{cost.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700 }}>現在粗利益:</span>
                    <strong className="amount-text" style={{ color: margin >= 30 ? 'var(--success)' : 'var(--warning)' }}>
                      ¥{profit.toLocaleString()} ({margin.toFixed(1)}%)
                    </strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>レシート {pExpenses.length}枚 ｜ 人工 {pLabor.length}件</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  詳細収支を見る <ChevronRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 現場詳細モーダル / パネル */}
      {activeDetailProject && (
        <div className="modal-overlay" onClick={onCloseDetail}>
          <div className="modal-content" style={{ maxWidth: 840 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge badge-${activeDetailProject.status}`}>
                    {activeDetailProject.status}
                  </span>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                    {activeDetailProject.name}
                  </h3>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  元請: <strong>{activeDetailProject.client}</strong> ｜ 工期: {activeDetailProject.startDate} 〜 {activeDetailProject.endDate} ｜ 入金予定: {activeDetailProject.paymentDueDate || '未定'}
                </div>
              </div>
              <button 
                onClick={onCloseDetail}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* 現場別 財務メトリクス */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-light)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>請負金額 (売上)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    ¥{activeDetailProject.contractAmount.toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#991b1b', fontWeight: 600 }}>投入原価 合計</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', marginTop: '0.2rem' }}>
                    ¥{detailTotalCost.toLocaleString()}
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>粗利益 (粗利率)</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.2rem' }}>
                    ¥{detailProfit.toLocaleString()} ({detailMargin.toFixed(1)}%)
                  </div>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: '#f1f5f9', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>請求ステータス</div>
                  <select 
                    className="form-select"
                    value={activeDetailProject.status}
                    onChange={(e) => {
                      onUpdateProject({ ...activeDetailProject, status: e.target.value as ProjectStatus });
                    }}
                    style={{ marginTop: '0.25rem', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                  >
                    <option value="planning">着工前</option>
                    <option value="in_progress">施工中</option>
                    <option value="completed">完工</option>
                    <option value="invoiced">請求済</option>
                    <option value="paid">入金完了</option>
                  </select>
                </div>
              </div>

              {/* 原価内訳 */}
              <div className="card" style={{ padding: '0.85rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  現場原価の内訳
                </h4>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.825rem' }}>
                  <span>材料費・資材: <strong className="amount-text">¥{detailMaterial.toLocaleString()}</strong></span>
                  <span>外注応援人工: <strong className="amount-text">¥{detailLabor.toLocaleString()}</strong></span>
                  <span>コインパーキング: <strong className="amount-text">¥{detailParking.toLocaleString()}</strong></span>
                  <span>産廃処分費: <strong className="amount-text">¥{detailDisposal.toLocaleString()}</strong></span>
                  <span>その他現場経費: <strong className="amount-text">¥{detailOther.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* 紐付けレシート・経費一覧 */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Receipt size={16} />
                  この現場に紐付いているレシート・経費（{projectExpenses.length}件）
                </h4>

                {projectExpenses.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    まだこの現場のレシート経費は登録されていません。「レシート取込」からスキャンして紐付けてください。
                  </p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>日付</th>
                          <th>店舗・支払先</th>
                          <th>科目</th>
                          <th>金額</th>
                          <th>弥生連携</th>
                          <th>摘要</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectExpenses.map((exp) => (
                          <tr key={exp.id}>
                            <td style={{ whiteSpace: 'nowrap' }}>{exp.date}</td>
                            <td>{exp.vendor}</td>
                            <td>{exp.accountTitle}</td>
                            <td className="amount-text">¥{exp.amount.toLocaleString()}</td>
                            <td>
                              <span className={exp.yayoiSynced ? 'badge badge-yayoi-synced' : 'badge badge-yayoi-unsynced'}>
                                {exp.yayoiSynced ? '弥生送信済' : '未送信'}
                              </span>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {exp.memo}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 外注人工一覧 */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={16} />
                  この現場の外注・応援職人人工（{projectLabor.length}件）
                </h4>

                {projectLabor.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '1rem', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)' }}>
                    外注人工の記録はありません。「外注・応援人工」メニューから記録できます。
                  </p>
                ) : (
                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>稼働日</th>
                          <th>職人名 / 屋号</th>
                          <th>職種</th>
                          <th>人工数</th>
                          <th>支払合計 (税抜源泉後)</th>
                          <th>ステータス</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectLabor.map((lab) => (
                          <tr key={lab.id}>
                            <td>{lab.date}</td>
                            <td><strong>{lab.craftsmanName}</strong></td>
                            <td>{lab.tradeType}</td>
                            <td>{lab.manDays} 人工</td>
                            <td className="amount-text">¥{lab.totalAmount.toLocaleString()}</td>
                            <td>
                              <span className={`badge ${lab.status === 'paid' ? 'badge-paid' : 'badge-in_progress'}`}>
                                {lab.status === 'paid' ? '支払完了' : '稼働済'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onCloseDetail}>
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新規現場登録モーダル */}
      {showNewModal && (
        <div className="modal-overlay" onClick={() => setShowNewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PlusCircle size={20} color="var(--primary)" />
                新規現場・案件の登録
              </h3>
              <button 
                onClick={() => setShowNewModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">工事名・現場名 *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例: 世田谷区成城 T様邸 キッチン・洗面リフォーム工事"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">元請会社名 *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={client} 
                      onChange={(e) => setClient(e.target.value)}
                      placeholder="例: 株式会社大和工務店"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">請負金額 (税込) *</label>
                    <input 
                      type="number" 
                      className="form-input amount-text" 
                      value={contractAmount || ''} 
                      onChange={(e) => setContractAmount(Number(e.target.value))}
                      placeholder="例: 850000"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">工種カテゴリ</label>
                    <select 
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                    >
                      <option value="interior">内装・クロス・CF</option>
                      <option value="plumbing">水回り・設備・給排水</option>
                      <option value="carpentry">大工造作・木工事</option>
                      <option value="exterior">外壁・塗装・サイディング</option>
                      <option value="full_renovation">全面フルリノベーション</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">ステータス</label>
                    <select 
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="planning">着工前</option>
                      <option value="in_progress">施工中</option>
                      <option value="completed">完工</option>
                      <option value="invoiced">請求済</option>
                      <option value="paid">入金済</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">着工日</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">完工予定日</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">入金予定日（支払期日）</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={paymentDueDate} 
                      onChange={(e) => setPaymentDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">施工メモ・特記事項</label>
                  <textarea 
                    className="form-textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="元請支給品、施工注意点、駐車場所など"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewModal(false)}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  現場を登録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
