import React from 'react';
import { GameHistory } from '../types';
import { getNumberColor } from '../constants';

interface StatsPanelProps {
  history: GameHistory[];
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ history }) => {
  // Calculate quick stats
  const redCount = history.filter(h => h.color === 'red').length;
  const blackCount = history.filter(h => h.color === 'black').length;
  const total = Math.max(1, history.length);
  
  const redPct = Math.round((redCount / total) * 100);
  const blackPct = Math.round((blackCount / total) * 100);
  const greenPct = 100 - redPct - blackPct;

  return (
    <div className="bg-felt-800 border-t border-white/10 p-4">
      <div className="flex flex-col md:flex-row items-center justify-between max-w-4xl mx-auto gap-4">
        
        {/* Last Numbers */}
        <div className="flex items-center space-x-2 overflow-x-auto max-w-full scrollbar-hide">
          <span className="text-gray-400 text-xs uppercase font-bold mr-2">History:</span>
          {history.slice(0, 10).map((h, idx) => (
            <div 
              key={idx}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm border border-white/10 shrink-0
                ${h.color === 'red' ? 'bg-red-600' : h.color === 'black' ? 'bg-gray-900' : 'bg-green-600'}
              `}
            >
              {h.number}
            </div>
          ))}
        </div>

        {/* Hot/Cold Bar */}
        <div className="flex items-center space-x-1 w-full md:w-64 h-4 bg-gray-900 rounded-full overflow-hidden border border-white/10">
           <div className="h-full bg-red-600" style={{ width: `${redPct}%` }}></div>
           <div className="h-full bg-green-500" style={{ width: `${greenPct}%` }}></div>
           <div className="h-full bg-gray-600" style={{ width: `${blackPct}%` }}></div>
        </div>

      </div>
    </div>
  );
};