import React, { useState, useEffect, useRef } from 'react';
import { PlacedBet, GameHistory, BetType } from '../types';
import { getBetAnalysis } from '../services/geminiService';
import { PAYOUTS } from '../constants';

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface BetAnalysisChatProps {
  bets: PlacedBet[];
  totalBet: number;
  balance: number;
  history: GameHistory[];
  isVisible: boolean;
  onClose: () => void;
  userName?: string;
  userPreferences?: {
    favoriteBetType: string;
    riskTolerance: string;
    preferredBetAmount: number;
    favoriteNumbers: number[];
  };
}

interface BetStatistics {
  type: string;
  amount: number;
  numbers: number;
  probability: number;
  expectedReturn: number;
  maxPayout: number;
}

export const BetAnalysisChat: React.FC<BetAnalysisChatProps> = ({
  bets,
  totalBet,
  balance,
  history,
  isVisible,
  onClose,
  userName,
  userPreferences
}) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisKey, setLastAnalysisKey] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAnalysisSheet, setShowAnalysisSheet] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Generate a key based on current bets to avoid re-analyzing the same bets
  const currentAnalysisKey = JSON.stringify(bets.map(b => ({ type: b.type, target: b.target, amount: b.amount })));

  // Calculate bet statistics
  const calculateBetStats = (): BetStatistics[] => {
    const stats: BetStatistics[] = [];
    
    bets.forEach(bet => {
      let numbers = 0;
      
      switch (bet.type) {
        case BetType.STRAIGHT:
          numbers = 1;
          break;
        case BetType.RED:
        case BetType.BLACK:
          numbers = 18;
          break;
        case BetType.EVEN:
        case BetType.ODD:
        case BetType.LOW:
        case BetType.HIGH:
          numbers = 18;
          break;
        case BetType.DOZEN_1:
        case BetType.DOZEN_2:
        case BetType.DOZEN_3:
          numbers = 12;
          break;
        case BetType.COLUMN_1:
        case BetType.COLUMN_2:
        case BetType.COLUMN_3:
          numbers = 12;
          break;
        default:
          numbers = 1;
      }

      const probability = (numbers / 37) * 100;
      const payout = PAYOUTS[bet.type];
      const maxPayout = bet.amount * (payout + 1);
      const expectedReturn = (bet.amount * (payout + 1) * (numbers / 37)) - bet.amount;

      stats.push({
        type: bet.type.replace(/_/g, ' '),
        amount: bet.amount,
        numbers,
        probability,
        expectedReturn,
        maxPayout
      });
    });

    return stats;
  };

  const betStats = calculateBetStats();
  const totalProbabilityOfWin = betStats.reduce((sum, stat) => sum + stat.probability, 0);
  const totalExpectedReturn = betStats.reduce((sum, stat) => sum + stat.expectedReturn, 0);
  const totalMaxPayout = betStats.reduce((sum, stat) => sum + stat.maxPayout, 0);
  const riskLevel = totalBet > balance * 0.2 ? 'HIGH' : totalBet > balance * 0.1 ? 'MEDIUM' : 'LOW';
  
  // History analysis
  const recentHistory = history.slice(-10);
  const redCount = recentHistory.filter(h => h.color === 'red').length;
  const blackCount = recentHistory.filter(h => h.color === 'black').length;
  const greenCount = recentHistory.filter(h => h.color === 'green').length;

  useEffect(() => {
    if (isVisible && bets.length > 0 && currentAnalysisKey !== lastAnalysisKey) {
      performAnalysis();
    }
  }, [isVisible, currentAnalysisKey, lastAnalysisKey]);

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await getBetAnalysis(bets, totalBet, balance, history, undefined, undefined, userPreferences);
      setAnalysis(result);
      setLastAnalysisKey(currentAnalysisKey);
      
      // Add initial analysis as a system message
      if (chatMessages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          text: `🎯 Welcome${userName ? ` ${userName}` : ''}! I've analyzed your current bets. The house edge is 2.7%, but with smart play, you can turn those odds in your favor. What would you like to know about your betting strategy?`,
          isUser: false,
          timestamp: new Date()
        };
        setChatMessages([welcomeMessage]);
      }
    } catch (error) {
      setAnalysis('❌ Analysis failed. Please try again.');
    }
    setIsAnalyzing(false);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      // Get analysis with chat context
      const response = await getBetAnalysis(bets, totalBet, balance, history, currentMessage, chatMessages.slice(-5), userPreferences);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't process your question right now. But remember, fortune favors the bold! 💪",
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }

    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-cyan-400/30 shadow-2xl w-full h-full md:h-[90vh] lg:max-w-7xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-white">Bet Analysis Engine</h2>
              <p className="text-xs text-cyan-400">Probability Calculator & Strategy Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnalysisSheet(!showAnalysisSheet)}
              className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 rounded-lg text-xs font-semibold transition-colors"
            >
              {showAnalysisSheet ? '💬 Chat' : '📊 Analysis'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Analysis Sheet - Desktop: Left Side, Mobile: Toggle */}
          {(showAnalysisSheet || window.innerWidth >= 1024) && (
            <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-cyan-500/20 overflow-y-auto p-4 md:p-6 bg-black/20">
              <div className="space-y-4">
                
                {/* Overview Card */}
                <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl p-4 border border-cyan-500/20">
                  <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📊</span> Bet Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Total Wagered</p>
                      <p className="text-xl font-bold text-white">R{totalBet.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Active Bets</p>
                      <p className="text-xl font-bold text-cyan-400">{bets.length}</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Max Payout</p>
                      <p className="text-xl font-bold text-green-400">R{totalMaxPayout.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/40 rounded-lg p-3">
                      <p className="text-xs text-gray-400 mb-1">Risk Level</p>
                      <p className={`text-xl font-bold ${
                        riskLevel === 'HIGH' ? 'text-red-400' : 
                        riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                      }`}>{riskLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Probability Analysis */}
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-500/20">
                  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>🎯</span> Probability Analysis
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Win Probability</span>
                      <span className="text-lg font-bold text-purple-400">{Math.min(totalProbabilityOfWin, 100).toFixed(2)}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${Math.min(totalProbabilityOfWin, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm text-gray-300">House Edge</span>
                      <span className="text-sm font-bold text-red-400">2.7%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Expected Return</span>
                      <span className={`text-sm font-bold ${totalExpectedReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        R{totalExpectedReturn.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent History */}
                {recentHistory.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 rounded-xl p-4 border border-yellow-500/20">
                    <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span>🔥</span> Recent Trends (Last 10 Spins)
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-red-900/40 rounded-lg p-2 text-center border border-red-500/30">
                        <p className="text-xs text-red-300">Red</p>
                        <p className="text-lg font-bold text-white">{redCount}</p>
                      </div>
                      <div className="bg-gray-800 rounded-lg p-2 text-center border border-gray-600">
                        <p className="text-xs text-gray-300">Black</p>
                        <p className="text-lg font-bold text-white">{blackCount}</p>
                      </div>
                      <div className="bg-green-900/40 rounded-lg p-2 text-center border border-green-500/30">
                        <p className="text-xs text-green-300">Zero</p>
                        <p className="text-lg font-bold text-white">{greenCount}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recentHistory.map((h, i) => (
                        <div
                          key={i}
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                            h.color === 'red' ? 'bg-red-600 border-red-400' :
                            h.color === 'black' ? 'bg-gray-800 border-gray-600' :
                            'bg-green-600 border-green-400'
                          }`}
                        >
                          {h.number}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Bet Breakdown */}
                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-xl p-4 border border-blue-500/20">
                  <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>📋</span> Bet Breakdown
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {betStats.map((stat, index) => (
                      <div key={index} className="bg-black/40 rounded-lg p-3 border border-white/5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm font-bold text-white">{stat.type}</p>
                            <p className="text-xs text-gray-400">{stat.numbers} number{stat.numbers > 1 ? 's' : ''} covered</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-cyan-400">R{stat.amount}</p>
                            <p className="text-xs text-gray-400">{stat.probability.toFixed(1)}% chance</p>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Max Win:</span>
                          <span className="text-green-400 font-semibold">R{stat.maxPayout}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/20">
                  <h3 className="text-sm font-bold text-green-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>💡</span> Smart Recommendations
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {totalBet > balance * 0.3 && (
                      <li className="flex items-start gap-2">
                        <span className="text-red-400">⚠️</span>
                        <span>You're wagering over 30% of your balance. Consider reducing bet sizes.</span>
                      </li>
                    )}
                    {betStats.length > 5 && (
                      <li className="flex items-start gap-2">
                        <span className="text-yellow-400">💡</span>
                        <span>You have {betStats.length} active bets. Focusing on fewer positions may improve your odds.</span>
                      </li>
                    )}
                    {totalProbabilityOfWin < 20 && (
                      <li className="flex items-start gap-2">
                        <span className="text-blue-400">🎯</span>
                        <span>Low coverage ({totalProbabilityOfWin.toFixed(1)}%). Consider adding outside bets for better hit rate.</span>
                      </li>
                    )}
                    {riskLevel === 'LOW' && (
                      <li className="flex items-start gap-2">
                        <span className="text-green-400">✅</span>
                        <span>Conservative betting detected. Your bankroll is well-protected!</span>
                      </li>
                    )}
                  </ul>
                </div>

              </div>
            </div>
          )}

          {/* Chat Interface - Desktop: Right Side, Mobile: Toggle */}
          {(!showAnalysisSheet || window.innerWidth >= 1024) && (
            <div className="flex-1 flex flex-col bg-black/30 lg:w-1/2">
              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
              >
                {chatMessages.length === 0 && !isAnalyzing && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">🎯</div>
                    <p>Place some bets and ask me anything about your strategy!</p>
                    <p className="text-xs mt-2">I'll analyze probabilities and give you winning tips 💡</p>
                  </div>
                )}

                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      message.isUser 
                        ? 'bg-cyan-600 text-white' 
                        : 'bg-gray-700 text-cyan-100'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700 text-cyan-100 rounded-lg px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-cyan-500/20">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your bets, strategy, or odds..."
                    className="flex-1 px-3 py-2 bg-black/50 border border-cyan-500/30 rounded-lg text-white placeholder-gray-500 focus:border-cyan-400 focus:outline-none text-sm"
                    disabled={isTyping}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm font-semibold"
                  >
                    {isTyping ? '...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <span>💡 Ask me anything about your betting strategy!</span>
          <span>House Edge: 2.7% • European Roulette</span>
        </div>
      </div>
    </div>
  );
};