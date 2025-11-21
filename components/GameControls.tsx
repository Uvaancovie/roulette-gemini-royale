import React from 'react';

interface GameControlsProps {
  onSpin: () => void;
  onClear: () => void;
  onUndo: () => void;
  onDouble: () => void;
  onRebet: () => void;
  isSpinning: boolean;
  hasBets: boolean;
  canRebet: boolean;
  totalBet: number;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onSpin,
  onClear,
  onUndo,
  onDouble,
  onRebet,
  isSpinning,
  hasBets,
  canRebet,
  totalBet
}) => {
  const baseBtn = "px-3 py-2 md:px-4 rounded-lg font-bold text-xs md:text-sm uppercase tracking-wider transition-all transform active:scale-95 border border-white/10 shadow-lg backdrop-blur-sm flex-1 md:flex-none whitespace-nowrap";
  
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 p-3 md:p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Mobile Top Row: Bet Info */}
        <div className="md:hidden w-full flex justify-between items-center bg-black/30 p-2 rounded-lg border border-white/5 mb-2">
           <span className="text-xs text-yellow-500 uppercase tracking-widest">Total Bet</span>
           <span className="text-xl font-mono font-bold text-white drop-shadow-glow">${totalBet.toLocaleString()}</span>
        </div>

        {/* Left Controls (Undo/Clear) */}
        <div className="flex w-full md:w-auto gap-2">
           <button 
            onClick={onUndo}
            disabled={isSpinning || !hasBets}
            className={`${baseBtn} bg-gray-700 text-gray-200 hover:bg-gray-600 disabled:opacity-30`}
          >
            Undo
          </button>
          <button 
            onClick={onClear}
            disabled={isSpinning || !hasBets}
            className={`${baseBtn} bg-red-900/60 text-red-200 hover:bg-red-800/80 disabled:opacity-30`}
          >
            Clear
          </button>
        </div>

        {/* Desktop Middle Stats */}
        <div className="hidden md:flex flex-col items-center justify-center mx-4 min-w-[120px]">
          <div className="text-[10px] text-yellow-500 uppercase tracking-widest mb-1">Total Bet</div>
          <div className="text-2xl font-mono font-bold text-white drop-shadow-glow">
            ${totalBet.toLocaleString()}
          </div>
        </div>

        {/* Right Controls (Multipliers + Spin) */}
        <div className="flex w-full md:w-auto gap-2 items-center">
          <div className="flex flex-1 md:flex-none gap-2">
            <button 
              onClick={onDouble}
              disabled={isSpinning || !hasBets}
              className={`${baseBtn} bg-blue-900/60 text-blue-200 hover:bg-blue-800/80 disabled:opacity-30`}
            >
              x2
            </button>
            <button 
              onClick={onRebet}
              disabled={isSpinning || !canRebet || hasBets}
              className={`${baseBtn} bg-purple-900/60 text-purple-200 hover:bg-purple-800/80 disabled:opacity-30`}
            >
              Rebet
            </button>
          </div>
          
          <button 
            onClick={onSpin}
            disabled={isSpinning || (!hasBets && !canRebet)}
            className={`
              flex-1 md:flex-none px-6 py-2 md:py-3 rounded-full font-black text-base md:text-lg uppercase tracking-widest shadow-xl transition-all
              ${isSpinning 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed border border-gray-500' 
                : 'bg-gradient-to-b from-yellow-400 to-yellow-600 text-black border-2 border-yellow-300 hover:from-yellow-300 hover:to-yellow-500 hover:scale-105 hover:shadow-yellow-500/50'}
            `}
          >
            {isSpinning ? '...' : 'SPIN'}
          </button>
        </div>
      </div>
    </div>
  );
};