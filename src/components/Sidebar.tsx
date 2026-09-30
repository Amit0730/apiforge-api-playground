import { ApiRequest, HttpMethod } from '@/lib/types';
import { Clock, Save, Trash2, Play } from 'lucide-react';
import { MethodBadge } from './MethodBadge';

interface SidebarProps {
  history: ApiRequest[];
  savedRequests: ApiRequest[];
  onSelect: (req: ApiRequest) => void;
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
  onDeleteSavedItem: (id: string) => void;
}

export function Sidebar({
  history,
  savedRequests,
  onSelect,
  onClearHistory,
  onDeleteHistoryItem,
  onDeleteSavedItem,
}: SidebarProps) {
  return (
    <div className="w-full h-full flex flex-col bg-[var(--background)] border-r border-[var(--panel-border)] text-sm">
      <div className="p-4 border-b border-[var(--panel-border)]">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M3 15h6"/><path d="M3 18h6"/><path d="M3 12h6"/></svg>
          APIForge
        </h1>
        <p className="text-xs text-gray-400 mt-1">API Testing Playground</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 text-gray-400 font-semibold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Save size={14} />
              Saved Requests
            </div>
          </div>
          {savedRequests.length === 0 ? (
            <p className="text-xs text-gray-500 mb-6 italic">No saved requests yet.</p>
          ) : (
            <div className="flex flex-col gap-1 mb-6">
              {savedRequests.map((req) => (
                <div
                  key={req.id}
                  className="group flex items-center justify-between p-2 rounded-md hover:bg-[var(--accent)] cursor-pointer border border-transparent hover:border-[var(--panel-border)] transition-all"
                  onClick={() => onSelect(req)}
                >
                  <div className="flex flex-col truncate pr-2">
                    <span className="font-medium text-[var(--foreground)] truncate">{req.name || 'Untitled'}</span>
                    <div className="flex items-center gap-2 text-xs truncate">
                      <MethodBadge method={req.method} />
                      <span className="text-gray-400 truncate">{req.url || 'No URL'}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSavedItem(req.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-[var(--background)] transition-all"
                    title="Delete saved request"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mb-3 text-gray-400 font-semibold text-xs uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              History
            </div>
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-gray-500 hover:text-red-400"
                title="Clear history"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          
          {history.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No request history.</p>
          ) : (
            <div className="flex flex-col gap-1">
              {history.map((req) => (
                <div
                  key={req.id}
                  className="group flex items-center justify-between p-2 rounded-md hover:bg-[var(--accent)] cursor-pointer border border-transparent hover:border-[var(--panel-border)] transition-all"
                  onClick={() => onSelect(req)}
                >
                  <div className="flex flex-col truncate pr-2 w-full">
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <MethodBadge method={req.method} />
                      <span className="text-gray-500 text-[10px]">
                        {new Date(req.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-gray-300 text-xs truncate font-mono">{req.url || 'No URL'}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistoryItem(req.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 rounded-md hover:bg-[var(--background)] transition-all shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
