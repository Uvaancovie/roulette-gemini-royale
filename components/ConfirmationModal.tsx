import React from 'react';
import { BetType } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  betDetails: { type: BetType; target: number | string; amount: number } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, betDetails, onConfirm, onCancel }) => {
  if (!isOpen || !betDetails) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-xs md:max-w-sm p-6 shadow-2xl transform scale-100" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>⚠️</span> Confirm Bet
        </h3>
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Bet Type</span>
                <span className="text-gray-200 font-mono">{betDetails.type}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-400">Target</span>
                <span className="text-yellow-400 font-bold">{betDetails.target}</span>
            </div>
             <div className="flex justify-between border-t border-gray-700 pt-2 mt-2 items-end">
                <span className="text-gray-400">Wager</span>
                <span className="text-green-400 font-bold text-xl">${betDetails.amount}</span>
            </div>
        </div>
        
        <div className="flex gap-3">
            <button 
                onClick={onCancel}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm}
                className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white text-sm font-bold transition-all shadow-lg shadow-green-900/20"
            >
                Confirm Place
            </button>
        </div>
      </div>
    </div>
  );
};