
import React, { useState, useEffect, useRef } from 'react';
import { ElementItem, GameState, AlchemyResponse, Language, ModelConfig } from './types';
import { combineElements } from './services/alchemyService';
import { ElementCard } from './components/ElementCard';
import { Cauldron } from './components/Cauldron';
import { Almanac } from './components/Almanac';
import { Settings } from './components/Settings';
import { getText } from './utils/translations';
import { DEFAULT_CONFIG } from './utils/providers';

const INITIAL_ELEMENTS: ElementItem[] = [
  { id: 'fire', emoji: '🔥', name: 'Fire', description: 'Heat and combustion.', flavorText: 'The primordial spark.' },
  { id: 'water', emoji: '💧', name: 'Water', description: 'Liquid life.', flavorText: 'Flows through everything.' },
  { id: 'earth', emoji: '🌍', name: 'Earth', description: 'Solid foundation.', flavorText: 'Terra firma.' },
  { id: 'air', emoji: '💨', name: 'Air', description: 'Gaseous atmosphere.', flavorText: 'The winds of change.' },
  // Expanded basic elements to facilitate crafting
  { id: 'sun', emoji: '☀️', name: 'Sun', description: 'Celestial energy.', flavorText: 'Praise the sun!' },
  { id: 'stone', emoji: '🪨', name: 'Stone', description: 'Raw mineral.', flavorText: 'Hard as a rock.' },
  { id: 'plant', emoji: '🌱', name: 'Plant', description: 'Flora.', flavorText: 'Life finds a way.' },
  { id: 'metal', emoji: '🔩', name: 'Metal', description: 'Refined material.', flavorText: 'Cold and rigid.' },
];

