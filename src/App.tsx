import React, { useState, useEffect } from 'react';
import { 
  Project, 
  ExpenseItem, 
  LaborRecord, 
  YayoiApiConfig 
} from './types';
import { StorageService } from './services/storage';
import { SupabaseDbService } from './services/supabaseService';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProjectsView } from './components/ProjectsView';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ExpensesList } from './components/ExpensesList';
import { LaborManagement } from './components/LaborManagement';
import { YayoiSyncModal } from './components/YayoiSyncModal';
import { SettingsModal } from './components/SettingsModal';
import { FloatingScanButton } from './components/FloatingScanButton';
import { RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => StorageService.getExpenses());
  const [laborRecords, setLaborRecords] = useState<LaborRecord[]>(() => StorageService.getLaborRecords());
  const [yayoiConfig, setYayoiConfig] = useState<YayoiApiConfig>(() => StorageService.getYayoiConfig());
  const [loadingDb, setLoadingDb] = useState(true);

  // 初回マウント時: Supabase DB から最新の実データを取得
  useEffect(() => {
    let isMounted = true;
    async function loadFromSupabase() {
      try {
        const [dbProjects, dbExpenses, dbLabor] = await Promise.all([
          SupabaseDbService.getProjects(),
          SupabaseDbService.getExpenses(),
          SupabaseDbService.getLaborRecords(),
        ]);

        if (isMounted) {
          setProjects(dbProjects);
          StorageService.saveProjects(dbProjects);

          setExpenses(dbExpenses);
          StorageService.saveExpenses(dbExpenses);

          setLaborRecords(dbLabor);
          StorageService.saveLaborRecords(dbLabor);
        }
      } catch (err) {
        console.error('Supabase初回ロード失敗:', err);
      } finally {
        if (isMounted) setLoadingDb(false);
      }
    }
    loadFromSupabase();
    return () => { isMounted = false; };
  }, []);

  // モーダルステート
  const [showYayoiModal, setShowYayoiModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 永続化保存 (ローカルキャッシュ)
  useEffect(() => {
    StorageService.saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    StorageService.saveExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    StorageService.saveLaborRecords(laborRecords);
  }, [laborRecords]);

  useEffect(() => {
    StorageService.saveYayoiConfig(yayoiConfig);
  }, [yayoiConfig]);

  // ハンドラー (Supabaseと同期)
  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    SupabaseDbService.saveProject(newProject);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    SupabaseDbService.saveProject(updated);
  };

  const handleAddExpense = (newExpense: ExpenseItem) => {
    setExpenses((prev) => [newExpense, ...prev]);
    SupabaseDbService.saveExpense(newExpense);
  };

  const handleUpdateExpense = (updated: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    SupabaseDbService.saveExpense(updated);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('この経費データを削除してもよろしいですか？')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      SupabaseDbService.deleteExpense(id);
    }
  };

  const handleAddLabor = (newRecord: LaborRecord) => {
    setLaborRecords((prev) => [newRecord, ...prev]);
    SupabaseDbService.saveLaborRecord(newRecord);
  };

  const handleDeleteLabor = (id: string) => {
    if (window.confirm('この人工記録を削除しますか？')) {
      setLaborRecords((prev) => prev.filter((r) => r.id !== id));
      SupabaseDbService.deleteLaborRecord(id);
    }
  };

  const handleUpdateLaborStatus = (id: string, status: LaborRecord['status']) => {
    setLaborRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, status };
          SupabaseDbService.saveLaborRecord(updated);
          return updated;
        }
        return r;
      })
    );
  };

  // 弥生会計一括同期完了時
  const handleBulkSyncComplete = (syncedExpenseIds: string[], journalMapping: Record<string, string>) => {
    const now = new Date().toISOString();
    setExpenses((prev) =>
      prev.map((e) => {
        if (syncedExpenseIds.includes(e.id)) {
          return {
            ...e,
            yayoiSynced: true,
            yayoiSyncedAt: now,
            yayoiJournalId: journalMapping[e.id] || e.yayoiJournalId,
          };
        }
        return e;
      })
    );
  };

  // データ初期化（デモ用）
  const handleResetData = () => {
    if (window.confirm('サンプル初期データに戻しますか？現在の入力内容はリセットされます。')) {
      StorageService.resetToDefault();
      setProjects(StorageService.getProjects());
      setExpenses(StorageService.getExpenses());
      setLaborRecords(StorageService.getLaborRecords());
      setYayoiConfig(StorageService.getYayoiConfig());
      alert('初期データに復元しました。');
    }
  };

  const unsyncedCount = expenses.filter((e) => !e.yayoiSynced).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased">
      {/* ナビゲーションバー */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        yayoiConfig={yayoiConfig}
        unsyncedCount={unsyncedCount}
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
        onOpenYayoiSync={() => setShowYayoiModal(true)}
        onOpenScanner={() => setActiveTab('scanner')}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* メインコンテンツエリア */}
      <main className="max-w-6xl mx-auto w-full px-4 py-5 pb-24 flex-1">
        {activeTab === 'dashboard' && (
          <Dashboard 
            projects={projects}
            expenses={expenses}
            laborRecords={laborRecords}
            currentMonth={currentMonth}
            onOpenScanner={() => setActiveTab('scanner')}
            onOpenExpenses={() => setActiveTab('expenses')}
            onOpenYayoiSync={() => setShowYayoiModal(true)}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setActiveTab('projects');
            }}
            onNewProject={() => setActiveTab('projects')}
            onAddExpense={handleAddExpense}
            onOpenSettings={() => setShowSettingsModal(true)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView 
            projects={projects}
            expenses={expenses}
            laborRecords={laborRecords}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onSelectProjectDetail={(id) => setSelectedProjectId(id)}
            selectedProjectId={selectedProjectId}
            onCloseDetail={() => setSelectedProjectId(null)}
          />
        )}

        {activeTab === 'scanner' && (
          <ReceiptScanner 
            projects={projects}
            yayoiConfig={yayoiConfig}
            onAddExpense={handleAddExpense}
            onNavigateList={() => setActiveTab('expenses')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesList 
            expenses={expenses}
            projects={projects}
            yayoiConfig={yayoiConfig}
            currentMonth={currentMonth}
            onUpdateExpense={handleUpdateExpense}
            onDeleteExpense={handleDeleteExpense}
            onOpenScanner={() => setActiveTab('scanner')}
            onOpenYayoiSync={() => setShowYayoiModal(true)}
          />
        )}

        {activeTab === 'labor' && (
          <LaborManagement 
            laborRecords={laborRecords}
            projects={projects}
            currentMonth={currentMonth}
            onAddLabor={handleAddLabor}
            onDeleteLabor={handleDeleteLabor}
            onUpdateLaborStatus={handleUpdateLaborStatus}
          />
        )}

        {activeTab === 'yayoi' && (
          <div className="max-w-3xl mx-auto">
            <YayoiSyncModal 
              expenses={expenses}
              projects={projects}
              yayoiConfig={yayoiConfig}
              onUpdateConfig={setYayoiConfig}
              onBulkSyncComplete={handleBulkSyncComplete}
              onClose={() => setActiveTab('dashboard')}
            />
          </div>
        )}
      </main>

      {/* 弥生会計連携モーダル */}
      {showYayoiModal && activeTab !== 'yayoi' && (
        <YayoiSyncModal 
          expenses={expenses}
          projects={projects}
          yayoiConfig={yayoiConfig}
          onUpdateConfig={setYayoiConfig}
          onBulkSyncComplete={handleBulkSyncComplete}
          onClose={() => setShowYayoiModal(false)}
        />
      )}

      {/* AI解析設定（Gemini API）モーダル */}
      {showSettingsModal && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)}
          onSaved={() => {
            // 設定保存後のリフレッシュ
          }}
        />
      )}

      {/* 画面フッターのフローティング撮影・画像追加ボタン（全画面常駐） */}
      <FloatingScanButton 
        projects={projects}
        yayoiConfig={yayoiConfig}
        onSuccess={handleAddExpense}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* フッター */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8 pb-20 sm:pb-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <strong className="text-slate-700">現場収支クラウド</strong> ｜ 下請けリフォーム・職人専用収支管理 ＆ 弥生会計API連携
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleResetData}
              className="inline-flex items-center space-x-1 text-slate-400 hover:text-slate-600 cursor-pointer transition"
              title="初期デモデータに戻す"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>デモデータ初期化</span>
            </button>
            <span>© 2026 Reform Ledger Cloud</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default App;
