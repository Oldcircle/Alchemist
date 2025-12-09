
import React from 'react';
import { ElementItem } from '../types';

interface ElementCardProps {
  item: ElementItem;
  onClick: (item: ElementItem) => void;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const ElementCard: React.FC<ElementCardProps> = ({ 
  item, 
  onClick, 
  isSelected = false, 
  size = 'md',
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16 md:w-20 md:h-20 text-3xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl',
  };

  return (
    <button
      onClick={() => !disabled && onClick(item)}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl transition-all duration-300 transform
        ${sizeClasses[size]}
        ${isSelected 
          ? 'bg-gradient-to-br from-purple-600 to-indigo-700 ring-2 ring-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-110 z-10' 
          : 'bg-slate-800/60 border border-white/5 hover:bg-slate-700/80 hover:scale-105 hover:border-white/20 shadow-lg backdrop-blur-sm'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
        group
      `}
    >
      <div className="filter drop-shadow-lg select-none transform group-hover:scale-110 transition-transform duration-200">
        {item.emoji}
      </div>
      
      {size !== 'sm' && (
        <span className={`
          mt-2 text-xs font-bold truncate w-full px-2 text-center tracking-wide
          ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}
        `}>
          {item.name}
        </span>
      )}
      
      {/* New Badge */}
      {item.isNew && (
        <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-yellow-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-bounce border border-yellow-200">
          NEW
        </span>
      )}
    </button>
  );
};
