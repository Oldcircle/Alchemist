
import React, { useState, useEffect } from 'react';
import { ModelConfig, Language } from '../types';
import { PROVIDERS, DEFAULT_CONFIG } from '../utils/providers';
import { getText } from '../utils/translations';

interface SettingsProps {
  configs: ModelConfig[];
  activeConfigId: string;
  onSaveConfigs: (configs: ModelConfig[]) => void;
  onSelectConfig: (id: string) => void;
  lang: Language;
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  configs, 
  activeConfigId, 
  onSaveConfigs, 
  onSelectConfig, 
  lang,
  onClose 
}) => {
  const [localConfigs, setLocalConfigs] = useState<ModelConfig[]>(configs);
  const [editingId, setEditingId] = useState<string>(activeConfigId);
  
  // Mobile check for responsive layout
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const currentConfig = localConfigs.find(c => c.id === editingId) || localConfigs[0];

  const handleAddConfig = () => {
    const newId = crypto.randomUUID();
    const newConfig: ModelConfig = {
      ...DEFAULT_CONFIG,
      id: newId,
      name: 'New Config',
      provider: 'openai',
      baseUrl: 'https://api.openai.com/v1',
      modelName: 'gpt-4o-mini',
      apiKey: ''
    };
    setLocalConfigs([...localConfigs, newConfig]);
    setEditingId(newId);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (localConfigs.length === 1) {
      alert("Cannot delete the last configuration.");
      return;
    }
    const newConfigs = localConfigs.filter(c => c.id !== id);
    setLocalConfigs(newConfigs);
    if (editingId === id) {
      setEditingId(newConfigs[0].id);
    }
    if (activeConfigId === id) {
      onSelectConfig(newConfigs[0].id);
    }
    // Auto save on delete
    onSaveConfigs(newConfigs);
  };

  const handleUpdateField = (field: keyof ModelConfig, value: string) => {
    const updated = localConfigs.map(c => {
      if (c.id === editingId) {
        const newC = { ...c, [field]: value };
        // Auto-fill defaults if provider changes
        if (field === 'provider') {
          const providerData = PROVIDERS.find(p => p.value === value);
          if (providerData) {
            newC.baseUrl = providerData.defaultBaseUrl ?? '';
            newC.modelName = providerData.defaultModel;
          }
        }
        return newC;
      }
      return c;
    });
    setLocalConfigs(updated);
  };

  const handleSaveAndClose = () => {
    onSaveConfigs(localConfigs);
    onSelectConfig(editingId); // Activate the one we were editing
    onClose();
  };

  return (
    <div className="flex h-[600px] w-full max-h-[80vh] overflow-hidden rounded-3xl border border-white/10 shadow-2xl bg-slate-900/90 backdrop-blur-xl animate-fade-in text-slate-200">
      
      {/* Sidebar List */}
      <div className={`${isMobile && editingId ? 'hidden' : 'flex'} w-full md:w-1/3 flex-col border-r border-white/5 bg-black/20`}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center">
          <h3 className="font-bold text-lg">{lang === 'zh' ? '配置列表' : 'Models'}</h3>
          <button 
            onClick={handleAddConfig}
            className="w-8 h-8 rounded-full bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-all"
          >
            +
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {localConfigs.map(config => (
            <div 
              key={config.id}
              onClick={() => setEditingId(config.id)}
              className={`
                group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border
                ${config.id === editingId 
                  ? 'bg-purple-600/20 border-purple-500/50 text-white' 
                  : 'hover:bg-white/5 border-transparent text-slate-400'
                }
              `}
            >
              <div className="flex flex-col truncate">
                <span className="font-medium truncate">{config.name}</span>
                <span className="text-[10px] uppercase opacity-60 tracking-wider">{config.provider}</span>
              </div>
              
              {config.id === activeConfigId && (
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] ml-2" />
              )}
              
              <button
                onClick={(e) => handleDelete(config.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Panel */}
      <div className={`${isMobile && !editingId ? 'hidden' : 'flex'} w-full md:w-2/3 flex-col bg-slate-900/50`}>
        {isMobile && (
          <button onClick={() => setEditingId('')} className="p-4 text-slate-400 hover:text-white flex items-center gap-2">
            ← Back
          </button>
        )}
        
        {currentConfig ? (
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="text-purple-400">⚙️</span> 
              {lang === 'zh' ? '配置 AI 模型' : 'Configure Model'}
            </h3>
            
            <div className="space-y-5">
              
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'zh' ? '配置名称' : 'Config Name'}
                </label>
                <input 
                  type="text" 
                  value={currentConfig.name}
                  onChange={(e) => handleUpdateField('name', e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>

              {/* Provider */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'zh' ? '服务商' : 'Provider'}
                </label>
                <select
                  value={currentConfig.provider}
                  onChange={(e) => handleUpdateField('provider', e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 appearance-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                >
                  {PROVIDERS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  API Key
                </label>
                <input 
                  type="password" 
                  value={currentConfig.apiKey || ''}
                  onChange={(e) => handleUpdateField('apiKey', e.target.value)}
                  placeholder={currentConfig.provider === 'ollama' ? 'Optional for Ollama' : 'sk-...'}
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                />
                <p className="text-[10px] text-slate-500">
                  {lang === 'zh' ? '密钥仅存储在本地浏览器中' : 'Stored securely in local browser storage'}
                </p>
              </div>

              {/* Base URL */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  API URL (Base URL)
                </label>
                <input 
                  type="text" 
                  value={currentConfig.baseUrl || ''}
                  onChange={(e) => handleUpdateField('baseUrl', e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm text-slate-400"
                />
              </div>

              {/* Model Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'zh' ? '模型名称' : 'Model Name'}
                </label>
                <input 
                  type="text" 
                  value={currentConfig.modelName}
                  onChange={(e) => handleUpdateField('modelName', e.target.value)}
                  placeholder="gpt-4, claude-3, etc."
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono text-sm"
                />
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a configuration
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/5 bg-black/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button 
            onClick={handleSaveAndClose}
            className="px-6 py-2 rounded-lg bg-slate-100 text-slate-900 font-bold hover:bg-white hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all transform active:scale-95"
          >
            {lang === 'zh' ? '保存并使用' : 'Save & Use'}
          </button>
        </div>
      </div>
    </div>
  );
};
