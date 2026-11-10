import React from 'react';
import { 
  Building2, 
  Receipt, 
  Layers, 
  Users, 
  RefreshCw, 
  TrendingUp, 
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { YayoiApiConfig } from '../types';

export type NavTab = 'dashboard' | 'projects' | 'scanner' | 'expenses' | 'labor' | 'yayoi';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  yayoiConfig: YayoiApiConfig;
  unsyncedCount: number;
  onOpenYayoiSync: () => void;
  onOpenScanner: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  yayoiConfig,
  unsyncedCount,
  onOpenYayoiSync,
  onOpenScanner,
}) => {
  return (
    <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0.75rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* ロゴ & アプリ名 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('dashboard')}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              backgroundColor: 'var(--primary)', 
              color: '#ffffff',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <Building2 size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                  現場収支クラウド
                </span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  backgroundColor: 'var(--primary-light)', 
                  color: 'var(--primary)', 
                  fontWeight: 700, 
                  padding: '0.15rem 0.45rem', 
                  borderRadius: 4 
                }}>
                  下請けリフォームPRO
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                現場別原価・レシートOCR ＆ 弥生会計API連携
              </p>
            </div>
          </div>

          {/* クイックアクション ＆ 弥生連携ステータス */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              className="btn btn-primary btn-sm"
              onClick={onOpenScanner}
              title="レシート・領収書を撮影または取込"
            >
              <Camera size={16} />
              <span>レシート取込</span>
            </button>

            <button 
              className="btn btn-yayoi-outline btn-sm"
              onClick={onOpenYayoiSync}
              title="弥生会計API連携ハブを開く"
              style={{ position: 'relative' }}
            >
              <RefreshCw size={15} />
              <span>弥生会計連携</span>
              {unsyncedCount > 0 ? (
                <span style={{ 
                  backgroundColor: 'var(--yayoi)', 
                  color: '#ffffff', 
                  fontSize: '0.7rem', 
                  padding: '0.1rem 0.4rem', 
                  borderRadius: 10,
                  fontWeight: 700,
                  marginLeft: '0.2rem'
                }}>
                  {unsyncedCount}件未送信
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: 'var(--success)', fontSize: '0.75rem', fontWeight: 600 }}>
                  <CheckCircle2 size={13} />
                  接続中
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ナビゲーションタブ */}
        <nav style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'dashboard' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'dashboard' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <TrendingUp size={16} />
            <span>ダッシュボード</span>
          </button>

          <button 
            onClick={() => setActiveTab('projects')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'projects' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'projects' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'projects' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Layers size={16} />
            <span>現場・案件一覧</span>
          </button>

          <button 
            onClick={() => setActiveTab('scanner')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'scanner' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'scanner' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'scanner' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Receipt size={16} />
            <span>レシート取込 (OCR)</span>
          </button>

          <button 
            onClick={() => setActiveTab('expenses')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'expenses' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'expenses' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'expenses' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>経費・仕訳一覧</span>
            {unsyncedCount > 0 && (
              <span style={{ 
                backgroundColor: 'var(--yayoi)', 
                color: '#ffffff', 
                fontSize: '0.7rem', 
                padding: '0 0.35rem', 
                borderRadius: 8,
                fontWeight: 700
              }}>
                {unsyncedCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('labor')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'labor' ? 'var(--primary-light)' : 'transparent',
              color: activeTab === 'labor' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeTab === 'labor' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Users size={16} />
            <span>外注・応援人工</span>
          </button>

          <button 
            onClick={() => setActiveTab('yayoi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'yayoi' ? 'var(--yayoi-bg)' : 'transparent',
              color: activeTab === 'yayoi' ? 'var(--yayoi)' : 'var(--text-muted)',
              fontWeight: activeTab === 'yayoi' ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <RefreshCw size={15} />
            <span>弥生会計連携ハブ</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
