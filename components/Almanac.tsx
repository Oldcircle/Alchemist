import React, { useState } from 'react';
import { ElementItem, Language } from '../types';
import { getText } from '../utils/translations';
import { ElementCard } from './ElementCard';

interface AlmanacProps {
  inventory: ElementItem[];
  lang: Language;
  onClose: () => void;
}

export const Almanac: React.FC<AlmanacProps> = ({ inventory, lang, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ElementItem | null>(null);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col h-full">
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder={getText(lang, 'search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500 transition-all"
        />
      </div>

      {/* Grid */}
      {filteredInventory.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <span className="text-4xl mb-4">📜</span>
          <p>{getText(lang, 'emptyAlmanac')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto pr-2 custom-scrollbar">
          {filteredInventory.map((item) => (
            <div key={item.id} className="flex justify-center">
              <ElementCard 
                item={item} 
                onClick={setSelectedItem} 
                size="sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedItem(null)}>
          <div 
            className="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="text-8xl mb-4 animate-float">{selectedItem.emoji}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{selectedItem.name}</h2>
              <p className="text-slate-300 mb-6">{selectedItem.description}</p>
              
              <div className="w-full bg-slate-700/30 rounded-xl p-4 mb-4 text-left">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  {getText(lang, 'flavor')}
                </span>
                <p className="text-purple-300 italic text-sm">
                  {/* Since flavorText isn't in ElementItem by default for initial items, we check for it */}
                  {(selectedItem as any).flavorText || "A mysterious element forged from the void."}
                </p>
              </div>

              {selectedItem.discoveredAt && (
                <p className="text-xs text-slate-500">
                  {getText(lang, 'firstDiscovery')}: {new Date(selectedItem.discoveredAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
