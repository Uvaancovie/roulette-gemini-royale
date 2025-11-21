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

  // Helper to render a chip if bet exists
  const renderChip = (amount: number) => {
    if (amount === 0) return null;
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 animate-bounce-short">
        <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 border-2 border-dashed border-white text-white text-[10px] md:text-xs font-bold flex items-center justify-center shadow-black/50 shadow-lg transform -translate-y-1">
          {amount >= 1000 ? (amount/1000).toFixed(1) + 'k' : amount}
        </div>
      </div>
    );
  };

  const getCellClass = (num: number, isZero = false) => {
     const isHighlighted = highlightedNumbers.has(num);
     const base = "relative flex items-center justify-center font-bold text-white cursor-pointer transition-all duration-200 select-none h-10 md:h-14 border border-felt-800/30";
     
     let bg = '';
     if (isZero) bg = 'bg-gradient-to-br from-green-600 to-green-800';
     else if (RED_NUMBERS.has(num)) bg = 'bg-gradient-to-br from-red-600 to-red-800';
     else bg = 'bg-gradient-to-br from-gray-800 to-black';

     if (isHighlighted) {
       return `${base} ${bg} brightness-150 ring-inset ring-2 ring-yellow-400 z-10 scale-[1.02] shadow-[0_0_15px_rgba(250,204,21,0.5)]`;
     }
     
     return `${base} ${bg} hover:brightness-110 opacity-90 hover:opacity-100`;
  };

  const getLabelClass = (isActive: boolean) => {
     const base = "relative flex items-center justify-center font-bold text-[10px] md:text-sm text-white cursor-pointer transition-all duration-200 border border-felt-800/30 select-none h-8 md:h-12 uppercase tracking-tighter md:tracking-normal";
     if (isActive) {
         return `${base} bg-white/20 ring-inset ring-2 ring-yellow-400 z-10`;
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
    <div className="overflow-x-auto pb-8 pt-2 w-full flex justify-start md:justify-center scrollbar-hide px-4">
      <div className="min-w-[340px] md:min-w-[600px] max-w-4xl bg-felt-900 border-4 md:border-8 border-yellow-900/50 rounded-xl shadow-2xl p-1 md:p-3 relative shrink-0">
        {/* Felt Texture Overlay */}
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/felt.png')] pointer-events-none rounded-lg"></div>
        
        <div className="flex relative z-10">
          {/* 0 (Zero) */}
          <div 
            className={`${getCellClass(0, true)} w-8 md:w-16 rounded-l-md border-r-2 border-white/10`}
            style={{ height: 'auto' }} // Spans all rows
            onClick={() => onPlaceBet(BetType.STRAIGHT, 0, 35)}
            onMouseEnter={() => handleEnter(BetType.STRAIGHT, 0)}
            onMouseLeave={handleLeave}
          >
            <span className="-rotate-90 text-sm md:text-base">0</span>
            {renderChip(getBetAmount(BetType.STRAIGHT, 0))}
          </div>

          <div className="flex-1 flex flex-col">
            {/* Numbers Grid - Top Row (3, 6, 9...) actually appears top on board */}
            <div className="grid grid-cols-12 grid-rows-3">
              {/* Row 3 (3, 6, 9...) */}
              {[3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].map(n => (
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