type View = 'brew' | 'almanac' | 'settings';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentView, setCurrentView] = useState<View>('brew');

  // --- STATE ---
  const [inventory, setInventory] = useState<ElementItem[]>(() => {
    const saved = localStorage.getItem('alchemy_inventory');
    return saved ? JSON.parse(saved) : INITIAL_ELEMENTS;
  });

  const [configs, setConfigs] = useState<ModelConfig[]>(() => {
    const saved = localStorage.getItem('alchemy_configs');
    return saved ? JSON.parse(saved) : [DEFAULT_CONFIG];
  });

  const [activeConfigId, setActiveConfigId] = useState<string>(() => {
    return localStorage.getItem('alchemy_active_config') || DEFAULT_CONFIG.id;
  });

  const [selectedItems, setSelectedItems] = useState<ElementItem[]>([]);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [lastDiscovery, setLastDiscovery] = useState<AlchemyResponse | null>(null);
  
  // Library search state
  const [librarySearchTerm, setLibrarySearchTerm] = useState('');
  
  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem('alchemy_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('alchemy_configs', JSON.stringify(configs));
  }, [configs]);

  useEffect(() => {
    localStorage.setItem('alchemy_active_config', activeConfigId);
  }, [activeConfigId]);

  const activeConfig = configs.find(c => c.id === activeConfigId) || configs[0];
  const inventoryRef = useRef<HTMLDivElement>(null);

  // --- HANDLERS ---

  const handleSelect = (item: ElementItem) => {
    if (gameState === GameState.BREWING) return;

    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      if (selectedItems.length < 2) {
        setSelectedItems(prev => [...prev, item]);
      } else {
        setSelectedItems(prev => [prev[1], item]);
      }
    }
  };

  const handleRemoveFromCauldron = (item: ElementItem) => {
    if (gameState === GameState.BREWING) return;
    setSelectedItems(prev => prev.filter(i => i.id !== item.id));
  };

  const handleMix = async () => {
    if (selectedItems.length !== 2) return;
    
    setGameState(GameState.BREWING);
    setLastDiscovery(null);

    const [itemA, itemB] = selectedItems;

    try {
      const result = await combineElements(itemA.name, itemB.name, activeConfig, lang);
      
      setLastDiscovery(result);
      
      if (result.isLogical) {
        // Check duplication by name (case insensitive)
        const exists = inventory.find(i => i.name.toLowerCase() === result.name.toLowerCase());
        
        if (!exists) {
          const newElement: ElementItem = {
            id: crypto.randomUUID(),
            emoji: result.emoji,
            name: result.name,
            description: result.description,
            isNew: true,
            discoveredAt: Date.now(),
            flavorText: result.flavorText,
            parents: [itemA.id, itemB.id]
          };
          setInventory(prev => [newElement, ...prev]);
        }
      }
      
      setGameState(GameState.RESULT);

    } catch (error) {
      console.error("Game Error", error);
      setGameState(GameState.ERROR);
    }
  };

  const resetSelection = () => {
    setSelectedItems([]);
    setGameState(GameState.IDLE);
    setLastDiscovery(null);
  };

  const clearSave = () => {
    if (confirm(getText(lang, 'resetConfirm'))) {
      setInventory(INITIAL_ELEMENTS);
      resetSelection();
    }
  };

  // --- EXPORT / IMPORT ---

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(inventory));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `emoji-alchemist-save-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsed = JSON.parse(e.target.result as string);
            // Basic validation
            if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].emoji && parsed[0].name) {
              setInventory(parsed);
              resetSelection();
              alert(getText(lang, 'importSuccess'));
            } else {
              alert(getText(lang, 'importError'));
            }
          } catch (error) {
            console.error("Import error", error);
            alert(getText(lang, 'importError'));
          }
        }
      };
    }
    // Reset input so same file can be selected again
    if (event.target) event.target.value = '';
  };

  // Filter inventory based on search term (Prefix match)
  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().startsWith(librarySearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-6 max-w-5xl mx-auto relative z-10">
      
      {/* Header */}
      <header className="w-full flex justify-between items-end mb-8 relative z-20">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-white drop-shadow-[0_2px_10px_rgba(168,85,247,0.5)]">
            {getText(lang, 'title')}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-purple-200 border border-white/5">
              {activeConfig.name}
            </span>
            <p className="text-slate-400 text-xs md:text-sm">
              {getText(lang, 'discovered')}: <span className="text-white font-bold">{inventory.length}</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setLang(prev => prev === 'en' ? 'zh' : 'en')}
            className="w-10 h-10 rounded-full bg-slate-800/50 backdrop-blur border border-white/10 hover:bg-slate-700 flex items-center justify-center transition-all text-xl"
          >
            {lang === 'en' ? '🇨🇳' : '🇺🇸'}
          </button>
          
          <button 
            onClick={() => setCurrentView('settings')}
            className="w-10 h-10 rounded-full bg-slate-800/50 backdrop-blur border border-white/10 hover:bg-slate-700 hover:text-purple-400 flex items-center justify-center transition-all"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Container */}
      {currentView === 'settings' ? (
        <Settings 
          configs={configs}
          activeConfigId={activeConfigId}
          onSaveConfigs={setConfigs}
          onSelectConfig={setActiveConfigId}
          lang={lang}
          onClose={() => setCurrentView('brew')}
        />
      ) : (
        <>
          {/* Tabs */}
          <div className="w-full flex justify-center mb-8 sticky top-4 z-30">
            <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-white/10 shadow-lg">
              <button
                onClick={() => setCurrentView('brew')}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  currentView === 'brew' 
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {getText(lang, 'tabBrew')}
              </button>
              <button
                onClick={() => setCurrentView('almanac')}
                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  currentView === 'almanac' 
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {getText(lang, 'tabAlmanac')}
              </button>
            </div>
          </div>

          {/* Views */}
          <main className="w-full flex-1 flex flex-col gap-6 relative">
            
            {currentView === 'brew' && (
              <>
                <section className="glass-panel rounded-[2rem] p-1 shadow-2xl bg-slate-900/60 ring-1 ring-white/10">
                  <div className="bg-gradient-to-b from-white/5 to-transparent rounded-[1.8rem] p-6">
                    <Cauldron 
                      selectedItems={selectedItems}
                      onRemoveItem={handleRemoveFromCauldron}
                      onMix={handleMix}
                      isBrewing={gameState === GameState.BREWING}
                    />

                    {gameState === GameState.RESULT && lastDiscovery && (
                      <div className="mt-8 mx-auto max-w-md p-6 rounded-2xl bg-black/40 border border-white/10 animate-fade-in text-center backdrop-blur-sm relative overflow-hidden">
                         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
                        <div className="flex flex-col items-center gap-3">
                          <span className="text-6xl animate-float drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{lastDiscovery.emoji}</span>
                          <h2 className="text-3xl font-extrabold text-white tracking-tight">{lastDiscovery.name}</h2>
                          <p className="text-purple-200 italic font-medium leading-relaxed">"{lastDiscovery.flavorText}"</p>
                          
                          {!lastDiscovery.isLogical && (
                            <span className="text-red-400 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold border border-red-500/30 px-2 py-1 rounded">
                              {getText(lang, 'logicFailure')}
                            </span>
                          )}
                          
                          {inventory.find(i => i.name.toLowerCase() === lastDiscovery.name.toLowerCase()) && lastDiscovery.isLogical && (
                            <span className="text-blue-300 text-[10px] mt-2 uppercase tracking-[0.2em] font-bold border border-blue-400/30 px-2 py-1 rounded">
                              {getText(lang, 'alreadyDiscovered')}
                            </span>
                          )}

                          <button 
                            onClick={resetSelection}
                            className="mt-6 px-8 py-3 bg-white text-slate-900 rounded-full text-sm font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
                          >
                            {getText(lang, 'brewAgain')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="flex-1 min-h-[400px]">
                  <div className="flex items-center justify-between mb-4 px-2 gap-4">
                    <h2 className="text-lg font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap hidden md:block">
                      {getText(lang, 'library')}
                    </h2>
                    
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-xs ml-auto md:ml-0">
                      <input 
                        type="text" 
                        value={librarySearchTerm}
                        onChange={(e) => setLibrarySearchTerm(e.target.value)}
                        placeholder={getText(lang, 'search')}
                        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-slate-500"
                      />
                      {librarySearchTerm && (
                        <button 
                          onClick={() => setLibrarySearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="text-xs font-mono text-slate-500 whitespace-nowrap hidden sm:block">
                      {getText(lang, 'tapToSelect')}
                    </div>
                  </div>
                  
                  <div 
                    ref={inventoryRef}
                    className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 p-4 bg-black/20 rounded-3xl overflow-y-auto max-h-[50vh] border border-white/5 shadow-inner"
                  >
                    {filteredInventory.map((item) => {
                      const isSelected = !!selectedItems.find(s => s.id === item.id);
                      return (
                        <div key={item.id} className="flex justify-center">
                          <ElementCard 
                            item={item} 
                            onClick={handleSelect} 
                            isSelected={isSelected}
                            size="sm"
                            disabled={gameState === GameState.BREWING}
                          />
                        </div>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-500">
                        No elements found starting with "{librarySearchTerm}"
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {currentView === 'almanac' && (
              <section className="glass-panel rounded-[2rem] p-6 shadow-2xl flex-1 flex flex-col min-h-[70vh] bg-slate-900/60 border border-white/10">
                <Almanac inventory={inventory} lang={lang} onClose={() => {}} />
              </section>
            )}

          </main>
        </>
      )}
      
      {/* Footer Actions */}
      {currentView !== 'settings' && (
         <div className="mt-12 mb-8 flex justify-center gap-6">
            <button 
              onClick={handleExport}
              className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <span className="text-base">⬇️</span> {getText(lang, 'exportData')}
            </button>

            <button 
              onClick={handleImportClick}
              className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <span className="text-base">⬆️</span> {getText(lang, 'importData')}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportFile} 
              accept=".json" 
              className="hidden" 
            />

             <button 
              onClick={clearSave}
              className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors flex items-center gap-1 ml-4"
            >
              <span className="text-base">🗑️</span> {getText(lang, 'reset')}
            </button>
         </div>
      )}
    </div>
  );
}