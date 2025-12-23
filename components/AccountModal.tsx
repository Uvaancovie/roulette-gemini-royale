import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel?: () => void;
  username: string | null;
}

interface UserProfile {
  username: string;
  email: string;
  age: number;
  country: string;
  gender: string;
  bettingPreferences: {
    favoriteBetType: string;
    riskTolerance: string;
    preferredBetAmount: number;
    favoriteNumbers: number[];
  };
}

interface UserStats {
  username: string;
  balance: number;
  freeSpins: number;
  totalWon: number;
  gamesPlayed: number;
  biggestWin: number;
  referralCode: string;
  vipLevel: number;
  lastDailyBonus: string | null;
  history: Array<{
    result: number;
    wager: number;
    payout: number;
    timestamp: string;
  }>;
}

const VIP_BADGES = ['🥉', '🥈', '🥇', '💎', '👑'];
const VIP_NAMES = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Royal'];
const VIP_COLORS = ['text-gray-400', 'text-gray-300', 'text-yellow-400', 'text-blue-400', 'text-purple-400'];

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onCancel, username }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (isOpen && username) {
      fetchUserStats();
    }
  }, [isOpen, username]);

  const fetchUserStats = async () => {
    if (!username) return;
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/user'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setUserStats(data);
        // Extract profile data from user stats (assuming it's included)
        setUserProfile({
          username: data.username,
          email: data.email || '',
          age: data.age || 0,
          country: data.country || '',
          gender: data.gender || 'prefer-not-to-say',
          bettingPreferences: data.bettingPreferences || {
            favoriteBetType: 'RED',
            riskTolerance: 'medium',
            preferredBetAmount: 50,
            favoriteNumbers: []
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
    setIsLoading(false);
  };

  const calculateWinRate = () => {
    if (!userStats || userStats.gamesPlayed === 0) return 0;
    const totalWagered = userStats.history.reduce((sum, h) => sum + h.wager, 0);
    const totalPayout = userStats.history.reduce((sum, h) => sum + h.payout, 0);
    return totalPayout > 0 ? ((totalPayout / totalWagered) * 100) : 0;
  };

  const getRecentHistory = () => {
    if (!userStats) return [];
    return userStats.history.slice(-5).reverse(); // Last 5 games, most recent first
  };

  const startEditing = () => {
    if (userProfile) {
      setEditForm({ ...userProfile });
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({});
  };

  const handleBackToLogin = () => {
    setIsEditing(false);
    setEditForm({});
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const saveProfile = async () => {
    if (!editForm) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl('/api/user/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        setUserProfile(updatedData.profile);
        setIsEditing(false);
        // Refresh stats in case anything changed
        fetchUserStats();
        // Show success message
        import('react-hot-toast').then(({ toast }) => {
          toast.success('Profile updated successfully!');
        });
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Failed to update profile';
        import('react-hot-toast').then(({ toast }) => {
          toast.error(errorMsg);
        });
        console.error('Profile update error:', errorMsg);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to server. Make sure the backend is running on port 5003.';
      import('react-hot-toast').then(({ toast }) => {
        toast.error(errorMsg);
      });
    }
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={handleBackToLogin}>
      <div
        className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-yellow-400/30 shadow-2xl w-full sm:w-full md:max-w-2xl mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 flex-shrink-0">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex flex-col sm:flex-row items-center justify-center gap-2">
              👤 <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Account Overview</span>
            </h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">🇿🇦 {username}'s Casino Stats</p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto scroll-smooth flex-1 px-4 sm:px-6 [&::-webkit-scrollbar]:w-3 [&::-webkit-scrollbar-track]:bg-black/60 [&::-webkit-scrollbar-thumb]:bg-yellow-500/60 [&::-webkit-scrollbar-thumb]:rounded-lg hover:[&::-webkit-scrollbar-thumb]:bg-yellow-400/80">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading account data...</div>
          ) : userStats ? (
            <div className="space-y-6 pb-4">
            {/* Profile Information */}
            <div className="bg-gradient-to-r from-blue-900/30 to-cyan-600/20 p-3 sm:p-4 rounded-xl border border-cyan-500/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
                <h3 className="text-base sm:text-lg font-bold text-white">👤 Profile Information</h3>
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
                    <button
                      onClick={cancelEditing}
                      className="flex-1 sm:flex-none px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfile}
                      disabled={isLoading}
                      className="flex-1 sm:flex-none px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-1">Username</label>
                      <input
                        type="text"
                        value={editForm.username || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-1">Age</label>
                      <input
                        type="number"
                        value={editForm.age || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                        min="18"
                        max="120"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-1">Country</label>
                      <input
                        type="text"
                        value={editForm.country || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm text-gray-400 mb-1">Gender</label>
                      <select
                        value={editForm.gender || 'prefer-not-to-say'}
                        onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-600 rounded text-white text-xs sm:text-sm focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="prefer-not-to-say">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm text-gray-400 mb-2">Betting Preferences</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={editForm.bettingPreferences?.favoriteBetType || 'RED'}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          bettingPreferences: {
                            favoriteBetType: e.target.value,
                            riskTolerance: prev.bettingPreferences?.riskTolerance || 'medium',
                            preferredBetAmount: prev.bettingPreferences?.preferredBetAmount || 50,
                            favoriteNumbers: prev.bettingPreferences?.favoriteNumbers || []
                          }
                        }))}
                        className="px-2 py-1 bg-black/50 border border-gray-600 rounded text-white text-xs focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="RED">Red</option>
                        <option value="BLACK">Black</option>
                        <option value="STRAIGHT">Straight</option>
                        <option value="EVEN">Even</option>
                        <option value="ODD">Odd</option>
                      </select>
                      
                      <select
                        value={editForm.bettingPreferences?.riskTolerance || 'medium'}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          bettingPreferences: {
                            favoriteBetType: prev.bettingPreferences?.favoriteBetType || 'RED',
                            riskTolerance: e.target.value,
                            preferredBetAmount: prev.bettingPreferences?.preferredBetAmount || 50,
                            favoriteNumbers: prev.bettingPreferences?.favoriteNumbers || []
                          }
                        }))}
                        className="px-2 py-1 bg-black/50 border border-gray-600 rounded text-white text-xs focus:border-cyan-400 focus:outline-none"
                      >
                        <option value="low">Low Risk</option>
                        <option value="medium">Medium Risk</option>
                        <option value="high">High Risk</option>
                      </select>
                      
                      <input
                        type="number"
                        value={editForm.bettingPreferences?.preferredBetAmount || 50}
                        onChange={(e) => setEditForm(prev => ({
                          ...prev,
                          bettingPreferences: {
                            favoriteBetType: prev.bettingPreferences?.favoriteBetType || 'RED',
                            riskTolerance: prev.bettingPreferences?.riskTolerance || 'medium',
                            preferredBetAmount: parseInt(e.target.value),
                            favoriteNumbers: prev.bettingPreferences?.favoriteNumbers || []
                          }
                        }))}
                        className="px-2 py-1 bg-black/50 border border-gray-600 rounded text-white text-xs focus:border-cyan-400 focus:outline-none"
                        min="1"
                        max="1000"
                        placeholder="Bet Amount"
                      />
                    </div>
                  </div>
                </div>
              ) : userProfile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-400">Username:</span>
                      <span className="text-white ml-2">{userProfile.username}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Age:</span>
                      <span className="text-white ml-2">{userProfile.age}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Country:</span>
                      <span className="text-white ml-2">{userProfile.country}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gender:</span>
                      <span className="text-white ml-2">{userProfile.gender}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-gray-400 text-sm">Betting Preferences:</span>
                    <div className="mt-1 text-xs text-cyan-300">
                      Favorite: {userProfile.bettingPreferences.favoriteBetType} • 
                      Risk: {userProfile.bettingPreferences.riskTolerance} • 
                      Preferred Bet: R{userProfile.bettingPreferences.preferredBetAmount}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* VIP Status & Basic Info */}
            <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-600/20 p-3 sm:p-4 rounded-xl border border-yellow-500/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{VIP_BADGES[userStats.vipLevel - 1] || '🥉'}</span>
                  <div>
                    <div className="text-xl font-bold text-white">{userStats.username}</div>
                    <div className={`text-sm font-semibold ${VIP_COLORS[userStats.vipLevel - 1] || 'text-gray-400'}`}>
                      {VIP_NAMES[userStats.vipLevel - 1] || 'Bronze'} VIP
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Referral Code</div>
                  <div className="text-sm font-mono text-yellow-400 bg-black/50 px-2 py-1 rounded">
                    {userStats.referralCode}
                  </div>
                </div>
              </div>

              {/* Key Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">R{userStats.balance.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{userStats.freeSpins}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Free Spins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{userStats.gamesPlayed}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Games Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">R{userStats.totalWon.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Total Won</div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  📊 Performance
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Biggest Win:</span>
                    <span className="text-green-400 font-mono">R{userStats.biggestWin.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className="text-blue-400 font-mono">{calculateWinRate().toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avg. Bet:</span>
                    <span className="text-yellow-400 font-mono">
                      R{userStats.gamesPlayed > 0 ? (userStats.history.reduce((sum, h) => sum + h.wager, 0) / userStats.gamesPlayed).toFixed(0) : 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  🎯 Recent Games
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {getRecentHistory().length === 0 ? (
                    <div className="text-gray-500 text-sm">No games played yet</div>
                  ) : (
                    getRecentHistory().map((game, index) => {
                      const netResult = game.payout - game.wager;
                      const isWin = netResult > 0;
                      return (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-400">#{game.result}</span>
                          <span className={`font-mono ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                            {netResult > 0 ? '+' : ''}R{netResult.toLocaleString()}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* VIP Progress */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                ⭐ VIP Progress
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Current Level:</span>
                  <span className={`font-bold ${VIP_COLORS[userStats.vipLevel - 1] || 'text-gray-400'}`}>
                    {VIP_NAMES[userStats.vipLevel - 1] || 'Bronze'}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (userStats.gamesPlayed / (userStats.vipLevel * 100)) * 100)}%`
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  {userStats.vipLevel < 5 ? `${(userStats.vipLevel * 100) - userStats.gamesPlayed} games to next level` : 'Max VIP level reached!'}
                </div>
              </div>
            </div>

            {/* Daily Bonus Status */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                ☀️ Daily Bonus
              </h3>
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400">
                    {userStats.lastDailyBonus ? 'Last claimed:' : 'Never claimed'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userStats.lastDailyBonus ? new Date(userStats.lastDailyBonus).toLocaleDateString() : 'Claim your first bonus!'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-400 font-bold">
                    R{500 * userStats.vipLevel} + {userStats.vipLevel} spins
                  </div>
                  <div className="text-xs text-gray-500">Next reward value</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-red-400">Failed to load account data</div>
        )}
        </div>

        {/* Back to Login Button - Fixed */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-2 flex-shrink-0 border-t border-white/10">
          <button
            onClick={handleBackToLogin}
            className="w-full mt-4 sm:mt-6 py-2 sm:py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors font-bold uppercase tracking-wider text-xs sm:text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
