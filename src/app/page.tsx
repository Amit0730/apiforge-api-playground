"use client";

import { useState, useEffect, useRef } from 'react';
import { Panel, Group, Separator } from 'react-resizable-panels';
import Editor, { useMonaco } from '@monaco-editor/react';
import { Play, Save, Plus, AlertCircle, Copy, Check, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

import { ApiRequest, ApiResponse, HttpMethod, KeyValue } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Sidebar } from '@/components/Sidebar';
import { KeyValueEditor } from '@/components/KeyValueEditor';
import { MethodBadge } from '@/components/MethodBadge';

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

const DEFAULT_URL = 'https://jsonplaceholder.typicode.com/users/1';

const INITIAL_REQUEST: ApiRequest = {
  id: uuidv4(),
  method: 'GET',
  url: DEFAULT_URL,
  headers: [{ id: uuidv4(), key: 'Accept', value: 'application/json', enabled: true }],
  queryParams: [{ id: uuidv4(), key: '', value: '', enabled: true }],
  body: '',
  timestamp: Date.now(),
};

export default function Home() {
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [request, setRequest] = useState<ApiRequest>(INITIAL_REQUEST);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [history, setHistory] = useState<ApiRequest[]>([]);
  const [savedRequests, setSavedRequests] = useState<ApiRequest[]>([]);
  
  const [activeReqTab, setActiveReqTab] = useState<'Params' | 'Headers' | 'Body'>('Params');
  const [activeResTab, setActiveResTab] = useState<'Body' | 'Headers'>('Body');
  const [resViewMode, setResViewMode] = useState<'Pretty' | 'Raw'>('Pretty');
  
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  // Hydrate from localStorage
  useEffect(() => {
    const storedHistory = localStorage.getItem('apiforge_history');
    if (storedHistory) {
      try { setHistory(JSON.parse(storedHistory)); } catch (e) {}
    }
    
    const storedSaved = localStorage.getItem('apiforge_saved');
    if (storedSaved) {
      try { setSavedRequests(JSON.parse(storedSaved)); } catch (e) {}
    }
    
    setIsMounted(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('apiforge_history', JSON.stringify(history));
    }
  }, [history, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('apiforge_saved', JSON.stringify(savedRequests));
    }
  }, [savedRequests, isMounted]);

  const handleSend = async () => {
    // Validate JSON body if present
    if (request.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      try {
        JSON.parse(request.body);
        setJsonError(null);
      } catch (e: any) {
        setJsonError(`Invalid JSON: ${e.message}`);
        setActiveReqTab('Body');
        return;
      }
    } else {
      setJsonError(null);
    }

    setIsLoading(true);
    setResponse(null);
    setActiveResTab('Body');

    // Build final URL with query params
    let finalUrl = request.url;
    const activeParams = request.queryParams.filter(p => p.enabled && p.key);
    if (activeParams.length > 0) {
      try {
        const urlObj = new URL(finalUrl.startsWith('http') ? finalUrl : `https://${finalUrl}`);
        activeParams.forEach(p => urlObj.searchParams.append(p.key, p.value));
        finalUrl = urlObj.toString();
      } catch (e) {
        // Invalid URL, keep original
      }
    }

    // Build headers
    const headers: Record<string, string> = {};
    request.headers.filter(h => h.enabled && h.key).forEach(h => {
      headers[h.key] = h.value;
    });

    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: finalUrl,
          method: request.method,
          headers,
          requestBody: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body ? JSON.parse(request.body) : undefined,
        }),
      });

      const data = await res.json();
      setResponse(data);

      // Add to history (avoid duplicates of same exact request, just update timestamp, or just unshift)
      const historyItem = { ...request, url: finalUrl, timestamp: Date.now(), id: uuidv4() };
      setHistory(prev => [historyItem, ...prev].slice(0, 50)); // Keep last 50
    } catch (err: any) {
      setResponse({
        status: 0,
        statusText: 'Error',
        time: 0,
        size: 0,
        headers: {},
        data: null,
        error: err.message || 'Failed to send request. Check your network or CORS policy.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadResponse = () => {
    if (!response) return;
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `response-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveCurrentRequest = () => {
    if (!saveName.trim()) return;
    const savedReq = { ...request, name: saveName, id: uuidv4() };
    setSavedRequests(prev => [...prev, savedReq]);
    setShowSaveModal(false);
    setSaveName('');
  };

  const loadExample = (type: 'GET' | 'POST') => {
    if (type === 'GET') {
      setRequest({
        id: uuidv4(),
        method: 'GET',
        url: 'https://api.github.com/users/octocat',
        headers: [{ id: uuidv4(), key: 'Accept', value: 'application/json', enabled: true }],
        queryParams: [{ id: uuidv4(), key: '', value: '', enabled: true }],
        body: '',
        timestamp: Date.now(),
      });
      setActiveReqTab('Params');
    } else {
      setRequest({
        id: uuidv4(),
        method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts',
        headers: [
          { id: uuidv4(), key: 'Content-Type', value: 'application/json', enabled: true },
          { id: uuidv4(), key: 'Accept', value: 'application/json', enabled: true }
        ],
        queryParams: [{ id: uuidv4(), key: '', value: '', enabled: true }],
        body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }, null, 2),
        timestamp: Date.now(),
      });
      setActiveReqTab('Body');
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-[var(--background)]" />;

  const responseBodyText = response?.data 
    ? (typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2))
    : '';

  return (
    <div className="flex h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden font-sans">
      <Group orientation="horizontal">
        {/* Sidebar Panel */}
        <Panel defaultSize={20} minSize={15} maxSize={30} className="hidden md:block">
          <Sidebar
            history={history}
            savedRequests={savedRequests}
            onSelect={(req) => setRequest({ ...req, id: uuidv4() })} // Clone it
            onClearHistory={() => setHistory([])}
            onDeleteHistoryItem={(id) => setHistory(h => h.filter(x => x.id !== id))}
            onDeleteSavedItem={(id) => setSavedRequests(s => s.filter(x => x.id !== id))}
          />
        </Panel>
        
        <Separator className="w-1 bg-[var(--panel-border)] hover:bg-[var(--primary)] transition-colors cursor-col-resize hidden md:block" />
        
        {/* Main Content */}
        <Panel defaultSize={80} className="flex flex-col h-full overflow-hidden">
          {/* Header Mobile Only */}
          <div className="md:hidden p-4 border-b border-[var(--panel-border)] flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
              APIForge
            </h1>
          </div>

          <Group orientation="vertical" className="flex-1 md:!flex-row" id="apiforge-layout">
            
            {/* Request Panel */}
            <Panel defaultSize={50} minSize={30} className="flex flex-col border-b md:border-b-0 md:border-r border-[var(--panel-border)] bg-[var(--panel)]">
              {/* URL Bar */}
              <div className="p-4 border-b border-[var(--panel-border)] flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-[var(--background)] border border-[var(--panel-border)] rounded-md focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition-all overflow-hidden h-10">
                    <select
                      value={request.method}
                      onChange={(e) => setRequest({ ...request, method: e.target.value as HttpMethod })}
                      className={cn(
                        "h-full px-3 bg-transparent border-r border-[var(--panel-border)] font-bold text-sm cursor-pointer outline-none appearance-none hover:bg-[var(--accent)]",
                        {
                          'text-blue-400': request.method === 'GET',
                          'text-green-400': request.method === 'POST',
                          'text-yellow-400': request.method === 'PUT',
                          'text-orange-400': request.method === 'PATCH',
                          'text-red-400': request.method === 'DELETE',
                        }
                      )}
                    >
                      {HTTP_METHODS.map(m => <option key={m} value={m} className="text-[var(--foreground)] bg-[var(--panel)]">{m}</option>)}
                    </select>
                    <input
                      type="text"
                      value={request.url}
                      onChange={(e) => setRequest({ ...request, url: e.target.value })}
                      placeholder="Enter request URL"
                      className="flex-1 h-full px-3 bg-transparent font-mono text-sm outline-none w-full min-w-0"
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="h-10 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-md font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play size={16} fill="currentColor" />
                    )}
                    Send
                  </button>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="h-10 px-3 bg-[var(--accent)] hover:bg-[#27272a] text-gray-300 rounded-md transition-colors shrink-0"
                    title="Save Request"
                  >
                    <Save size={18} />
                  </button>
                </div>
                
                {/* Example Quick Links */}
                <div className="flex gap-4 text-xs text-gray-500 items-center">
                  <span>Examples:</span>
                  <button onClick={() => loadExample('GET')} className="hover:text-blue-400 underline decoration-dotted transition-colors">GitHub User (GET)</button>
                  <button onClick={() => loadExample('POST')} className="hover:text-green-400 underline decoration-dotted transition-colors">Create Post (POST)</button>
                </div>
              </div>

              {/* Request Tabs */}
              <div className="flex border-b border-[var(--panel-border)] px-2 overflow-x-auto scrollbar-hide">
                {['Params', 'Headers', 'Body'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveReqTab(tab as any)}
                    className={cn(
                      "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                      activeReqTab === tab
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-gray-400 hover:text-[var(--foreground)]"
                    )}
                  >
                    {tab}
                    {tab === 'Params' && request.queryParams.filter(p => p.enabled && p.key).length > 0 && (
                      <span className="ml-2 text-[10px] bg-[var(--accent)] px-1.5 py-0.5 rounded-full text-gray-300">
                        {request.queryParams.filter(p => p.enabled && p.key).length}
                      </span>
                    )}
                    {tab === 'Headers' && request.headers.filter(h => h.enabled && h.key).length > 0 && (
                      <span className="ml-2 text-[10px] bg-[var(--accent)] px-1.5 py-0.5 rounded-full text-gray-300">
                        {request.headers.filter(h => h.enabled && h.key).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Request Tab Content */}
              <div className="flex-1 overflow-y-auto p-4 relative">
                {activeReqTab === 'Params' && (
                  <KeyValueEditor
                    items={request.queryParams}
                    onChange={(items) => setRequest({ ...request, queryParams: items })}
                    placeholderKey="Query Param"
                  />
                )}
                {activeReqTab === 'Headers' && (
                  <KeyValueEditor
                    items={request.headers}
                    onChange={(items) => setRequest({ ...request, headers: items })}
                    placeholderKey="Header"
                  />
                )}
                {activeReqTab === 'Body' && (
                  <div className="h-full flex flex-col">
                    {jsonError && (
                      <div className="mb-3 p-3 bg-red-950/30 border border-red-900 rounded-md text-red-400 text-sm flex items-start gap-2">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <span className="break-all">{jsonError}</span>
                      </div>
                    )}
                    <div className="flex-1 border border-[var(--panel-border)] rounded-md overflow-hidden">
                      <Editor
                        height="100%"
                        defaultLanguage="json"
                        theme="vs-dark"
                        value={request.body}
                        onChange={(val) => {
                          setRequest({ ...request, body: val || '' });
                          if (jsonError) setJsonError(null);
                        }}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          fontFamily: 'var(--font-mono)',
                          padding: { top: 16 },
                          scrollBeyondLastLine: false,
                          formatOnPaste: true,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            <Separator className="h-1 md:w-1 md:h-auto bg-[var(--panel-border)] hover:bg-[var(--primary)] transition-colors md:cursor-col-resize cursor-row-resize" />

            {/* Response Panel */}
            <Panel defaultSize={50} minSize={30} className="flex flex-col bg-[var(--background)]">
              {response ? (
                <>
                  {/* Response Header */}
                  <div className="p-4 border-b border-[var(--panel-border)] flex items-center justify-between overflow-x-auto">
                    <div className="flex items-center gap-6 min-w-max">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Status</span>
                        <span className={cn(
                          "text-sm font-mono font-bold flex items-center gap-1.5",
                          response.status >= 200 && response.status < 300 ? "text-[var(--success)]" :
                          response.status >= 400 ? "text-[var(--error)]" : "text-[var(--warning)]"
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            response.status >= 200 && response.status < 300 ? "bg-[var(--success)]" :
                            response.status >= 400 ? "bg-[var(--error)]" : "bg-[var(--warning)]"
                          )} />
                          {response.status} {response.statusText}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Time</span>
                        <span className="text-sm font-mono text-[var(--foreground)]">{response.time} ms</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Size</span>
                        <span className="text-sm font-mono text-[var(--foreground)]">
                          {(response.size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Response Tabs & Actions */}
                  <div className="flex items-center justify-between border-b border-[var(--panel-border)] px-2">
                    <div className="flex overflow-x-auto scrollbar-hide">
                      {['Body', 'Headers'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveResTab(tab as any)}
                          className={cn(
                            "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                            activeResTab === tab
                              ? "border-[var(--primary)] text-[var(--primary)]"
                              : "border-transparent text-gray-400 hover:text-[var(--foreground)]"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                    {activeResTab === 'Body' && (
                      <div className="flex items-center gap-2 px-2">
                        <div className="flex bg-[var(--accent)] p-0.5 rounded-md border border-[var(--panel-border)]">
                          <button
                            onClick={() => setResViewMode('Pretty')}
                            className={cn(
                              "px-2 py-1 text-xs rounded-sm transition-colors",
                              resViewMode === 'Pretty' ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm" : "text-gray-400 hover:text-gray-200"
                            )}
                          >
                            Pretty
                          </button>
                          <button
                            onClick={() => setResViewMode('Raw')}
                            className={cn(
                              "px-2 py-1 text-xs rounded-sm transition-colors",
                              resViewMode === 'Raw' ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm" : "text-gray-400 hover:text-gray-200"
                            )}
                          >
                            Raw
                          </button>
                        </div>
                        <button onClick={handleCopyResponse} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Copy Response">
                          {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                        <button onClick={handleDownloadResponse} className="p-1.5 text-gray-400 hover:text-white transition-colors" title="Download Response">
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Response Content */}
                  <div className="flex-1 overflow-auto relative">
                    {response.error ? (
                      <div className="p-6 h-full flex items-center justify-center">
                        <div className="text-center max-w-md">
                          <AlertCircle size={48} className="mx-auto text-red-500 mb-4 opacity-80" />
                          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Request Failed</h3>
                          <p className="text-gray-400 text-sm mb-4">{response.error}</p>
                          <div className="p-4 bg-[var(--accent)] rounded-lg text-xs text-left text-gray-400 border border-[var(--panel-border)]">
                            <p className="font-bold mb-1">Common causes:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>The server is unreachable or offline</li>
                              <li>CORS policy blocked the request (Proxy failed)</li>
                              <li>Invalid URL format or DNS resolution error</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {activeResTab === 'Body' && (
                          resViewMode === 'Pretty' ? (
                            <Editor
                              height="100%"
                              defaultLanguage={typeof response.data === 'object' ? 'json' : 'html'}
                              theme="vs-dark"
                              value={responseBodyText}
                              options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: 'var(--font-mono)',
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                              }}
                            />
                          ) : (
                            <pre className="p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap break-all">
                              {responseBodyText}
                            </pre>
                          )
                        )}
                        {activeResTab === 'Headers' && (
                          <div className="p-4">
                            <table className="w-full text-left text-sm">
                              <tbody className="divide-y divide-[var(--panel-border)]">
                                {Object.entries(response.headers).map(([key, val]) => (
                                  <tr key={key} className="hover:bg-[var(--accent)] transition-colors">
                                    <td className="py-2.5 px-3 font-mono font-semibold text-gray-300 w-1/3 break-all border-r border-[var(--panel-border)]">{key}</td>
                                    <td className="py-2.5 px-3 font-mono text-gray-400 break-all">{val}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                  <div className="w-24 h-24 mb-6 rounded-full bg-[var(--accent)] flex items-center justify-center border border-[var(--panel-border)] shadow-inner">
                    <Play size={32} className="text-[var(--panel-border)] ml-2" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-400 mb-2">Enter a Request URL</h3>
                  <p className="max-w-md text-sm text-gray-500">
                    Configure your API request parameters, headers, and body above, then hit Send to see the response here.
                  </p>
                </div>
              )}
            </Panel>
          </Group>
        </Panel>
      </Group>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--panel)] border border-[var(--panel-border)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-[var(--panel-border)]">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Save Request</h2>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-gray-400 mb-2">Name your request</label>
              <input
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                placeholder="e.g. Get User Profile"
                className="w-full bg-[var(--background)] border border-[var(--panel-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] text-[var(--foreground)]"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && saveCurrentRequest()}
              />
            </div>
            <div className="p-4 border-t border-[var(--panel-border)] bg-[var(--background)] flex justify-end gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentRequest}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
