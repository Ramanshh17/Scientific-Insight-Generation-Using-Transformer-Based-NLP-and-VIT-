import { useState, useEffect } from 'react';
import { getStoredDocuments, deleteDocument, clearAllDocuments, getStorageUsage, type StoredDocument } from '../utils/documentStore';

interface Props {
  onNavigate: (page: string) => void;
}

export default function DocumentHistoryPage({ onNavigate }: Props) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [filter, setFilter] = useState<'all' | 'pdf' | 'text' | 'image'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDoc, setSelectedDoc] = useState<StoredDocument | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: '0 B', count: 0 });

  const refresh = () => {
    setDocuments(getStoredDocuments());
    setStorageInfo(getStorageUsage());
  };

  useEffect(() => { refresh(); }, []);

  const filtered = documents.filter(d => {
    if (filter !== 'all' && d.type !== filter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    deleteDocument(id);
    if (selectedDoc?.id === id) setSelectedDoc(null);
    refresh();
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all saved documents?')) {
      clearAllDocuments();
      setSelectedDoc(null);
      refresh();
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const typeIcon = (type: string) => type === 'pdf' ? '📄' : type === 'image' ? '🖼️' : '📝';
  const typeColor = (type: string) => type === 'pdf' ? 'text-red-400 bg-red-500/20' : type === 'image' ? 'text-green-400 bg-green-500/20' : 'text-blue-400 bg-blue-500/20';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">📁 Recent Files</h2>
          <p className="text-slate-400 text-sm mt-1">View and manage your previously analyzed documents</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass rounded-lg px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-slate-400">{storageInfo.count} docs • {storageInfo.used}</span>
          </div>
          {documents.length > 0 && (
            <button onClick={handleClearAll} className="text-xs bg-red-500/10 text-red-400 px-3 py-2 rounded-lg hover:bg-red-500/20 transition-colors">
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          {(['all', 'pdf', 'text', 'image'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                filter === f ? 'bg-indigo-500/20 text-indigo-300 font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? '📋 All' : f === 'pdf' ? '📄 PDF' : f === 'text' ? '📝 Text' : '🖼️ Image'}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`px-2.5 py-1.5 rounded-md text-xs ${viewMode === 'grid' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}>▦</button>
          <button onClick={() => setViewMode('list')} className={`px-2.5 py-1.5 rounded-md text-xs ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}>☰</button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-5xl mb-4">📂</p>
          <p className="text-xl text-white font-medium mb-2">
            {documents.length === 0 ? 'No Documents Yet' : 'No Matching Documents'}
          </p>
          <p className="text-slate-400 text-sm mb-6">
            {documents.length === 0
              ? 'Analyze a PDF, text, or image to see it here'
              : 'Try adjusting your search or filter'
            }
          </p>
          {documents.length === 0 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => onNavigate('text')} className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition-colors">
                📝 Analyze Text
              </button>
              <button onClick={() => onNavigate('pdf')} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
                📄 Analyze PDF
              </button>
              <button onClick={() => onNavigate('image')} className="px-4 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition-colors">
                🖼️ Analyze Image
              </button>
            </div>
          )}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-[#1e293b] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcon(selectedDoc.type)}</span>
                <div>
                  <h3 className="text-white font-bold text-lg">{selectedDoc.name}</h3>
                  <p className="text-xs text-slate-400">{formatDate(selectedDoc.date)} • {selectedDoc.size}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Document Type</p>
                <span className={`text-xs px-2 py-1 rounded-full ${typeColor(selectedDoc.type)}`}>
                  {selectedDoc.type.toUpperCase()}
                </span>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Statistics</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedDoc.stats).map(([key, value]) => (
                    <div key={key} className="bg-slate-800/50 rounded-lg p-3">
                      <p className="text-[10px] text-slate-500 capitalize">{key}</p>
                      <p className="text-sm text-white font-medium">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedDoc.preview && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">Preview</p>
                  <div className="bg-slate-800/50 rounded-lg p-4 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{selectedDoc.preview}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex items-center justify-between">
              <button
                onClick={() => { handleDelete(selectedDoc.id); }}
                className="text-xs bg-red-500/10 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                🗑️ Delete
              </button>
              <button
                onClick={() => { setSelectedDoc(null); onNavigate(selectedDoc.type === 'pdf' ? 'pdf' : selectedDoc.type === 'image' ? 'image' : 'text'); }}
                className="text-xs bg-indigo-500/20 text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-500/30 transition-colors"
              >
                📎 Analyze Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="glass rounded-xl p-5 hover:bg-slate-800/40 transition-all cursor-pointer group border border-transparent hover:border-indigo-500/30"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{typeIcon(doc.type)}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeColor(doc.type)}`}>
                    {doc.type.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-xs"
                >
                  ✕
                </button>
              </div>
              <h4 className="text-white font-medium text-sm truncate mb-1">{doc.name}</h4>
              <p className="text-[10px] text-slate-500 mb-3">{formatDate(doc.date)} • {doc.size}</p>
              {doc.preview && (
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{doc.preview}</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(doc.stats).slice(0, 3).map(([key, value]) => (
                  <span key={key} className="text-[10px] bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded">
                    {key}: {value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {filtered.length > 0 && viewMode === 'list' && (
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-400 p-4">Document</th>
                <th className="text-center text-slate-400 p-4">Type</th>
                <th className="text-center text-slate-400 p-4">Size</th>
                <th className="text-center text-slate-400 p-4">Date</th>
                <th className="text-center text-slate-400 p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(doc => (
                <tr key={doc.id} className="border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{typeIcon(doc.type)}</span>
                      <div>
                        <p className="text-white font-medium truncate max-w-[200px]">{doc.name}</p>
                        {doc.preview && <p className="text-[10px] text-slate-500 truncate max-w-[200px]">{doc.preview}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${typeColor(doc.type)}`}>{doc.type.toUpperCase()}</span>
                  </td>
                  <td className="p-4 text-center text-slate-400 text-xs">{doc.size}</td>
                  <td className="p-4 text-center text-slate-400 text-xs">{formatDate(doc.date)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(doc.id); }}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
