import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getApiUrl } from './config/api';
import { RouletteWheel } from './components/RouletteWheel';
import { BettingBoard } from './components/BettingBoard';
import { ChipSelector } from './components/ChipSelector';
import { StatsPanel } from './components/StatsPanel';
import { DealerChat } from './components/DealerChat';
import { GameControls } from './components/GameControls';
import { HistoryModal } from './components/HistoryModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { LoadingScreen } from './components/LoadingScreen';
import { LoginModal } from './components/LoginModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { RewardsPanel } from './components/RewardsPanel';
import { AccountModal } from './components/AccountModal';
import { BetAnalysisChat } from './components/BetAnalysisChat';
import { BetType, ChipValue, GameHistory, PlacedBet, DealerEmotion } from './types';
import { getNumberColor, getCoveredNumbers } from './constants';
import { getDealerCommentary } from './services/geminiService';
import { Toaster, toast } from 'react-hot-toast';

interface RoundResult {
  totalBet: number;
  winnings: number;
}

// Custom alert/toast component overlay for Round Results
const ResultOverlay: React.FC<{ result: RoundResult | null, onClose: () => void }> = ({ result, onClose }) => {
  if (!result) return null;
  
  const { totalBet, winnings } = result;
  const isWin = winnings > 0;
  const isBigWin = isWin && winnings >= totalBet * 3; // Simple heuristic for big win styling
  const netResult = winnings - totalBet;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div className={`
        relative p-1 rounded-2xl shadow-2xl transform scale-110 transition-all mx-4
        ${isWin ? 'bg-gradient-to-b from-yellow-500 to-yellow-700 animate-bounce-short' : 'bg-gradient-to-b from-red-900 to-gray-900 animate-shake-tilt'}
        ${isBigWin ? 'animate-gold-pulse' : ''}
      `}>
        <div className={`
          rounded-xl p-8 text-center border min-w-[280px] md:min-w-[320px]
          ${isWin ? 'bg-black border-yellow-400/50' : 'bg-gray-950 border-red-900/50'}
        `}>
          <div className="text-6xl mb-4">{isWin ? (isBigWin ? '🤑' : '🎉') : '💸'}</div>
          
          <h2 className={`text-3xl md:text-4xl font-bold mb-2 uppercase tracking-widest ${isWin ? 'text-white' : 'text-red-500'}`}>
            {isWin ? 'You Won!' : 'You Lost'}
          </h2>
          
          <div className="my-6 space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
             <div className="flex justify-between text-sm text-gray-400 uppercase tracking-wider border-b border-white/10 pb-2">
                <span>Total Wager</span>
                <span className="font-mono text-white">R{totalBet.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-sm text-gray-400 uppercase tracking-wider border-b border-white/10 pb-2">
                <span>Payout</span>
                <span className={`font-mono ${isWin ? 'text-yellow-400' : 'text-gray-500'}`}>
                  R{winnings.toLocaleString()}
                </span>
             </div>
             <div className="flex justify-between text-xl font-bold pt-1">
                <span>Net Result</span>
                <span className={`font-mono ${netResult >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                  {netResult > 0 ? '+' : ''}{netResult.toLocaleString()}
                </span>
             </div>
          </div>

          <p className="text-gray-500 mt-6 text-xs animate-pulse uppercase font-bold tracking-widest">Tap anywhere to continue</p>
        </div>
      </div>
    </div>
  );
};

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

const App: React.FC = () => {
  // Login State
  const [user, setUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  
  // Rewards State
  const [freeSpins, setFreeSpins] = useState(0);
  const [referralCode, setReferralCode] = useState('');
  const [vipLevel, setVipLevel] = useState(1);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isBetAnalysisOpen, setIsBetAnalysisOpen] = useState(false);
  const [useFreeSpins, setUseFreeSpins] = useState(false);
  
  // Game State
  const [balance, setBalance] = useState(1000);
  const [betActions, setBetActions] = useState<PlacedBet[]>([]);
  const [selectedChip, setSelectedChip] = useState<ChipValue>(25);
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [sessionHistory, setSessionHistory] = useState<HistoryEntry[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  
  // Result State
  const [winAmount, setWinAmount] = useState<number | null>(null); // For dealer/board effects
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null); // For overlay
  
  const [previousBetActions, setPreviousBetActions] = useState<PlacedBet[]>([]);
  const [highlightedNumbers, setHighlightedNumbers] = useState<Set<number>>(new Set());
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  // Avatar customization removed - dealer now uses a default avatar
  
  // Loading State
  const [isLoading, setIsLoading] = useState(true);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simulate initial loading
  useEffect(() => {
    const checkLogin = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          // Verify token is still valid by fetching user data
          const response = await fetch(getApiUrl('/api/user'), {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setAuthToken(storedToken);
            setUser(userData);
            setBalance(data.balance);
            setFreeSpins(data.freeSpins || 0);
            setReferralCode(data.referralCode || '');
            setVipLevel(data.vipLevel || 1);
            setHistory(data.history.map((h: any) => ({ number: h.result, color: getNumberColor(h.result) })));
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkLogin();
  }, []);
  
  // Win Animation State
  const [winIntensity, setWinIntensity] = useState(0);
  
  // Confirmation State
  const [confirmBets, setConfirmBets] = useState(false);
  const [pendingBet, setPendingBet] = useState<{type: BetType, target: number | string, payoutRatio: number} | null>(null);
  
  // AI Dealer State
  const [dealerMessage, setDealerMessage] = useState("Welcome to the high rollers table. Place your bets.");
  const [isDealerThinking, setIsDealerThinking] = useState(false);
  const [dealerEmotion, setDealerEmotion] = useState<DealerEmotion>('IDLE');
  // Dealer avatar customization disabled - default behavior

  // Derived State: Aggregated bets for display
  const currentAggregatedBets = useMemo(() => {
    const map = new Map<string, PlacedBet>();
    betActions.forEach(action => {
      const key = `${action.type}-${action.target}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        map.set(key, { ...existing, amount: existing.amount + action.amount });
      } else {
        map.set(key, { ...action });
      }
    });
    return Array.from(map.values());
  }, [betActions]);

  const totalBetAmount = betActions.reduce((sum, bet) => sum + bet.amount, 0);

  // Core Bet Execution Logic
  const executeBet = (type: BetType, target: number | string, payoutRatio: number) => {
    setBalance(prev => prev - selectedChip);
    
    const newBet: PlacedBet = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      target,
      amount: selectedChip,
      payoutRatio
    };
    
    setBetActions(prev => [...prev, newBet]);
    setDealerEmotion('IDLE');
    setPendingBet(null);
  };

  // Betting Actions
  const handlePlaceBet = (type: BetType, target: number | string, payoutRatio: number) => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      toast.error("Insufficient funds!");
      return;
    }

    if (confirmBets) {
      setPendingBet({ type, target, payoutRatio });
    } else {
      executeBet(type, target, payoutRatio);
    }
  };

  const handleUndo = () => {
    if (betActions.length === 0 || isSpinning) return;
    const lastBet = betActions[betActions.length - 1];
    setBalance(prev => prev + lastBet.amount);
    setBetActions(prev => prev.slice(0, -1));
  };

  const handleClearBets = () => {
    if (isSpinning || betActions.length === 0) return;
    setBalance(prev => prev + totalBetAmount);
    setBetActions([]);
  };

  const handleDouble = () => {
    if (isSpinning || betActions.length === 0) return;
    
    const needed = totalBetAmount;
    if (balance < needed) {
      toast.error("Not enough balance to double!");
      return;
    }

    setBalance(prev => prev - needed);
    // Duplicate every action
    const newActions = betActions.map(b => ({...b, id: Math.random().toString(36).substr(2,9)}));
    setBetActions(prev => [...prev, ...newActions]);
    toast.success("Bets doubled!");
  };

  const handleRebet = () => {
    if (isSpinning || previousBetActions.length === 0 || betActions.length > 0) return;
    
    const needed = previousBetActions.reduce((s, b) => s + b.amount, 0);
    if (balance < needed) {
      toast.error("Not enough balance to rebet!");
      return;
    }

    setBalance(prev => prev - needed);
    // Recreate actions with new IDs to act as fresh bets
    const newActions = previousBetActions.map(b => ({...b, id: Math.random().toString(36).substr(2,9)}));
    setBetActions(newActions);
    toast.success("Bets repeated!");
  };

  // Highlighting Logic
  const handleHoverBet = (type: BetType | null, target: number | string | null) => {
    if (type && target !== null) {
      const nums = getCoveredNumbers(type, target);
      setHighlightedNumbers(new Set(nums));
    } else {
      setHighlightedNumbers(new Set());
    }
  };

  // Spin Logic
  const spin = async () => {
    if (betActions.length === 0) {
      setDealerMessage("You must place a bet to play.");
      return;
    }
    if (isSpinning || !user) return;

    // Check if using free spins or have sufficient balance
    const canUseFreeSpins = useFreeSpins && freeSpins > 0;
    if (!canUseFreeSpins && balance < totalBetAmount) {
      setDealerMessage("Eish! Not enough Rands. Check out the Rewards panel for free spins! 🎁");
      return;
    }

    // Save bets for Rebet functionality
    setPreviousBetActions([...betActions]);
    
    setIsSpinning(true);
    setWinAmount(null);
    setRoundResult(null);
    setWinIntensity(0);
    setDealerEmotion('SPINNING');
    
    // Trigger live commentary for spinning
    setIsDealerThinking(true);
    getDealerCommentary('SPINNING', null, false, 0, totalBetAmount, betActions, history, user?.username, user?.age, user?.country).then(msg => {
       setDealerMessage(msg);
       setIsDealerThinking(false);
    });
    
    try {
      // Call the backend
      const response = await fetch(getApiUrl('/api/spin'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          bets: betActions,
          useFreeSpins: canUseFreeSpins
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Spin failed');
      }

      // Update state with server response
      setBalance(data.balance);
      setFreeSpins(data.freeSpins);
      if (data.vipLevel) setVipLevel(data.vipLevel);
      setTargetNumber(data.winningNumber);
      
      // Show free spin notification
      if (data.usedFreeSpin) {
        toast.success('🎰 Free spin used! ' + (freeSpins - 1) + ' remaining');
      }
      
      // Store the winnings for later use in handleSpinComplete
      setWinAmount(data.totalWinnings);
      
    } catch (error) {
      console.error("Spin failed", error);
      setIsSpinning(false);
      setDealerEmotion('IDLE');
      setDealerMessage("Connection error. Please try again.");
      return;
    }
  };

  const handleSpinComplete = async () => {
    if (targetNumber === null || winAmount === null) return;
    
    setIsSpinning(false);
    
    // Capture bets before clearing for analysis
    const playedBets = [...betActions];
    const playedTotalBet = totalBetAmount;

    // Use server-calculated winnings
    const totalWinnings = winAmount;
    
    // Update Histories
    const newEntry: GameHistory = { number: targetNumber, color: getNumberColor(targetNumber) };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);

    // Detailed Session History (for display only, since server handles persistence)
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const sessionEntry: HistoryEntry = {
      id: Date.now(),
      spinNumber: sessionHistory.length + 1,
      winningNumber: targetNumber,
      winningColor: getNumberColor(targetNumber),
      totalBet: playedTotalBet,
      totalWon: totalWinnings,
      netResult: totalWinnings - playedTotalBet,
      timestamp: timeString
    };
    setSessionHistory([sessionEntry, ...sessionHistory]);

    // Set Result for Overlay (Both win and loss)
    setRoundResult({ totalBet: playedTotalBet, winnings: totalWinnings });

    // Win Feedback & Emotion
    let currentWinIntensity = 0;
    if (totalWinnings > 0) {
      setDealerEmotion('WIN');
      
      // Calculate Intensity (1 = Standard, 2 = Big)
      const winRatio = totalWinnings / (playedTotalBet || 1);
      if (winRatio > 3 || totalWinnings >= 500) {
        currentWinIntensity = 2;
      } else {
        currentWinIntensity = 1;
      }
    } else {
      setDealerEmotion('LOSS');
      currentWinIntensity = 0;
    }
    setWinIntensity(currentWinIntensity);

    // Clear Bets
    setBetActions([]);

    // AI Commentary (Result Phase)
    setIsDealerThinking(true);
    const comment = await getDealerCommentary(
      'RESULT',
      targetNumber,
      totalWinnings > 0,
      totalWinnings,
      playedTotalBet,
      playedBets,
      newHistory,
      user?.username,
      user?.age,
      user?.country
    );
    setDealerMessage(comment);
    setIsDealerThinking(false);
    
    // Reset emotion after a delay
    setTimeout(() => {
      if (!isSpinning) {
         setDealerEmotion('IDLE');
         setWinIntensity(0);
      }
    }, 5000);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <LoginModal
      isOpen={true}
      onLogin={(token, userData) => {
        setAuthToken(token);
        setUser(userData);
        setBalance(userData.balance);
        setFreeSpins(userData.freeSpins || 0);
        setReferralCode(userData.referralCode || '');
        setVipLevel(userData.vipLevel || 1);
        setHistory(userData.history.map((h: any) => ({ number: h.result, color: getNumberColor(h.result) })));
      }}
      onClose={() => {}}
    />;
  }

  return (
    <div className="min-h-screen bg-felt-900 text-white flex flex-col font-sans relative overflow-x-hidden">
      <Toaster position="top-center" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
          border: '1px solid #444',
        },
      }} />
      
      {/* Background Texture */}
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-repeat z-0" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/felt.png')" }}></div>

      <ResultOverlay result={roundResult} onClose={() => setRoundResult(null)} />
      
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={sessionHistory} />
      
      <LeaderboardModal 
        isOpen={isLeaderboardOpen} 
        onClose={() => setIsLeaderboardOpen(false)} 
        currentUsername={user?.username}
      />
      
      <RewardsPanel 
        isOpen={isRewardsOpen} 
        onClose={() => setIsRewardsOpen(false)}
        username={user?.username}
        freeSpins={freeSpins}
        referralCode={referralCode}
        vipLevel={vipLevel}
        onRewardClaimed={(newBalance, newFreeSpins) => {
          setBalance(newBalance);
          setFreeSpins(newFreeSpins);
        }}
      />
      
      <AccountModal 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)}
        username={user?.username}
      />
      
      <BetAnalysisChat
        isVisible={isBetAnalysisOpen}
        onClose={() => setIsBetAnalysisOpen(false)}
        bets={currentAggregatedBets}
        totalBet={totalBetAmount}
        balance={balance}
        history={history}
        userName={user?.username}
        userPreferences={user?.bettingPreferences}
      />
      
      {/* Dealer customization modal removed - default avatar used */}

      <ConfirmationModal 
        isOpen={!!pendingBet} 
        betDetails={pendingBet ? { ...pendingBet, amount: selectedChip } : null}
        onConfirm={() => pendingBet && executeBet(pendingBet.type, pendingBet.target, pendingBet.payoutRatio)}
        onCancel={() => setPendingBet(null)}
      />

      {/* Header */}
      <header className="px-4 py-3 bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-md sticky top-0 z-50 shadow-2xl shadow-yellow-500/10 border-b border-yellow-500/20">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/20 flex items-center justify-center">
              <span className="text-xl">🎰</span>
            </div>
            <div>
              <h1 className="hidden md:block text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 tracking-widest uppercase">
                Covies Casino
              </h1>
              <h1 className="md:hidden text-lg font-black text-yellow-500 uppercase tracking-widest">CC</h1>
              <span className="text-[10px] text-gray-500">🇿🇦</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Balance & Free Spins - Always Visible */}
            <div className="bg-black/50 px-4 py-2 rounded-lg border border-white/10 shadow-inner backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</p>
                  <p className="text-xl font-mono font-bold text-green-400 drop-shadow-sm">
                    R{balance.toLocaleString()}
                  </p>
                </div>
                {freeSpins > 0 && (
                  <div className="border-l border-white/10 pl-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Free</p>
                    <p className="text-xl font-mono font-bold text-yellow-400">{freeSpins}🎰</p>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setIsRewardsOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-green-900/50 hover:bg-green-800/60 transition-all duration-200 text-xs text-green-400 hover:text-green-300 border border-green-500/30 hover:border-green-400/50"
              title="Rewards & Bonuses"
            >
              <span>🎁</span> <span>Rewards</span>
            </button>
            
            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-yellow-900/50 hover:bg-yellow-800/60 transition-all duration-200 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-500/30 hover:border-yellow-400/50"
              title="Leaderboard"
            >
              <span>🏆</span> <span>Top</span>
            </button>
            
            <button 
              onClick={() => setIsAccountOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-blue-900/50 hover:bg-blue-800/60 transition-all duration-200 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50"
              title="Account Overview"
            >
              <span>👤</span> <span>Account</span>
            </button>
            
            <button 
              onClick={() => setIsBetAnalysisOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-cyan-900/50 hover:bg-cyan-800/60 transition-all duration-200 text-xs text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50"
              title="Bet Analysis & Probabilities"
            >
              <span>🤖</span> <span>Analysis</span>
            </button>
            
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-all duration-200 text-xs text-gray-300 hover:text-white border border-white/10 hover:border-white/20"
            >
              <span>📜</span> <span>History</span>
            </button>
            
            {/* Customize Dealer removed - default dealer now used */}
            
            <button 
              onClick={() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                setAuthToken(null);
                setUser(null);
                setBalance(1000);
                setFreeSpins(0);
                setReferralCode('');
                setVipLevel(1);
                setBetActions([]);
                setHistory([]);
                setSessionHistory([]);
                toast.success('Logged out successfully!');
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-full bg-red-900/50 hover:bg-red-800/60 transition-all duration-200 text-xs text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-400/50"
              title="Logout"
            >
              <span>🚪</span> <span>Logout</span>
            </button>
          </div>

          {/* Mobile - Balance & Hamburger */}
          <div className="flex lg:hidden items-center gap-3">
            {/* Mobile Balance Display */}
            <div className="bg-black/50 px-2 py-1.5 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div>
                  <p className="text-[8px] text-gray-400 uppercase">Balance</p>
                  <p className="text-sm font-mono font-bold text-green-400">R{balance.toLocaleString()}</p>
                </div>
                {freeSpins > 0 && (
                  <div className="border-l border-white/10 pl-2">
                    <p className="text-[8px] text-gray-400 uppercase">Free</p>
                    <p className="text-sm font-mono font-bold text-yellow-400">{freeSpins}🎰</p>
                  </div>
                )}
              </div>
            </div>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10"
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1.5">
                <span className={`w-5 h-0.5 bg-yellow-400 transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`w-5 h-0.5 bg-yellow-400 transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`w-5 h-0.5 bg-yellow-400 transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute left-0 right-0 top-full bg-gradient-to-b from-gray-900 to-black border-b border-yellow-500/20 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="p-4 space-y-2">
              <button 
                onClick={() => { setIsRewardsOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-green-900/30 hover:bg-green-800/40 transition-all text-green-400 border border-green-500/20"
              >
                <span className="text-xl">🎁</span>
                <span className="font-semibold">Rewards & Bonuses</span>
              </button>
              
              <button 
                onClick={() => { setIsLeaderboardOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-yellow-900/30 hover:bg-yellow-800/40 transition-all text-yellow-400 border border-yellow-500/20"
              >
                <span className="text-xl">🏆</span>
                <span className="font-semibold">Leaderboard</span>
              </button>
              
              <button 
                onClick={() => { setIsAccountOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-900/30 hover:bg-blue-800/40 transition-all text-blue-400 border border-blue-500/20"
              >
                <span className="text-xl">👤</span>
                <span className="font-semibold">Account Overview</span>
              </button>
              
              <button 
                onClick={() => { setIsBetAnalysisOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-900/30 hover:bg-cyan-800/40 transition-all text-cyan-400 border border-cyan-500/20"
              >
                <span className="text-xl">🤖</span>
                <span className="font-semibold">Bet Analysis</span>
              </button>
              
              <button 
                onClick={() => { setIsHistoryOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-gray-300 border border-white/10"
              >
                <span className="text-xl">📜</span>
                <span className="font-semibold">Game History</span>
              </button>
              
              {/* Customize Dealer removed from mobile menu */}
              
              <div className="border-t border-white/10 my-2"></div>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('authToken');
                  localStorage.removeItem('user');
                  setAuthToken(null);
                  setUser(null);
                  setBalance(1000);
                  setFreeSpins(0);
                  setReferralCode('');
                  setVipLevel(1);
                  setBetActions([]);
                  setHistory([]);
                  setSessionHistory([]);
                  setIsMobileMenuOpen(false);
                  toast.success('Logged out successfully!');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-900/30 hover:bg-red-800/40 transition-all text-red-400 border border-red-500/20"
              >
                <span className="text-xl">🚪</span>
                <span className="font-semibold">Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Game Area */}
      <main className="flex-1 p-2 md:p-4 lg:p-6 flex flex-col items-center relative z-10 pb-32 md:pb-24 w-full max-w-[100vw] overflow-x-hidden">
        
        {/* Dealer Chat - More Prominent on Mobile */}
        <div className="w-full max-w-4xl px-2 md:px-0">
          <DealerChat 
            message={dealerMessage} 
            isThinking={isDealerThinking} 
            emotion={dealerEmotion}
            winAmount={winAmount}
            userName={user?.username}
            userAge={user?.age}
            userCountry={user?.country}
          />
        </div>

        {/* Responsive Wheel Container */}
        <div className="my-3 md:my-6 lg:my-8 w-full flex justify-center transition-all duration-500 ease-out transform">
          <div className="relative">
            {/* Glow Effect for Wheel */}
            {isSpinning && (
              <div className="absolute inset-0 blur-2xl bg-yellow-400/20 animate-pulse rounded-full scale-110"></div>
            )}
            <RouletteWheel 
              targetNumber={targetNumber} 
              isSpinning={isSpinning} 
              onSpinComplete={handleSpinComplete}
              winIntensity={winIntensity}
            />
          </div>
        </div>

        {/* Game Controls Container - Optimized Layout */}
        <div className="w-full max-w-6xl flex flex-col items-center gap-3 md:gap-4 lg:gap-6">
          
          {/* Chip Selector - Prominent Position */}
          <div className="flex flex-col items-center w-full px-2 md:px-4">
            <div className="relative">
              {/* Decorative Background for Chip Selector */}
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/10 via-yellow-500/20 to-yellow-600/10 blur-xl rounded-full"></div>
              <ChipSelector selectedChip={selectedChip} onSelect={setSelectedChip} />
            </div>
            
            {/* Confirm Bet Toggle - Enhanced Design */}
            <div className="flex justify-center mt-3 mb-2">
              <label className="flex items-center space-x-2 cursor-pointer group px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 border border-white/5 hover:border-white/10 transition-all" onClick={() => setConfirmBets(!confirmBets)}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                  confirmBets 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-400 shadow-lg shadow-green-500/30' 
                    : 'border-gray-500 bg-black/40 group-hover:border-gray-400 group-hover:bg-black/50'
                }`}>
                  {confirmBets && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
                <span className="text-xs md:text-sm text-gray-300 group-hover:text-white select-none uppercase tracking-wide font-semibold transition-colors">Confirm bets</span>
              </label>
            </div>
          </div>

          {/* Betting Board - Responsive Container */}
          <div className="w-full flex justify-center relative">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-radial from-green-900/20 via-transparent to-transparent blur-3xl pointer-events-none"></div>
            <BettingBoard 
               onPlaceBet={handlePlaceBet} 
               onHoverBet={handleHoverBet}
               highlightedNumbers={highlightedNumbers}
               bets={currentAggregatedBets} 
               selectedChip={selectedChip}
            />
          </div>

          {/* Game Controls - Enhanced Mobile Experience */}
          <div className="w-full relative">
            {/* Glow for Spin Button */}
            {betActions.length > 0 && !isSpinning && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-16 bg-yellow-500/20 blur-3xl animate-pulse pointer-events-none"></div>
            )}
            <GameControls 
              onSpin={spin}
              onClear={handleClearBets}
              onUndo={handleUndo}
              onDouble={handleDouble}
              onRebet={handleRebet}
              isSpinning={isSpinning}
              hasBets={betActions.length > 0}
              canRebet={previousBetActions.length > 0 && betActions.length === 0}
              totalBet={totalBetAmount}
              freeSpins={freeSpins}
              useFreeSpins={useFreeSpins}
              onToggleFreeSpins={() => setUseFreeSpins(!useFreeSpins)}
            />
          </div>

        </div>
      </main>
      
      {/* Fixed Stats Panel */}
      <div className="fixed bottom-0 left-0 right-0 z-40 w-full shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <StatsPanel history={history} />
      </div>
      
    </div>
  );
};

export default App;