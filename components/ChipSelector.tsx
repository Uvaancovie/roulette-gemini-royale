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
      case 1: return 'bg-gray-200 text-gray-800 border-gray-400';
      case 5: return 'bg-red-600 text-white border-red-800';
      case 25: return 'bg-green-600 text-white border-green-800';
      case 100: return 'bg-black text-white border-yellow-500';
      case 500: return 'bg-purple-600 text-white border-purple-800';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="flex space-x-3 justify-center py-4 bg-felt-900/50 rounded-lg">
      {CHIP_VALUES.map((val) => (
        <button
          key={val}
          onClick={() => onSelect(val as ChipValue)}
          className={`
            relative w-12 h-12 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform transform hover:scale-110
            border-4 border-dashed 
            ${getChipColor(val)}
            ${selectedChip === val ? 'ring-4 ring-yellow-400 scale-110 z-10' : 'opacity-80 hover:opacity-100'}
          `}
        >
          <div className="absolute inset-0 rounded-full border-2 border-white/20"></div>
          <span className="text-xs drop-shadow-md">{val}</span>
        </button>
      ))}
    </div>
  );
};