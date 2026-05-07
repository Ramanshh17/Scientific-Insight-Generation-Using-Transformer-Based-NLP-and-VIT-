import { cn } from '../utils/cn';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: string;
  divider?: boolean;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { id: 'divider-1', label: '', icon: '', divider: true },
  { id: 'text', label: 'Text Analysis', icon: '📝' },
  { id: 'image', label: 'Image Analysis', icon: '🖼️' },
  { id: 'pdf', label: 'PDF Analysis', icon: '📄' },
  { id: 'divider-2', label: '', icon: '', divider: true },
  { id: 'models', label: 'Model Performance', icon: '📊' },
  { id: 'history', label: 'Recent Files', icon: '📁' },
  { id: 'divider-3', label: '', icon: '', divider: true },
  { id: 'arxiv', label: 'arXiv Analyzer', icon: '📚' },
  { id: 'eda', label: 'EDA Explorer', icon: '🔬' },
  { id: 'divider-4', label: '', icon: '', divider: true },
  { id: 'hypothesis', label: 'Hypotheses', icon: '🧪' },
  { id: 'insights', label: 'Insights Hub', icon: '💡' },
  { id: 'crossmodal', label: 'Cross-Modal', icon: '🔗' },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  analysisCount: { text: number; image: number; pdf: number; arxiv: number };
}

const Sidebar: React.FC<SidebarProps> = ({ active, onNavigate, analysisCount }) => {
  return (
    <div className="w-64 min-h-screen bg-[#0c1222] border-r border-slate-700/50 flex flex-col fixed left-0 top-0 z-50">
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl">
            🔬
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              SciMultiAnalyzer
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Multi-Modal Framework</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          if (item.divider) {
            return <div key={item.id} className="h-px bg-slate-700/30 my-2 mx-2" />;
          }
          const count = item.id === 'text' ? analysisCount.text :
                       item.id === 'image' ? analysisCount.image :
                       item.id === 'pdf' ? analysisCount.pdf :
                       item.id === 'arxiv' ? analysisCount.arxiv : 0;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                active === item.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-500/30 text-indigo-300 font-medium">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="glass rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Analysis Stats</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Texts</span>
              <span className="text-indigo-400 font-medium">{analysisCount.text}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Images</span>
              <span className="text-purple-400 font-medium">{analysisCount.image}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">PDFs</span>
              <span className="text-cyan-400 font-medium">{analysisCount.pdf}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">arXiv</span>
              <span className="text-green-400 font-medium">{analysisCount.arxiv}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-[9px] text-slate-600">Powered by arXiv · World Bank · RVL-CDIP</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
