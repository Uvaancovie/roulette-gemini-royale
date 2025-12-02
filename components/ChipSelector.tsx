import React from 'react';
import { ChipValue } from '../types';
import { CHIP_VALUES } from '../constants';

interface ChipSelectorProps {
  selectedChip: ChipValue;
  onSelect: (value: ChipValue) => void;
}

export const ChipSelector: React.FC<ChipSelectorProps> = ({ selectedChip, onSelect }) => {
  const getChipColor = (val: number) => {
    switch(val) {
      case 1: return 'from-gray-100 via-gray-200 to-gray-300 text-gray-900 border-gray-400 shadow-gray-500/50';
      case 5: return 'from-red-500 via-red-600 to-red-700 text-white border-red-800 shadow-red-600/50';
      case 25: return 'from-green-500 via-green-600 to-green-700 text-white border-green-800 shadow-green-600/50';
      case 100: return 'from-gray-900 via-black to-gray-900 text-yellow-400 border-yellow-500 shadow-yellow-500/50';
      case 500: return 'from-purple-500 via-purple-600 to-purple-700 text-white border-purple-800 shadow-purple-600/50';
      default: return 'from-blue-500 via-blue-600 to-blue-700';
    }
  };

  return (
    <div className="relative flex flex-wrap justify-center gap-2 md:gap-3 py-4 px-4 md:px-6 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl max-w-full">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500/50 rounded-tl-xl"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/50 rounded-tr-xl"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/50 rounded-bl-xl"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500/50 rounded-br-xl"></div>
      
      {CHIP_VALUES.map((val, idx) => {
        const isSelected = selectedChip === val;
        return (
          <button
            key={val}
            onClick={() => onSelect(val as ChipValue)}
            className={`
              relative group
              w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 
              rounded-full flex items-center justify-center font-bold 
              transition-all duration-300 ease-out
              border-4 bg-gradient-to-br ${getChipColor(val)}
              ${isSelected 
                ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-black/50 scale-110 shadow-2xl z-20 brightness-110' 
                : 'opacity-90 hover:opacity-100 hover:scale-105 hover:shadow-xl hover-lift'
              }
              ripple
            `}
            style={{
              animationDelay: `${idx * 0.05}s`,
              animation: isSelected ? 'none' : ''
            }}
          >
            {/* Inner circle glow */}
            <div className={`absolute inset-1 rounded-full border-2 ${isSelected ? 'border-white/40' : 'border-white/20'}`}></div>
            
            {/* Center dot pattern */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-1 h-1 rounded-full bg-white/30 ${isSelected ? 'animate-pulse' : ''}`}></div>
            </div>
            
            {/* Chip value */}
            <span className={`relative z-10 text-xs md:text-sm lg:text-base font-black drop-shadow-lg ${isSelected ? 'glow-text' : ''}`}>
              R{val}
            </span>
            
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            
            {/* Hover glow effect */}
            <div className={`absolute inset-0 rounded-full bg-white/0 group-hover:bg-white/10 transition-all duration-300 ${isSelected ? 'bg-white/10' : ''}`}></div>
          </button>
        );
      })}
    </div>
  );
};