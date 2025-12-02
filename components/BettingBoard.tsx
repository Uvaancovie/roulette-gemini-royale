import React from 'react';
import { BetType, ChipValue, PlacedBet } from '../types';
import { RED_NUMBERS } from '../constants';

interface BettingBoardProps {
  onPlaceBet: (type: BetType, target: number | string, payout: number) => void;
  onHoverBet: (type: BetType | null, target: number | string | null) => void;
  highlightedNumbers: Set<number>;
  bets: PlacedBet[];
  selectedChip: ChipValue;
}

export const BettingBoard: React.FC<BettingBoardProps> = ({ 
  onPlaceBet, 
  onHoverBet,
  highlightedNumbers,
  bets, 
  selectedChip 
}) => {

  // Helper to count chips on a spot
  const getBetAmount = (type: BetType, target: number | string) => {
    return bets
      .filter(b => b.type === type && b.target === target)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  // Helper to render a chip if bet exists - ENHANCED
  const renderChip = (amount: number) => {
    if (amount === 0) return null;
    const displayAmount = amount >= 1000 ? (amount/1000).toFixed(1) + 'K' : amount;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 chip-drop">
        <div className="relative">
          {/* Chip glow */}
          <div className="absolute inset-0 bg-yellow-400/30 blur-md rounded-full scale-125"></div>
          {/* Chip body */}
          <div className="relative w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 border-3 border-yellow-200 text-black text-[10px] md:text-xs lg:text-sm font-black flex items-center justify-center shadow-2xl shadow-yellow-600/50 transform hover:scale-110 transition-transform">
            {/* Inner ring */}
            <div className="absolute inset-1 rounded-full border-2 border-yellow-100/40"></div>
            {/* Amount */}
            <span className="relative z-10 drop-shadow-sm">R{displayAmount}</span>
          </div>
        </div>
      </div>
    );
  };

  const getCellClass = (num: number, isZero = false) => {
     const isHighlighted = highlightedNumbers.has(num);
     const base = "relative flex items-center justify-center font-bold text-white cursor-pointer transition-all duration-200 select-none h-11 md:h-14 lg:h-16 border border-felt-800/40 hover-lift";
     
     let bg = '';
     if (isZero) bg = 'bg-gradient-to-br from-green-500 via-green-600 to-green-800';
     else if (RED_NUMBERS.has(num)) bg = 'bg-gradient-to-br from-red-500 via-red-600 to-red-800';
     else bg = 'bg-gradient-to-br from-gray-700 via-gray-900 to-black';

     if (isHighlighted) {
       return `${base} ${bg} brightness-150 ring-inset ring-2 md:ring-3 ring-yellow-400 z-10 scale-[1.03] shadow-[0_0_20px_rgba(250,204,21,0.6)] number-pop`;
     }
     
     return `${base} ${bg} hover:brightness-125 hover:scale-[1.02] opacity-95 hover:opacity-100 active:scale-95`;
  };

  const getLabelClass = (isActive: boolean) => {
     const base = "relative flex items-center justify-center font-bold text-[10px] md:text-sm lg:text-base text-white cursor-pointer transition-all duration-200 border border-felt-800/40 select-none h-9 md:h-12 lg:h-14 uppercase tracking-tight md:tracking-normal hover-lift";
     if (isActive) {
         return `${base} bg-gradient-to-br from-white/20 to-white/10 ring-inset ring-2 md:ring-3 ring-yellow-400 z-10 brightness-125`;
     }
     return `${base} bg-green-900/40 hover:bg-white/10`;
  };

  const handleEnter = (type: BetType, target: number | string) => {
    onHoverBet(type, target);
  };

  const handleLeave = () => {
    onHoverBet(null, null);
  };

  return (
    <div className="overflow-x-auto pb-6 pt-2 w-full flex justify-start md:justify-center scrollbar-hide px-2 md:px-4">
      <div className="min-w-[360px] sm:min-w-[420px] md:min-w-[600px] lg:min-w-[700px] max-w-5xl bg-gradient-to-br from-felt-900 via-felt-800 to-felt-900 border-4 md:border-6 lg:border-8 border-yellow-900/60 rounded-2xl shadow-2xl p-2 md:p-3 lg:p-4 relative shrink-0 hover-lift">
        {/* Felt Texture Overlay */}
        <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none rounded-xl mix-blend-multiply"></div>
        
        {/* Corner Decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-500/50"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-yellow-500/50"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-yellow-500/50"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-500/50"></div>
        
        {/* Ambient glow when hovered */}
        <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/5 transition-all duration-500 rounded-xl pointer-events-none"></div>
        
        <div className="flex relative z-10">
          {/* 0 (Zero) - Enhanced */}
          <div 
            className={`${getCellClass(0, true)} w-10 md:w-16 lg:w-20 rounded-l-xl border-r-2 border-green-400/30 shadow-inner text-lg md:text-2xl lg:text-3xl font-black`}
            style={{ height: 'auto' }} // Spans all rows
            onClick={() => onPlaceBet(BetType.STRAIGHT, 0, 35)}
            onMouseEnter={() => handleEnter(BetType.STRAIGHT, 0)}
            onMouseLeave={handleLeave}
          >
            <span className="-rotate-90 drop-shadow-lg">0</span>
            {renderChip(getBetAmount(BetType.STRAIGHT, 0))}
          </div>

          <div className="flex-1 flex flex-col">
            {/* Numbers Grid - Enhanced spacing and typography */}
            <div className="grid grid-cols-12 grid-rows-3 gap-0">
              {/* Row 3 (3, 6, 9...) */}
              {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(n => (
                <div 
                  key={n} 
                  className={`${getCellClass(n)} text-sm md:text-lg lg:text-xl font-black`}
                  onClick={() => onPlaceBet(BetType.STRAIGHT, n, 35)}
                  onMouseEnter={() => handleEnter(BetType.STRAIGHT, n)}
                  onMouseLeave={handleLeave}
                >
                  <span className="drop-shadow-md">{n}</span>
                  {renderChip(getBetAmount(BetType.STRAIGHT, n))}
                </div>
              ))}
              
              {/* Row 2 (2, 5, 8...) */}
              {[2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].map(n => (
                <div 
                  key={n} 
                  className={getCellClass(n)}
                  onClick={() => onPlaceBet(BetType.STRAIGHT, n, 35)}
                  onMouseEnter={() => handleEnter(BetType.STRAIGHT, n)}
                  onMouseLeave={handleLeave}
                >
                  {n}
                  {renderChip(getBetAmount(BetType.STRAIGHT, n))}
                </div>
              ))}
              {/* Row 1 (1, 4, 7...) */}
               {[1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].map(n => (
                <div 
                  key={n} 
                  className={getCellClass(n)}
                  onClick={() => onPlaceBet(BetType.STRAIGHT, n, 35)}
                  onMouseEnter={() => handleEnter(BetType.STRAIGHT, n)}
                  onMouseLeave={handleLeave}
                >
                  {n}
                  {renderChip(getBetAmount(BetType.STRAIGHT, n))}
                </div>
              ))}
            </div>

            {/* Dozens */}
            <div className="grid grid-cols-3 gap-0.5 mt-1">
              <div 
                className={getLabelClass(highlightedNumbers.has(1))}
                onClick={() => onPlaceBet(BetType.DOZEN_1, '1st 12', 2)}
                onMouseEnter={() => handleEnter(BetType.DOZEN_1, '1st 12')}
                onMouseLeave={handleLeave}
              >
                1st 12
                {renderChip(getBetAmount(BetType.DOZEN_1, '1st 12'))}
              </div>
              <div 
                className={getLabelClass(highlightedNumbers.has(13))}
                onClick={() => onPlaceBet(BetType.DOZEN_2, '2nd 12', 2)}
                onMouseEnter={() => handleEnter(BetType.DOZEN_2, '2nd 12')}
                onMouseLeave={handleLeave}
              >
                2nd 12
                {renderChip(getBetAmount(BetType.DOZEN_2, '2nd 12'))}
              </div>
              <div 
                className={getLabelClass(highlightedNumbers.has(25))}
                onClick={() => onPlaceBet(BetType.DOZEN_3, '3rd 12', 2)}
                onMouseEnter={() => handleEnter(BetType.DOZEN_3, '3rd 12')}
                onMouseLeave={handleLeave}
              >
                3rd 12
                {renderChip(getBetAmount(BetType.DOZEN_3, '3rd 12'))}
              </div>
            </div>

            {/* Bottom Outside Bets */}
            <div className="grid grid-cols-6 gap-0.5 mt-1">
               <div 
                className={getLabelClass(highlightedNumbers.has(1) && highlightedNumbers.has(18))}
                onClick={() => onPlaceBet(BetType.LOW, '1-18', 1)}
                onMouseEnter={() => handleEnter(BetType.LOW, '1-18')}
                onMouseLeave={handleLeave}
              >
                1-18
                {renderChip(getBetAmount(BetType.LOW, '1-18'))}
              </div>
              <div 
                className={getLabelClass(highlightedNumbers.has(2) && highlightedNumbers.has(4))}
                onClick={() => onPlaceBet(BetType.EVEN, 'EVEN', 1)}
                onMouseEnter={() => handleEnter(BetType.EVEN, 'EVEN')}
                onMouseLeave={handleLeave}
              >
                EVEN
                {renderChip(getBetAmount(BetType.EVEN, 'EVEN'))}
              </div>
              <div 
                className={`${getLabelClass(highlightedNumbers.has(1) && highlightedNumbers.has(3))} bg-red-900/60 hover:bg-red-800/80`}
                onClick={() => onPlaceBet(BetType.RED, 'RED', 1)}
                onMouseEnter={() => handleEnter(BetType.RED, 'RED')}
                onMouseLeave={handleLeave}
              >
                <div className="w-3 h-3 md:w-4 md:h-4 bg-red-600 rounded-sm rotate-45"></div>
                {renderChip(getBetAmount(BetType.RED, 'RED'))}
              </div>
              <div 
                className={`${getLabelClass(highlightedNumbers.has(2) && highlightedNumbers.has(4))} bg-black/40 hover:bg-black/60`}
                onClick={() => onPlaceBet(BetType.BLACK, 'BLACK', 1)}
                onMouseEnter={() => handleEnter(BetType.BLACK, 'BLACK')}
                onMouseLeave={handleLeave}
              >
                <div className="w-3 h-3 md:w-4 md:h-4 bg-black border border-gray-600 rounded-sm rotate-45"></div>
                {renderChip(getBetAmount(BetType.BLACK, 'BLACK'))}
              </div>
               <div 
                className={getLabelClass(highlightedNumbers.has(1) && highlightedNumbers.has(3))}
                onClick={() => onPlaceBet(BetType.ODD, 'ODD', 1)}
                onMouseEnter={() => handleEnter(BetType.ODD, 'ODD')}
                onMouseLeave={handleLeave}
              >
                ODD
                {renderChip(getBetAmount(BetType.ODD, 'ODD'))}
              </div>
              <div 
                className={getLabelClass(highlightedNumbers.has(19) && highlightedNumbers.has(36))}
                onClick={() => onPlaceBet(BetType.HIGH, '19-36', 1)}
                onMouseEnter={() => handleEnter(BetType.HIGH, '19-36')}
                onMouseLeave={handleLeave}
              >
                19-36
                {renderChip(getBetAmount(BetType.HIGH, '19-36'))}
              </div>
            </div>
          </div>

          {/* Right Columns Payouts (2 to 1) */}
          <div className="flex flex-col w-8 md:w-12 ml-1 gap-0.5">
             <div 
                className={`${getLabelClass(highlightedNumbers.has(3))} h-full`}
                onClick={() => onPlaceBet(BetType.COLUMN_3, '2to1_3', 2)}
                onMouseEnter={() => handleEnter(BetType.COLUMN_3, '2to1_3')}
                onMouseLeave={handleLeave}
              >
                2:1
                {renderChip(getBetAmount(BetType.COLUMN_3, '2to1_3'))}
              </div>
               <div 
                className={`${getLabelClass(highlightedNumbers.has(2))} h-full`}
                onClick={() => onPlaceBet(BetType.COLUMN_2, '2to1_2', 2)}
                onMouseEnter={() => handleEnter(BetType.COLUMN_2, '2to1_2')}
                onMouseLeave={handleLeave}
              >
                2:1
                {renderChip(getBetAmount(BetType.COLUMN_2, '2to1_2'))}
              </div>
               <div 
                className={`${getLabelClass(highlightedNumbers.has(1))} h-full`}
                onClick={() => onPlaceBet(BetType.COLUMN_1, '2to1_1', 2)}
                onMouseEnter={() => handleEnter(BetType.COLUMN_1, '2to1_1')}
                onMouseLeave={handleLeave}
              >
                2:1
                {renderChip(getBetAmount(BetType.COLUMN_1, '2to1_1'))}
              </div>
              {/* Spacer for alignment with dozens/bottom */}
              <div className="h-16 md:h-24"></div>
          </div>
        </div>
      </div>
    </div>
  );
};