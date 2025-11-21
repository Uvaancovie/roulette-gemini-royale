import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RouletteWheel } from './components/RouletteWheel';
import { BettingBoard } from './components/BettingBoard';
import { ChipSelector } from './components/ChipSelector';
import { StatsPanel } from './components/StatsPanel';
import { DealerChat } from './components/DealerChat';
import { GameControls } from './components/GameControls';
import { HistoryModal } from './components/HistoryModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { DealerCustomizationModal } from './components/DealerCustomizationModal';
import { BetType, ChipValue, GameHistory, PlacedBet, DealerEmotion, DealerAvatarConfig } from './types';
import { getNumberColor, getCoveredNumbers } from './constants';
import { getDealerCommentary, getStrategicTip } from './services/geminiService';
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
        relative p-1 rounded-2xl shadow-2xl transform scale-110 transition-all
        ${isWin ? 'bg-gradient-to-b from-yellow-500 to-yellow-700 animate-bounce-short' : 'bg-gradient-to-b from-red-900 to-gray-900 animate-shake-tilt'}
        ${isBigWin ? 'animate-gold-pulse' : ''}
      `}>
        <div className={`
          rounded-xl p-8 text-center border min-w-[320px]
          ${isWin ? 'bg-black border-yellow-400/50' : 'bg-gray-950 border-red-900/50'}
        `}>
          <div className="text-6xl mb-4">{isWin ? (isBigWin ? '🤑' : '🎉') : '💸'}</div>
          
          <h2 className={`text-4xl font-bold mb-2 uppercase tracking-widest ${isWin ? 'text-white' : 'text-red-500'}`}>
            {isWin ? 'You Won!' : 'You Lost'}
          </h2>
          
          <div className="my-6 space-y-3 bg-white/5 p-4 rounded-lg border border-white/10">
             <div className="flex justify-between text-sm text-gray-400 uppercase tracking-wider border-b border-white/10 pb-2">
                <span>Total Wager</span>
                <span className="font-mono text-white">${totalBet.toLocaleString()}</span>
             </div>
             <div className="flex justify-between text-sm text-gray-400 uppercase tracking-wider border-b border-white/10 pb-2">
                <span>Payout</span>
                <span className={`font-mono ${isWin ? 'text-yellow-400' : 'text-gray-500'}`}>
                  ${winnings.toLocaleString()}
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
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  
  // Win Animation State
  const [winIntensity, setWinIntensity] = useState(0);
  
  // Confirmation State
  const [confirmBets, setConfirmBets] = useState(false);
  const [pendingBet, setPendingBet] = useState<{type: BetType, target: number | string, payoutRatio: number} | null>(null);
  
  // AI Dealer State
  const [dealerMessage, setDealerMessage] = useState("Welcome to the high rollers table. Place your bets.");
  const [isDealerThinking, setIsDealerThinking] = useState(false);
  const [isTipMode, setIsTipMode] = useState(false);
  const [dealerEmotion, setDealerEmotion] = useState<DealerEmotion>('IDLE');
  const [dealerAvatarConfig, setDealerAvatarConfig] = useState<DealerAvatarConfig>({ type: 'PRESET', presetId: 'classic' });

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
    // Reset tip mode if user interacts
    if (isTipMode) setIsTipMode(false);
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

  // AI Features
  const handleAskForTip = async () => {
    if (isDealerThinking || isSpinning) return;
    
    setIsDealerThinking(true);
    setDealerEmotion('THINKING');
    setIsTipMode(true);
    
    const tip = await getStrategicTip(history, balance);
    
    setDealerMessage(tip);
    setIsDealerThinking(false);
    setDealerEmotion('IDLE');
  };

  // Spin Logic
  const spin = async () => {
    if (betActions.length === 0) {
      setDealerMessage("You must place a bet to play.");
      setIsTipMode(false);
      return;
    }
    if (isSpinning) return;

    // Save bets for Rebet functionality
    setPreviousBetActions([...betActions]);
    
    setIsSpinning(true);
    setWinAmount(null);
    setRoundResult(null);
    setWinIntensity(0);
    setIsTipMode(false);
    setDealerEmotion('SPINNING');
    
    // Trigger live commentary for spinning
    setIsDealerThinking(true);
    // Use current bets for context
    getDealerCommentary('SPINNING', null, false, 0, totalBetAmount, betActions, history).then(msg => {
       setDealerMessage(msg);
       setIsDealerThinking(false);
    });
    
    // Determine result
    const winningNumber = Math.floor(Math.random() * 37);
    setTargetNumber(winningNumber);
  };

  const handleSpinComplete = async () => {
    if (targetNumber === null) return;
    
    setIsSpinning(false);
    
    // Capture bets before clearing for analysis
    const playedBets = [...betActions];
    const playedTotalBet = totalBetAmount;

    // Calculate Winnings
    let totalWinnings = 0;
    const winningColor = getNumberColor(targetNumber);

    // Use betActions to calculate per-chip winning for accuracy
    currentAggregatedBets.forEach(bet => {
      let won = false;
      switch (bet.type) {
        case BetType.STRAIGHT: if (bet.target === targetNumber) won = true; break;
        case BetType.RED: if (winningColor === 'red') won = true; break;
        case BetType.BLACK: if (winningColor === 'black') won = true; break;
        case BetType.EVEN: if (targetNumber !== 0 && targetNumber % 2 === 0) won = true; break;
        case BetType.ODD: if (targetNumber !== 0 && targetNumber % 2 !== 0) won = true; break;
        case BetType.LOW: if (targetNumber >= 1 && targetNumber <= 18) won = true; break;
        case BetType.HIGH: if (targetNumber >= 19 && targetNumber <= 36) won = true; break;
        case BetType.DOZEN_1: if (targetNumber >= 1 && targetNumber <= 12) won = true; break;
        case BetType.DOZEN_2: if (targetNumber >= 13 && targetNumber <= 24) won = true; break;
        case BetType.DOZEN_3: if (targetNumber >= 25 && targetNumber <= 36) won = true; break;
        case BetType.COLUMN_1: if (targetNumber !== 0 && targetNumber % 3 === 1) won = true; break;
        case BetType.COLUMN_2: if (targetNumber !== 0 && targetNumber % 3 === 2) won = true; break;
        case BetType.COLUMN_3: if (targetNumber !== 0 && targetNumber % 3 === 0) won = true; break;
      }

      if (won) {
        totalWinnings += bet.amount + (bet.amount * bet.payoutRatio);
      }
    });

    // Update Balance
    setBalance(prev => prev + totalWinnings);
    
    // Update Histories
    const newEntry: GameHistory = { number: targetNumber, color: winningColor };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);

    // Detailed Session History
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const sessionEntry: HistoryEntry = {
      id: Date.now(),
      spinNumber: sessionHistory.length + 1,
      winningNumber: targetNumber,
      winningColor,
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
      setWinAmount(totalWinnings);
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
      newHistory
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
      <div className="fixed inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>

      <ResultOverlay result={roundResult} onClose={() => setRoundResult(null)} />
      
      <HistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={sessionHistory} />
      
      <DealerCustomizationModal 
        isOpen={isAvatarModalOpen} 
        onClose={() => setIsAvatarModalOpen(false)}
        currentConfig={dealerAvatarConfig}
        onSave={(config) => {
          setDealerAvatarConfig(config);
          setIsAvatarModalOpen(false);
          toast.success("Dealer avatar updated!");
        }}
      />

      <ConfirmationModal 
        isOpen={!!pendingBet} 
        betDetails={pendingBet ? { ...pendingBet, amount: selectedChip } : null}
        onConfirm={() => pendingBet && executeBet(pendingBet.type, pendingBet.target, pendingBet.payoutRatio)}
        onCancel={() => setPendingBet(null)}
      />

      {/* Header */}
      <header className="px-4 py-3 bg-black/60 flex justify-between items-center border-b border-white/10 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/20 animate-pulse"></div>
          <h1 className="hidden md:block text-lg md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500 tracking-widest uppercase">
            Covies Casino
          </h1>
          <h1 className="md:hidden text-lg font-black text-yellow-500 uppercase tracking-widest">CC</h1>
        </div>
        <div className="flex items-center gap-4">
           <button 
            onClick={() => setIsAvatarModalOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-gray-300 hover:text-yellow-400 border border-white/10"
            title="Customize Dealer"
          >
            ⚙️
          </button>
          <button 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-xs md:text-sm text-gray-300 hover:text-white"
          >
            <span>📜</span> <span className="hidden md:inline">History</span>
          </button>
          <div className="text-right bg-black/50 px-4 py-1 rounded-lg border border-white/10 shadow-inner">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Balance</p>
            <p className="text-lg md:text-xl font-mono font-bold text-green-400 drop-shadow-sm">
              ${balance.toLocaleString()}
            </p>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 p-2 md:p-4 flex flex-col items-center relative z-10 pb-32 md:pb-24">
        
        <DealerChat 
          message={dealerMessage} 
          isThinking={isDealerThinking} 
          isTipMode={isTipMode}
          onAskForTip={handleAskForTip}
          canAsk={!isSpinning}
          emotion={dealerEmotion}
          avatarConfig={dealerAvatarConfig}
          winAmount={winAmount}
        />

        <div className="my-4 md:my-8 w-full flex justify-center scale-75 md:scale-100 transition-transform -mb-8 md:mb-0">
          <RouletteWheel 
            targetNumber={targetNumber} 
            isSpinning={isSpinning} 
            onSpinComplete={handleSpinComplete}
            winIntensity={winIntensity}
          />
        </div>

        <div className="w-full max-w-5xl flex flex-col items-center gap-4">
          
          <div className="flex flex-col items-center w-full">
            <ChipSelector selectedChip={selectedChip} onSelect={setSelectedChip} />
            
            {/* Confirm Bet Toggle */}
            <div className="flex justify-center mt-2 mb-1">
              <label className="flex items-center space-x-2 cursor-pointer group" onClick={() => setConfirmBets(!confirmBets)}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${confirmBets ? 'bg-green-600 border-green-600' : 'border-gray-600 bg-black/40 group-hover:border-gray-400'}`}>
                  {confirmBets && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                </div>
                <span className="text-[10px] md:text-xs text-gray-400 group-hover:text-gray-300 select-none uppercase tracking-wider font-bold">Confirm bets</span>
              </label>
            </div>
          </div>

          <BettingBoard 
             onPlaceBet={handlePlaceBet} 
             onHoverBet={handleHoverBet}
             highlightedNumbers={highlightedNumbers}
             bets={currentAggregatedBets} 
             selectedChip={selectedChip}
          />

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
          />

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