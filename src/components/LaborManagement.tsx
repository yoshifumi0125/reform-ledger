import React, { useState } from 'react';
import { LaborRecord, Project } from '../types';
import { Users, PlusCircle, Calendar, CheckCircle2, Trash2, X, HardHat } from 'lucide-react';

interface LaborManagementProps {
  laborRecords: LaborRecord[];
  projects: Project[];
  currentMonth?: string;
  onAddLabor: (record: LaborRecord) => void;
  onDeleteLabor: (id: string) => void;
  onUpdateLaborStatus: (id: string, status: LaborRecord['status']) => void;
}

export const LaborManagement: React.FC<LaborManagementProps> = ({
  laborRecords,
  projects,
  currentMonth,
  onAddLabor,
  onDeleteLabor,
  onUpdateLaborStatus,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [craftsmanName, setCraftsmanName] = useState('');
  const [tradeType, setTradeType] = useState('大工（応援）');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
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

    setCraftsmanName('');
    setManDays(1.0);
  };

  // 月別フィルター
  const filteredRecords = laborRecords.filter((r) => {
    if (currentMonth && !r.date.startsWith(currentMonth)) return false;
    return true;
  });

  const totalLaborCost = filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalManDays = filteredRecords.reduce((sum, r) => sum + r.manDays, 0);
  const totalWithholding = filteredRecords.reduce((sum, r) => sum + r.withholdingTax, 0);
  const totalNetPayment = filteredRecords.reduce((sum, r) => sum + r.netPayment, 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 画面ヘッダー */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>外注・応援職人の人工（にんく）記録</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            応援大工・電気・設備職人の人工と源泉所得税（10.21%）を自動計算し現場原価へ集計
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>人工を記録する</span>
        </button>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="text-xs font-bold text-slate-400">外注人工費 累計額</div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1.5">
            ¥{totalLaborCost.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            稼働人工数: <strong className="text-slate-700">{totalManDays.toFixed(1)} 人工</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="text-xs font-bold text-slate-400">源泉徴収所得税 (10.21%)</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1.5">
            ¥{totalWithholding.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            税務署へ翌月10日までに納付
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
          <div className="text-xs font-bold text-slate-400">職人への差引手取支払額</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1.5">
            ¥{totalNetPayment.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            実振込・支払総額
          </div>
        </div>
      </div>

      {/* 人工カード一覧 */}
      <div className="space-y-3">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <HardHat className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-600">この期間の人工記録はありません</p>
            <p className="text-xs text-slate-400 mt-1">「人工を記録する」ボタンから応援職人の稼働を記録してください。</p>
          </div>
        ) : (
          filteredRecords.map((item) => {
            const project = projectMap.get(item.projectId);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 p-4 sm:p-5 transition hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-extrabold shrink-0 text-xs">
                      人
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base font-bold text-slate-800">
                          {item.craftsmanName} 職人
                        </strong>
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                          {item.tradeType}
                        </span>
                        {project && (
                          <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-bold">
                            {project.name}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{item.date}</span>
                        </span>
                        <span>•</span>
                        <span>稼働: <strong>{item.manDays} 人工</strong></span>
                        <span>•</span>
                        <span>日当単価: ¥{item.dailyRate.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* 金額・源泉・支払ステータス */}
                  <div className="flex items-center space-x-4 ml-auto">
                    <div className="text-right">
                      <div className="text-base sm:text-lg font-extrabold text-slate-800">
                        日当総額: ¥{item.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center justify-end space-x-2">
                        <span>源泉控除: -¥{item.withholdingTax.toLocaleString()}</span>
                        <strong className="text-emerald-600">手取: ¥{item.netPayment.toLocaleString()}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onUpdateLaborStatus(item.id, item.status === 'paid' ? 'worked' : 'paid')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                        item.status === 'paid' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {item.status === 'paid' ? '支払済' : '未払（支払へ）'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteLabor(item.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="この記録を削除"
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

      {/* 新規人工登録モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <span>応援職人の人工（日当）記録</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">稼働現場</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      【{p.client}】{p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">職人氏名 / 屋号</label>
                <input
                  type="text"
                  value={craftsmanName}
                  onChange={(e) => setCraftsmanName(e.target.value)}
                  placeholder="例: 佐藤 健（佐藤建装）"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">工種</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="大工（応援）">大工（応援）</option>
                    <option value="クロス・内装">クロス・内装</option>
                    <option value="電気設備">電気設備</option>
                    <option value="給排水設備">給排水設備</option>
                    <option value="解体・荷揚げ">解体・荷揚げ</option>
                    <option value="塗装・防水">塗装・防水</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">稼働日</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">人工数</label>
                  <select
                    value={manDays}
                    onChange={(e) => setManDays(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-semibold"
                  >
                    <option value={0.5}>0.5 人工（半日）</option>
                    <option value={1.0}>1.0 人工（終日）</option>
                    <option value={1.5}>1.5 人工（残業込）</option>
                    <option value={2.0}>2.0 人工（2名分）</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">日当単価 (円)</label>
                  <input
                    type="number"
                    step={1000}
                    value={dailyRate}
                    onChange={(e) => setDailyRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    required
                  />
                </div>
              </div>

              {/* 源泉税＆手取プレビュー */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">日当総支給額:</span>
                  <strong className="text-slate-800 text-sm">¥{totalAmount.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-amber-700">
                  <span>源泉徴収税 (10.21%控除):</span>
                  <span>-¥{withholdingTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 text-emerald-700 font-bold text-sm">
                  <span>職人への差引手取振込額:</span>
                  <span>¥{netPayment.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xs"
              >
                人工を保存する
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
