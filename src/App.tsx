import React, { useState, useEffect } from 'react';
import { 
  Project, 
  ExpenseItem, 
  LaborRecord, 
  YayoiApiConfig 
} from './types';
import { StorageService } from './services/storage';
import { Navbar, NavTab } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ProjectsView } from './components/ProjectsView';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ExpensesList } from './components/ExpensesList';
import { LaborManagement } from './components/LaborManagement';
import { YayoiSyncModal } from './components/YayoiSyncModal';
import { RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [projects, setProjects] = useState<Project[]>(() => StorageService.getProjects());
  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => StorageService.getExpenses());
  const [laborRecords, setLaborRecords] = useState<LaborRecord[]>(() => StorageService.getLaborRecords());
  const [yayoiConfig, setYayoiConfig] = useState<YayoiApiConfig>(() => StorageService.getYayoiConfig());

  // モーダルステート
  const [showYayoiModal, setShowYayoiModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 永続化保存
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

  // ハンドラー
  const handleAddProject = (newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAddExpense = (newExpense: ExpenseItem) => {
    setExpenses((prev) => [newExpense, ...prev]);
    setShowScannerModal(false);
  };

  const handleUpdateExpense = (updated: ExpenseItem) => {
    setExpenses((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('この経費データを削除してもよろしいですか？')) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleAddLabor = (newRecord: LaborRecord) => {
    setLaborRecords((prev) => [newRecord, ...prev]);
  };

  const handleDeleteLabor = (id: string) => {
    if (window.confirm('この人工記録を削除しますか？')) {
      setLaborRecords((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleUpdateLaborStatus = (id: string, status: LaborRecord['status']) => {
    setLaborRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      
      {/* ナビゲーションバー */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        yayoiConfig={yayoiConfig}
        unsyncedCount={unsyncedCount}
        onOpenYayoiSync={() => setShowYayoiModal(true)}
        onOpenScanner={() => setActiveTab('scanner')}
      />

      {/* メインコンテンツエリア */}
      <main style={{ maxWidth: 1280, margin: '0 auto', width: '100%', padding: '1.5rem 1rem', flex: 1 }}>
        {activeTab === 'dashboard' && (
          <Dashboard 
            projects={projects}
            expenses={expenses}
            laborRecords={laborRecords}
            onOpenScanner={() => setActiveTab('scanner')}
            onOpenYayoiSync={() => setShowYayoiModal(true)}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setActiveTab('projects');
            }}
            onNewProject={() => setActiveTab('projects')}
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
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesList 
            expenses={expenses}
            projects={projects}
            yayoiConfig={yayoiConfig}
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
            onAddLabor={handleAddLabor}
            onDeleteLabor={handleDeleteLabor}
            onUpdateLaborStatus={handleUpdateLaborStatus}
          />
        )}

        {activeTab === 'yayoi' && (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
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

      {/* フッター */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: '#ffffff', padding: '1rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong>現場収支クラウド</strong> ｜ 下請けリフォーム・職人専用収支管理 ＆ 弥生会計API連携
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={handleResetData}
              style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              title="初期デモデータに戻す"
            >
              <RotateCcw size={13} />
              デモデータ初期化
            </button>
            <span>© 2026 Reform Ledger Cloud</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
export default App;
