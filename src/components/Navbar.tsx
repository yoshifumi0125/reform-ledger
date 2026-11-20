import React from 'react';
import { 
  Building2, 
  Receipt, 
  Layers, 
  Users, 
  RefreshCw, 
  TrendingUp, 
  Camera,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings
} from 'lucide-react';
import { YayoiApiConfig } from '../types';

export type NavTab = 'dashboard' | 'projects' | 'scanner' | 'expenses' | 'labor' | 'yayoi';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  yayoiConfig: YayoiApiConfig;
  unsyncedCount: number;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  onOpenYayoiSync: () => void;
  onOpenScanner: () => void;
  onOpenSettings?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  yayoiConfig: _yayoiConfig,
  unsyncedCount,
  currentMonth,
  onMonthChange,
  onOpenYayoiSync,
  onOpenScanner,
  onOpenSettings,
}) => {
  const [year, month] = currentMonth.split('-').map(Number);

  const handlePrevMonth = () => {
    const prevDate = new Date(year, month - 2, 1);
    const y = prevDate.getFullYear();
    const m = String(prevDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  const handleNextMonth = () => {
    const nextDate = new Date(year, month, 1);
    const y = nextDate.getFullYear();
    const m = String(nextDate.getMonth() + 1).padStart(2, '0');
    onMonthChange(`${y}-${m}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:py-3">
        {/* 上段: ロゴ・アプリ名 & 月選択 & アクションボタン */}
        <div className="flex items-center justify-between gap-1 sm:gap-4">
          {/* ロゴ & タイトル */}
          <div 
            className="flex items-center space-x-1.5 sm:space-x-2 cursor-pointer select-none shrink-0"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1 whitespace-nowrap">
                <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                  現場収支
                </h1>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-black px-1 py-0.5 rounded-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden md:block">下請け原価・レシートOCR ＆ 弥生連携</p>
            </div>
          </div>

          {/* 月選択セレクター ＆ アクション */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* 月選択 (スマホでは「11月」、PCでは「2026年11月」) */}
            <div className="h-8 sm:h-9 flex items-center bg-slate-100 px-1 rounded-xl border border-slate-200 shrink-0">
              <button
                onClick={handlePrevMonth}
                aria-label="前月へ"
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-1 font-bold text-slate-900 text-xs whitespace-nowrap">
                <span className="hidden sm:inline">{year}年</span>{month}月
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="翌月へ"
                className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* スキャンボタン (スマホ: w-8 h-8, PC: h-9 px-3) */}
            <button
              onClick={onOpenScanner}
              className="h-8 w-8 sm:h-9 sm:w-9 md:w-auto md:px-3 flex items-center justify-center space-x-1.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl shadow-xs transition text-xs cursor-pointer shrink-0"
              title="レシート読取・OCR"
            >
              <Camera className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="hidden md:inline">レシート読取</span>
            </button>

            {/* 弥生会計連携ボタン (スマホ: w-8 h-8, PC: h-9 px-3) */}
            <button
              onClick={onOpenYayoiSync}
              className="h-8 w-8 sm:h-9 sm:w-9 md:w-auto md:px-3 relative flex items-center justify-center space-x-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/90 font-bold rounded-xl transition text-xs cursor-pointer shrink-0"
              title="弥生会計データ連携"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden md:inline">弥生会計</span>
              {unsyncedCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 bg-orange-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs border border-white">
                  {unsyncedCount}
                </span>
              )}
            </button>

            {/* AI設定ボタン (スマホ: w-8 h-8, PC: w-9 h-9) */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer shrink-0"
                title="AIレシート解析設定（Gemini APIキー）"
              >
                <Settings className="w-4 h-4 shrink-0" />
              </button>
            )}
          </div>
        </div>

        {/* 下段: ピル型タブナビゲーション（モバイル横スクロール対応 & 折返し防止） */}
        <nav className="flex items-center space-x-1.5 sm:space-x-2 mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 overflow-x-auto no-scrollbar -mx-4 px-4 scroll-smooth">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`shrink-0 flex items-center space-x-1.5 py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>ダッシュボード</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`shrink-0 flex items-center space-x-1.5 py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'projects'
                ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>現場案件</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`shrink-0 flex items-center space-x-1.5 py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span>支出・仕訳</span>
          </button>

          <button
            onClick={() => setActiveTab('labor')}
            className={`shrink-0 flex items-center space-x-1.5 py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'labor'
                ? 'bg-emerald-50 text-emerald-800 font-extrabold shadow-xs border border-emerald-200/70'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>応援職人・人工</span>
          </button>

          <button
            onClick={() => setActiveTab('yayoi')}
            className={`shrink-0 flex items-center space-x-1.5 py-2 px-3 sm:px-3.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'yayoi'
                ? 'bg-orange-100 text-orange-900 font-extrabold shadow-xs border border-orange-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>弥生連携ハブ</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
