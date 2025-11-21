import React from 'react';
import { DealerEmotion } from '../types';

interface DealerChatProps {
  message: string;
  isThinking: boolean;
  isTipMode: boolean;
  onAskForTip: () => void;
  canAsk: boolean;
  emotion: DealerEmotion;
}

export const DealerChat: React.FC<DealerChatProps> = ({ 
  message, 
  isThinking, 
  isTipMode, 
  onAskForTip,
  canAsk,
  emotion
}) => {
  
  const getAvatar = () => {
    if (isTipMode) return '🔮';
    switch (emotion) {
        case 'WIN': return '🤑';
        case 'LOSS': return '😅';
        case 'SPINNING': return '🤞';
        case 'THINKING': return '🤔';
        default: return '🤵';
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto mt-4 perspective-1000 z-20">
      {/* Chat Bubble */}
      <div className={`
        relative rounded-2xl p-4 shadow-2xl border transition-all duration-500
        ${isTipMode 
          ? 'bg-purple-900/80 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.2)]' 
          : 'bg-black/70 border-yellow-600/30 shadow-black/50'}
      `}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className={`
              w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 transition-colors duration-500
              ${isTipMode ? 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300' : 'bg-gradient-to-br from-yellow-400 to-yellow-700 border-yellow-200'}
            `}>
              {getAvatar()}
            </div>
            {!isThinking && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${isTipMode ? 'text-purple-300' : 'text-yellow-500'}`}>
                {isTipMode ? 'AI Strategist' : 'The Dealer'}
              </h3>
              {canAsk && !isThinking && !isTipMode && (
                <button 
                  onClick={onAskForTip}
                  className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-0.5 rounded-full transition-transform hover:scale-105 animate-pulse"
                >
                  ✨ Ask AI
                </button>
              )}
            </div>

            <div className="min-h-[3rem] flex items-center">
              {isThinking ? (
                <div className="flex space-x-1.5 items-center">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s'}}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s'}}></div>
                </div>
              ) : (
                <p className={`
                  text-sm leading-relaxed italic animate-fade-in-up
                  ${isTipMode ? 'text-purple-100 font-medium' : 'text-gray-200'}
                `}>
                  "{message}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative glow behind */}
      {isTipMode && (
        <div className="absolute inset-0 bg-purple-500/20 blur-3xl -z-10 rounded-full animate-pulse-slow"></div>
      )}
    </div>
  );
};