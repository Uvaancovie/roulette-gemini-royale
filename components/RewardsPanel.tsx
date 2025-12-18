import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getApiUrl } from '../config/api';

interface RewardsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  username: string | null;
  freeSpins: number;
  referralCode: string;
  vipLevel: number;
  onRewardClaimed: (newBalance: number, newFreeSpins: number) => void;
}

const VIP_BADGES = ['🥉', '🥈', '🥇', '💎', '👑'];
const VIP_NAMES = ['Bronze', 'Silver', 'Gold', 'Diamond', 'Royal'];

export const RewardsPanel: React.FC<RewardsPanelProps> = ({
  isOpen,
  onClose,
  username,
  freeSpins,
  referralCode,
  vipLevel,
  onRewardClaimed
}) => {
  const [isClaimingDaily, setIsClaimingDaily] = useState(false);
  const [dailyMessage, setDailyMessage] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);

  const handleClaimDaily = async () => {
    if (!username) return;
    setIsClaimingDaily(true);
    setDailyMessage('');

    try {
      const response = await fetch(getApiUrl('/api/daily-bonus'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setDailyMessage(`🎁 Claimed R${data.bonusAmount} + ${data.bonusSpins} free spins!`);
        onRewardClaimed(data.newBalance, data.newFreeSpins);
      } else {
        setDailyMessage(`⏰ ${data.error}`);
      }
    } catch (error) {
      setDailyMessage('❌ Failed to claim. Try again!');
    }
    
    setIsClaimingDaily(false);
  };

  const handleShare = async (platform: string) => {
    if (!username) return;

    // Open share dialog
    const shareText = `🎰 I'm playing Covies Casino Roulette! Join with my code ${referralCode} for bonus Rands! 🇿🇦💰`;
    const shareUrl = window.location.href;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`, '_blank');
    }

    // Claim reward
    try {
      const response = await fetch(getApiUrl('/api/share-reward'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ platform })
      });
      
      const data = await response.json();
      if (response.ok) {
        onRewardClaimed(data.newBalance, data.newFreeSpins);
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to claim share reward');
      }
    } catch (error) {
      console.error('Share reward error:', error);
      toast.error('Network error. Please try again.');
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-gradient-to-b from-gray-900 to-black p-6 rounded-2xl border border-green-400/30 shadow-2xl max-w-md w-full mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            🎁 <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">Rewards & Bonuses</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Earn free Rands and spins! 🇿🇦</p>
        </div>

        {/* VIP Status */}
        <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-600/20 p-4 rounded-xl border border-yellow-500/30 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-gray-400 text-xs uppercase tracking-wider">VIP Level</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-3xl">{VIP_BADGES[vipLevel - 1] || '🥉'}</span>
                <span className="text-xl font-bold text-yellow-400">{VIP_NAMES[vipLevel - 1] || 'Bronze'}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-gray-400 text-xs uppercase tracking-wider">Free Spins</span>
              <div className="text-2xl font-bold text-green-400">{freeSpins}</div>
            </div>
          </div>
        </div>

        {/* Daily Bonus */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                ☀️ Daily Bonus
              </h3>
              <p className="text-xs text-gray-500">VIP {vipLevel}: R{500 * vipLevel} + {vipLevel} spins</p>
            </div>
            <button
              onClick={handleClaimDaily}
              disabled={isClaimingDaily}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 text-sm"
            >
              {isClaimingDaily ? '...' : 'Claim'}
            </button>
          </div>
          {dailyMessage && (
            <p className={`text-sm mt-2 ${dailyMessage.includes('Claimed') ? 'text-green-400' : 'text-yellow-400'}`}>
              {dailyMessage}
            </p>
          )}
        </div>

        {/* Referral Code */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            👥 Refer Friends
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Friends get R1,000 + 5 spins. You get R500 + 3 spins!
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-black/50 px-3 py-2 rounded-lg text-yellow-400 font-mono text-center border border-yellow-500/30">
              {referralCode || 'Login to get code'}
            </code>
            <button
              onClick={copyReferralCode}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-all text-sm"
            >
              {copiedReferral ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Social Share */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            📱 Share & Earn
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Share on social media for R100 + 1 free spin!
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all text-sm"
            >
              WhatsApp
            </button>
            <button
              onClick={() => handleShare('twitter')}
              className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-all text-sm"
            >
              Twitter
            </button>
            <button
              onClick={() => handleShare('facebook')}
              className="flex-1 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg transition-all text-sm"
            >
              Facebook
            </button>
          </div>
        </div>

        {/* Survey Placeholder */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-4 opacity-70">
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            📋 Surveys <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded">Coming Soon</span>
          </h3>
          <p className="text-xs text-gray-500">
            Complete surveys for R250-R500 + 2 free spins each!
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg transition-colors font-bold uppercase tracking-wider text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );
};
