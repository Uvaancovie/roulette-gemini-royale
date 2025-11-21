import React from 'react';

interface HistoryEntry {
  id: number;
  spinNumber: number;
  winningNumber: number;
  winningColor: 'red' | 'black' | 'green';
  totalBet: number;
  totalWon: number;
  netResult: number;
  timestamp: string;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50 rounded-t-xl">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>📜</span> Session History
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors">
            &times;
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-0 scrollbar-hide">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <div className="text-4xl mb-2">🎲</div>
              <p>No spins yet. Place your bets!</p>
            </div>
          ) : (
            <table className="w-full text-xs md:text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-gray-950 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold text-center">Result</th>
                  <th className="px-4 py-3 font-semibold text-right">Bet</th>
                  <th className="px-4 py-3 font-semibold text-right">Win</th>
                  <th className="px-4 py-3 font-semibold text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5 transition-colors even:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-gray-500">{entry.timestamp}</td>
                    <td className="px-4 py-3 flex justify-center">
                       <span className={`
                        inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-lg border border-white/10
                        ${entry.winningColor === 'red' ? 'bg-gradient-to-br from-red-500 to-red-700 text-white' : 
                          entry.winningColor === 'black' ? 'bg-gradient-to-br from-gray-800 to-black text-white' : 
                          'bg-gradient-to-br from-green-500 to-green-700 text-white'}
                      `}>
                        {entry.winningNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-right font-mono">${entry.totalBet}</td>
                    <td className="px-4 py-3 text-yellow-500 font-bold text-right font-mono">${entry.totalWon}</td>
                    <td className={`px-4 py-3 text-right font-bold font-mono ${entry.netResult >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.netResult >= 0 ? '+' : ''}{entry.netResult}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="p-3 border-t border-gray-700 bg-gray-800/30 rounded-b-xl text-center">
          <p className="text-xs text-gray-500">
            Total Spins: <span className="text-white font-bold">{history.length}</span> | 
            Net Profit: <span className={`${history.reduce((acc, curr) => acc + curr.netResult, 0) >= 0 ? 'text-green-400' : 'text-red-400'} font-bold`}>
              ${history.reduce((acc, curr) => acc + curr.netResult, 0)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};