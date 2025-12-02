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
  freeSpins?: number;
  useFreeSpins?: boolean;
  onToggleFreeSpins?: () => void;
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
  totalBet,
  freeSpins = 0,
  useFreeSpins = false,
  onToggleFreeSpins
}) => {
  const baseBtn = "px-3 py-2.5 md:px-4 md:py-2 lg:px-5 lg:py-3 rounded-xl font-bold text-xs md:text-sm uppercase tracking-wider transition-all duration-200 transform active:scale-95 border-2 shadow-lg backdrop-blur-sm hover-lift ripple relative overflow-hidden";
  
  return (
    <div className="w-full max-w-5xl mx-auto p-2 md:p-4 lg:p-5 rounded-2xl bg-gradient-to-b from-black/70 to-black/50 border-2 border-white/10 backdrop-blur-md shadow-2xl relative">
      {/* Decorative top border glow */}
      <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent"></div>
      
      {/* Mobile Top Row: Bet Info */}
      <div className="md:hidden w-full flex justify-between items-center bg-gradient-to-r from-black/50 via-black/70 to-black/50 p-2 rounded-xl border-2 border-yellow-500/20 mb-2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-yellow-400/10 to-yellow-500/5 shimmer"></div>
        <div className="relative z-10 flex justify-between items-center w-full">
          <span className="text-xs text-yellow-400 uppercase tracking-widest font-bold">Total Bet</span>
          <span className="text-xl font-mono font-black text-gray-300">R{totalBet.toLocaleString()}</span>
        </div>
      </div>

      {/* Main Controls Grid - Responsive Layout */}
      <div className="grid grid-cols-12 gap-1.5 md:gap-2 lg:gap-3 items-center">
        
        {/* Left Controls (Undo/Clear) - 4 cols mobile, 2 cols desktop */}
        <div className="col-span-4 md:col-span-2 lg:col-span-2 flex gap-1.5 md:gap-2 lg:gap-3">
          <button 
            onClick={onUndo}
            disabled={isSpinning || !hasBets}
            className={`${baseBtn} flex-1 bg-gradient-to-br from-gray-700 to-gray-800 text-gray-100 hover:from-gray-600 hover:to-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border-gray-600 hover:border-gray-500 hover:shadow-gray-500/30`}
            title="Undo last bet"
          >
            <span className="mr-0.5 md:mr-1">↩️</span> <span className="hidden sm:inline">Undo</span>
          </button>
          <button 
            onClick={onClear}
            disabled={isSpinning || !hasBets}
            className={`${baseBtn} flex-1 bg-gradient-to-br from-red-700 to-red-900 text-red-100 hover:from-red-600 hover:to-red-800 disabled:opacity-30 disabled:cursor-not-allowed border-red-700 hover:border-red-500 hover:shadow-red-500/30`}
            title="Clear all bets"
          >
            <span className="mr-0.5 md:mr-1">🗑️</span> <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Desktop Middle Stats - 3 cols desktop, hidden mobile */}
        <div className="hidden md:flex col-span-3 lg:col-span-2 flex-col items-center justify-center">
          <div className="relative bg-black/40 px-3 lg:px-6 py-1.5 lg:py-3 rounded-xl border-2 border-yellow-500/30 backdrop-blur-sm w-full">
            <div className="text-[9px] lg:text-[10px] text-yellow-400 uppercase tracking-wider lg:tracking-[0.2em] mb-0.5 lg:mb-1 font-bold text-center">Bet</div>
            <div className="text-lg lg:text-3xl font-mono font-black text-gray-300 text-center truncate">
              R{totalBet.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Multipliers (Double/Rebet) - 4 cols mobile, 2 cols desktop */}
        <div className="col-span-4 md:col-span-2 lg:col-span-2 flex gap-1.5 md:gap-2 lg:gap-3">
          <button 
            onClick={onDouble}
            disabled={isSpinning || !hasBets}
            className={`${baseBtn} flex-1 bg-gradient-to-br from-blue-700 to-blue-900 text-blue-100 hover:from-blue-600 hover:to-blue-800 disabled:opacity-30 disabled:cursor-not-allowed border-blue-700 hover:border-blue-500 hover:shadow-blue-500/30`}
            title="Double all bets"
          >
            <span className="mr-0.5 md:mr-1">✕2</span> <span className="hidden sm:inline">Double</span>
          </button>
          <button 
            onClick={onRebet}
            disabled={isSpinning || !canRebet || hasBets}
            className={`${baseBtn} flex-1 bg-gradient-to-br from-purple-700 to-purple-900 text-purple-100 hover:from-purple-600 hover:to-purple-800 disabled:opacity-30 disabled:cursor-not-allowed border-purple-700 hover:border-purple-500 hover:shadow-purple-500/30`}
            title="Repeat previous bets"
          >
            <span className="mr-0.5 md:mr-1">🔄</span> <span className="hidden sm:inline">Rebet</span>
          </button>
        </div>

        {/* Free Spins + SPIN Button - Full width bottom row on mobile, right side on desktop */}
        <div className="col-span-12 md:col-span-5 lg:col-span-6 flex gap-1.5 md:gap-2 lg:gap-3 items-center">
          {freeSpins > 0 && onToggleFreeSpins && (
            <button
              onClick={onToggleFreeSpins}
              className={`
                px-2 md:px-3 lg:px-4 py-2 md:py-2 lg:py-3 rounded-xl text-xs md:text-sm lg:text-base font-black transition-all duration-200 border-2 uppercase tracking-wide
                transform hover:scale-105 active:scale-95 ripple whitespace-nowrap
                ${useFreeSpins 
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black border-yellow-300 shadow-lg shadow-yellow-500/50 pulse-glow' 
                  : 'bg-black/40 text-yellow-400 border-yellow-500/50 hover:bg-yellow-500/20 hover:border-yellow-400'}
              `}
              title={useFreeSpins ? 'Using free spin!' : 'Click to use free spin'}
            >
              <span className="text-base md:text-lg">🎰</span>
              <span className="text-xs md:text-sm font-mono font-bold ml-1">{freeSpins}</span>
            </button>
          )}
          
          {/* SPIN Button */}
          <button 
            onClick={onSpin}
            disabled={!hasBets || isSpinning}
            className={`
              relative flex-1 px-3 py-2.5 md:px-4 md:py-2 lg:px-8 lg:py-3 rounded-xl font-black text-sm md:text-base lg:text-xl uppercase tracking-widest
              transition-all duration-300 transform border-4 whitespace-nowrap
              ${hasBets && !isSpinning
                ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-black border-yellow-300 shadow-2xl shadow-yellow-500/50 hover:scale-105 active:scale-95 pulse-glow hover:shadow-yellow-500/70 cursor-pointer' 
                : 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-400 border-gray-600 opacity-50 cursor-not-allowed'
              }
              ripple overflow-hidden
            `}
          >
            {/* Shimmer effect when ready */}
            {hasBets && !isSpinning && (
              <div className="absolute inset-0 shimmer"></div>
            )}
            
            {/* Button content */}
            <span className={`relative z-10 flex items-center justify-center gap-1 md:gap-1.5 lg:gap-2 ${hasBets && !isSpinning ? 'glow-text' : ''}`}>
              {isSpinning ? (
                <>
                  <span className="animate-spin text-base md:text-lg lg:text-xl">🎡</span>
                  <span className="hidden lg:inline">SPINNING...</span>
                  <span className="lg:hidden">...</span>
                </>
              ) : (
                <>
                  <span className="text-base md:text-lg lg:text-2xl">🎲</span>
                  <span>SPIN</span>
                  {useFreeSpins && <span className="text-xs lg:text-sm">(FREE)</span>}
                </>
              )}
            </span>
            
            {/* Pulse rings when active */}
            {hasBets && !isSpinning && (
              <>
                <div className="absolute inset-0 rounded-xl border-2 border-yellow-300/50 animate-ping"></div>
                <div className="absolute inset-0 rounded-xl border-2 border-yellow-300/30 animate-pulse"></div>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};