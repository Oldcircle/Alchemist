
import React from 'react';
import { ElementItem } from '../types';
import { ElementCard } from './ElementCard';

interface CauldronProps {
  selectedItems: ElementItem[];
  onRemoveItem: (item: ElementItem) => void;
  onMix: () => void;
  isBrewing: boolean;
}

export const Cauldron: React.FC<CauldronProps> = ({ 
  selectedItems, 
  onRemoveItem, 
  onMix,
  isBrewing 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      {/* The Connecting Line with Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-slate-700/50 rounded-full -z-10 overflow-hidden">
        {isBrewing && (
          <div className="w-full h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-shimmer"></div>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 md:gap-16 min-h-[140px]">
        {/* Slot 1 */}
        <div className="relative group">
          {selectedItems[0] ? (
            <ElementCard 
              item={selectedItems[0]} 
              onClick={onRemoveItem} 
              isSelected={true}
              size="lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-700/50 bg-black/10 flex items-center justify-center text-slate-700 group-hover:border-slate-600 transition-colors">
              <span className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">+</span>
            </div>
          )}
        </div>

        {/* Mix Button / Operator */}
        <div className="z-10 relative">
          <button
            onClick={onMix}
            disabled={selectedItems.length !== 2 || isBrewing}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              text-3xl transition-all duration-300 border-4 border-slate-900
              ${selectedItems.length === 2 
                ? 'bg-white text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-pink-600 shadow-[0_0_40px_rgba(236,72,153,0.4)] hover:scale-110 active:scale-95' 
                : 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
              }
              ${isBrewing ? 'animate-spin border-t-purple-500 border-r-pink-500' : ''}
            `}
          >
            {isBrewing ? '🔮' : '⚡'}
          </button>
        </div>

        {/* Slot 2 */}
        <div className="relative group">
          {selectedItems[1] ? (
            <ElementCard 
              item={selectedItems[1]} 
              onClick={onRemoveItem} 
              isSelected={true}
              size="lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-700/50 bg-black/10 flex items-center justify-center text-slate-700 group-hover:border-slate-600 transition-colors">
              <span className="text-4xl opacity-20 group-hover:opacity-40 transition-opacity">+</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 text-center h-6">
        {isBrewing && (
          <span className="text-purple-300 font-bold animate-pulse tracking-widest text-sm uppercase">
            Consulting the Oracle...
          </span>
        )}
        {!isBrewing && selectedItems.length < 2 && (
          <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">
            Add ingredients
          </span>
        )}
        {!isBrewing && selectedItems.length === 2 && (
          <span className="text-white text-sm font-bold animate-bounce bg-purple-600/20 px-4 py-1 rounded-full border border-purple-500/30">
            Ready to Fuse
          </span>
        )}
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1s infinite linear;
        }
      `}</style>
    </div>
  );
};
