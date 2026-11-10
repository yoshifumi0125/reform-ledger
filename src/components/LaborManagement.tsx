import React, { useState } from 'react';
import { LaborRecord, Project } from '../types';
import { Users, PlusCircle, Calendar, DollarSign, CheckCircle2, Trash2, X } from 'lucide-react';

interface LaborManagementProps {
  laborRecords: LaborRecord[];
  projects: Project[];
  onAddLabor: (record: LaborRecord) => void;
  onDeleteLabor: (id: string) => void;
  onUpdateLaborStatus: (id: string, status: LaborRecord['status']) => void;
}

export const LaborManagement: React.FC<LaborManagementProps> = ({
  laborRecords,
  projects,
  onAddLabor,
  onDeleteLabor,
  onUpdateLaborStatus,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [craftsmanName, setCraftsmanName] = useState('');
  const [tradeType, setTradeType] = useState('大工（応援）');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [manDays, setManDays] = useState<number>(1.0);
  const [dailyRate, setDailyRate] = useState<number>(25000);

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  // 源泉徴収税率（100万円以下は10.21%）
  const totalAmount = Math.round(manDays * dailyRate);
  const withholdingTax = Math.floor(totalAmount * 0.1021);
  const netPayment = totalAmount - withholdingTax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!craftsmanName || !selectedProjectId) {
      alert('現場と職人名は必須です。');
      return;
    }

    const newRecord: LaborRecord = {
      id: `lab-${Date.now()}`,
      projectId: selectedProjectId,
      date,
      craftsmanName,
      tradeType,
      manDays,
      dailyRate,
      totalAmount,
      withholdingTax,
      netPayment,
      status: 'worked',
      yayoiSynced: false,
    };

    onAddLabor(newRecord);
    setShowModal(false);

    // リセット
    setCraftsmanName('');
    setManDays(1.0);
  };

  const totalLaborCost = laborRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalManDays = laborRecords.reduce((sum, r) => sum + r.manDays, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* ヘッダー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="var(--primary)" />
            外注・応援職人の人工（にんく）記録
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            応援大工・電気・クロス・解体職人の人工と源泉所得税（10.21%）を自動計算し現場原価に計上します
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} />
          <span>人工を記録する</span>
        </button>
      </div>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>外注人工費 累計</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.35rem' }}>
            ¥{totalLaborCost.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            総稼働人工数: <strong>{totalManDays.toFixed(1)} 人工</strong>
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>源泉徴収税額 累計</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', marginTop: '0.35rem' }}>
            ¥{laborRecords.reduce((s, r) => s + r.withholdingTax, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            税務署へ納付予定（特例納期 7/10・1/20）
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>差引手取 支払額</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '0.35rem' }}>
            ¥{laborRecords.reduce((s, r) => s + r.netPayment, 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            職人さんへの実振込・手渡合計
          </div>
        </div>
      </div>

      {/* 人工一覧テーブル */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>稼働日</th>
              <th>現場（工事名）</th>
              <th>職人名 / 屋号</th>
              <th>職種</th>
              <th>人工数</th>
              <th>日当単価</th>
              <th>支払総額 (税別)</th>
              <th>源泉税(10.21%)</th>
              <th>手取支払額</th>
              <th>状態</th>
              <th style={{ textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {laborRecords.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  人工記録はまだありません。「人工を記録する」ボタンから登録してください。
                </td>
              </tr>
            ) : (
              laborRecords.map((r) => {
                const project = projectMap.get(r.projectId);

                return (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)', maxWidth: 180 }}>
                      {project?.name || '現場未指定'}
                    </td>
                    <td><strong>{r.craftsmanName}</strong></td>
                    <td>{r.tradeType}</td>
                    <td style={{ fontWeight: 700 }}>{r.manDays} 人工</td>
                    <td className="amount-text">¥{r.dailyRate.toLocaleString()}</td>
                    <td className="amount-text" style={{ fontWeight: 700 }}>¥{r.totalAmount.toLocaleString()}</td>
                    <td className="amount-text" style={{ color: 'var(--warning)' }}>-¥{r.withholdingTax.toLocaleString()}</td>
                    <td className="amount-text" style={{ color: 'var(--success)', fontWeight: 700 }}>
                      ¥{r.netPayment.toLocaleString()}
                    </td>
                    <td>
                      <select 
                        value={r.status}
                        onChange={(e) => onUpdateLaborStatus(r.id, e.target.value as any)}
                        style={{ padding: '0.2rem 0.4rem', borderRadius: 4, border: '1px solid var(--border)', fontSize: '0.78rem' }}
                      >
                        <option value="scheduled">予定</option>
                        <option value="worked">稼働済</option>
                        <option value="paid">支払完了</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => onDeleteLabor(r.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}
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

      {/* 新規人工登録モーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <PlusCircle size={20} color="var(--primary)" />
                外注・応援人工の入力
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                
                <div className="form-group">
                  <label className="form-label">施工現場 *</label>
                  <select 
                    className="form-select"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.client})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">職人名 / 屋号 *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={craftsmanName}
                      onChange={(e) => setCraftsmanName(e.target.value)}
                      placeholder="例: 佐藤 健一（佐藤建築）"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">職種</label>
                    <select 
                      className="form-select"
                      value={tradeType}
                      onChange={(e) => setTradeType(e.target.value)}
                    >
                      <option value="大工（応援）">大工（応援・造作）</option>
                      <option value="内装・クロス工">内装・クロス工</option>
                      <option value="第1種電気工事士">電気工</option>
                      <option value="給排水設備工">給排水設備工</option>
                      <option value="解体工">解体工</option>
                      <option value="塗装・防水工">塗装・防水工</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">稼働日</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">人工数</label>
                    <select 
                      className="form-select"
                      value={manDays}
                      onChange={(e) => setManDays(Number(e.target.value))}
                    >
                      <option value={0.5}>半日 (0.5人工)</option>
                      <option value={1.0}>1日 (1.0人工)</option>
                      <option value={1.5}>1.5人工</option>
                      <option value={2.0}>2日 (2.0人工)</option>
                      <option value={3.0}>3日 (3.0人工)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">日当単価 (円)</label>
                    <input 
                      type="number" 
                      className="form-input amount-text" 
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* 自動計算プレビューカード */}
                <div style={{ backgroundColor: '#f8fafc', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span>支払総額 (外注費):</span>
                    <strong className="amount-text">¥{totalAmount.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem', color: 'var(--warning)' }}>
                    <span>源泉所得税額 (10.21%控除):</span>
                    <span className="amount-text">-¥{withholdingTax.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border)', fontWeight: 700, color: 'var(--success)' }}>
                    <span>職人への差引手取支払額:</span>
                    <span className="amount-text">¥{netPayment.toLocaleString()}</span>
                  </div>
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  キャンセル
                </button>
                <button type="submit" className="btn btn-primary">
                  人工を登録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
