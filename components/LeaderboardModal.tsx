import React, { useState, useEffect } from 'react';

interface LeaderboardEntry {
  username: string;
  balance: number;
  totalWon: number;
  gamesPlayed: number;
  biggestWin: number;
  vipLevel: number;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string | null;
}

const VIP_BADGES = ['🥉', '🥈', '🥇', '💎', '👑'];
const VIP_NAMES = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Royal'];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose, currentUsername }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<'balance' | 'wins' | 'bigwin' | 'games'>('balance');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen, type]);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leaderboard?type=${type}`);
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  const getDisplayValue = (entry: LeaderboardEntry) => {
    switch (type) {
      case 'wins': return `R${entry.totalWon?.toLocaleString() || 0}`;
      case 'bigwin': return `R${entry.biggestWin?.toLocaleString() || 0}`;
      case 'games': return `${entry.gamesPlayed || 0} games`;
      default: return `R${entry.balance?.toLocaleString() || 0}`;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'wins': return 'Total Won';
      case 'bigwin': return 'Biggest Win';
      case 'games': return 'Games Played';
      default: return 'Balance';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-2xl border border-yellow-400/30 shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            🏆 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Leaderboard</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">🇿🇦 South Africa's Top Players</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {[
            { key: 'balance', label: '💰 Balance' },
            { key: 'wins', label: '🎉 Total Won' },
            { key: 'bigwin', label: '🚀 Big Wins' },
            { key: 'games', label: '🎮 Games' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setType(tab.key as typeof type)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                type === tab.key
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard List */}
        <div className="overflow-y-auto max-h-[50vh] space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No players yet. Be the first!</div>
          ) : (
            leaderboard.map((entry, index) => {
              const isCurrentUser = entry.username === currentUsername;
              const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
              
              return (
                <div
                  key={entry.username}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    isCurrentUser
                      ? 'bg-yellow-500/20 border border-yellow-400/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-lg w-8 text-center ${index < 3 ? '' : 'text-gray-500 text-sm'}`}>
                      {rankEmoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${isCurrentUser ? 'text-yellow-400' : 'text-white'}`}>
                          {entry.username}
                        </span>
                        <span title={`VIP ${VIP_NAMES[entry.vipLevel - 1] || 'Bronze'}`}>
                          {VIP_BADGES[entry.vipLevel - 1] || '🥉'}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-yellow-500 text-black px-1 rounded">YOU</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{entry.gamesPlayed} games played</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono font-bold ${
                      index === 0 ? 'text-yellow-400' : 
                      index === 1 ? 'text-gray-300' :
                      index === 2 ? 'text-orange-400' : 'text-gray-400'
                    }`}>
                      {getDisplayValue(entry)}
                    </div>
                    <span className="text-[10px] text-gray-500 uppercase">{getTypeLabel()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors font-bold uppercase tracking-wider text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
};
